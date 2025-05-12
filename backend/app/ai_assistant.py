from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_core.runnables import RunnablePassthrough
from langchain_core.messages import HumanMessage, AIMessage
from typing import List, Dict, Any, Optional, Tuple
from langgraph.graph import StateGraph, END
import os
import json
import requests
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Get OpenRouter API key from environment variables
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Available models
AVAILABLE_MODELS = {
    "claude-3.7-sonnet": "anthropic/claude-3.7-sonnet",
    "gpt-4o-mini": "openai/gpt-4o-mini"
}

# Default model
DEFAULT_MODEL = "claude-3.7-sonnet"

SYSTEM_PROMPT = """You are an AI assistant helping with a document. 
Analyze the document content and provide helpful responses.

IMPORTANT: Only suggest changes that are EXPLICITLY requested by the user. Do not add additional suggestions unless specifically asked.

Your response should be in JSON format with a 'message' field and a 'suggestions' field.

Each suggestion should have:
- 'type': "addition", "deletion", "modification", or "replace_all"
- 'block_index': The index of the block to modify (as shown in [])
- 'content': The text to add, delete, or use as replacement
- 'reason': Why you're suggesting this change

CRITICAL RULES FOR BLOCK INDICES:
1. Block indices are ZERO-BASED - the first block has index 0, the second has index 1, etc.
2. Block indices MUST match exactly the numbers shown in square brackets [n] at the beginning of each line
3. Block indices must be less than the total number of blocks
4. Double-check all block indices before returning them
5. If you're unsure about a block index, do not include that suggestion
6. Never invent or estimate block indices - use only the exact indices shown in the document

EXAMPLES:
- If you want to modify the first block (with [0] prefix), use block_index: 0
- If you want to modify the second block (with [1] prefix), use block_index: 1

IMPORTANT FOR NEW OR MINIMAL DOCUMENTS:
For new or minimal documents (e.g., documents with just a placeholder or empty content),
ALWAYS use type: "replace_all" instead of trying to modify specific blocks. This ensures
the entire document is replaced with your suggested content and avoids block index issues.

For complete document rewrites, use type: "replace_all" instead of a block_index."""

# Define the state for the LangGraph
class DocumentAssistantState(BaseModel):
    document_content: str
    chat_history: List[Dict[str, Any]]
    current_query: str
    suggestions: Optional[List[Dict[str, Any]]] = None
    response: Optional[str] = None

# Define the output schema for the AI suggestions
class DocumentSuggestion(BaseModel):
    type: str = Field(description="Type of suggestion: 'addition', 'deletion', 'modification', or 'replace_all'")
    block_index: Optional[int] = Field(description="The index of the block to modify (0-based)", default=None)
    content: str = Field(description="The content to be added, deleted, or used as replacement")
    reason: str = Field(description="Explanation for why this suggestion is being made")

class AIAssistantResponse(BaseModel):
    message: str = Field(description="The AI assistant's response to the user's query")
    suggestions: List[DocumentSuggestion] = Field(description="List of suggested changes to the document")

def create_error_response(message: str, error: Optional[Exception] = None) -> Dict[str, Any]:
    """Create a standardized error response"""
    error_msg = f"{message}: {str(error)}" if error else message
    return {
        "message": error_msg,
        "suggestions": []
    }

def call_openrouter_api(prompt: str, model: str = DEFAULT_MODEL) -> Dict[str, Any]:
    """
    Call the OpenRouter API to get a response from the specified LLM model.
    
    Args:
        prompt: The prompt to send to the LLM
        model: The model to use (default: DEFAULT_MODEL)
    
    Returns:
        Dict containing the LLM response
    """
    if not OPENROUTER_API_KEY:
        return create_error_response("OpenRouter API key not found. Please set the OPENROUTER_API_KEY environment variable.")
    
    # Get the full model identifier from the available models
    model_id = AVAILABLE_MODELS.get(model, AVAILABLE_MODELS[DEFAULT_MODEL])
    
    # Prepare the API request
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": model_id,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "response_format": {"type": "json_object"}
    }
    
    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data
        )
        response.raise_for_status()
        
        result = response.json()
        
        # Extract the content from the response
        if "choices" in result and len(result["choices"]) > 0:
            content = result["choices"][0]["message"]["content"]
            
            # Strip markdown code block formatting if present
            content_to_parse = content
            if content.startswith("```") and "```" in content[3:]:
                print("Detected markdown code block, attempting to strip formatting")
                # Find the end of the opening backticks
                start_idx = content.find("\n", 3) + 1
                # Find the closing backticks
                end_idx = content.rfind("```")
                if start_idx > 0 and end_idx > start_idx:
                    content_to_parse = content[start_idx:end_idx].strip()
                    print(f"Stripped content: {content_to_parse}")
            
            # Parse the JSON content
            try:
                parsed_content = json.loads(content_to_parse)
                return parsed_content
            except json.JSONDecodeError as e:
                print(f"Raw content: {content}")
                
                # Try to extract message from the content if it's markdown-formatted
                # if "message" in content and "suggestions" in content:
                #     try:
                #         # Simple extraction of message value using string manipulation
                #         message_start = content.find('"message"') + 10  # 10 = len('"message":')
                #         message_start = content.find('"', message_start) + 1
                #         message_end = content.find('"', message_start)
                #         extracted_message = content[message_start:message_end]
                #         return {
                #             "message": extracted_message,
                #             "suggestions": []
                #         }
                #     except Exception as ex:
                #         print(f"Error extracting message: {ex}")
                
                return create_error_response("I'm sorry, a JSON decode error occurred", e)
        else:
            return create_error_response("I'm sorry, the response is malformed. Please try again")
    except Exception as e:
        print(f"Error calling OpenRouter API: {str(e)}")
        return create_error_response("I'm sorry, there was an error processing your request", e)

def parse_document_blocks(document_content: str) -> Tuple[List[str], Dict[int, int]]:
    """Parse document content into blocks and their indices"""
    document_lines = []
    block_indices = {}
    
    print("Parsing document content:", document_content)  # Debug log
    
    lines = document_content.split('\n')
    for line in lines:
        match = re.match(r'\[BLOCK:(\d+)\](.*)', line)
        if match:
            block_id = int(match.group(1))
            content = match.group(2)
            block_indices[len(document_lines)] = block_id
            document_lines.append(content)
            print(f"Found block {block_id} at index {len(document_lines)-1}")  # Debug log
        else:
            # Log when we find a line without a block ID
            print(f"Warning: Line without block ID: {line}")  # Debug log
            document_lines.append(line)
            
    print("Final block_indices:", block_indices)  # Debug log
    print("Number of document lines:", len(document_lines))  # Debug log
    return document_lines, block_indices

# Create a function to generate AI responses
def generate_response(state: DocumentAssistantState):
    """Generate a response from the AI assistant based on the document content and user query."""
    # Format the chat history for context
    formatted_history = ""
    for message in state.chat_history:
        role = message.get("role", "")
        content = message.get("content", "")
        formatted_history += f"{role.upper()}: {content}\n"
    
    # Parse document with block IDs
    document_lines, block_indices = parse_document_blocks(state.document_content)

    # Format document with block indices, handling missing indices
    formatted_document = ""
    for i, line in enumerate(document_lines):
        # Use get() with a fallback to the line index if no block ID exists
        block_id = block_indices.get(i, i)
        formatted_document += f"[{block_id}] {line}\n"

    # Create the prompt for the LLM
    prompt = f"""
        DOCUMENT CONTENT (with block indices):
        {formatted_document}

        CHAT HISTORY:
        {formatted_history}

        USER QUERY:
        {state.current_query}

        Based on the document content and the user's query, provide a helpful response.
        
        {SYSTEM_PROMPT}
    """
    
    # Get the model from the state if available, otherwise use the default
    model = getattr(state, "model", DEFAULT_MODEL)
    
    # Call the OpenRouter API
    llm_response = call_openrouter_api(prompt, model)
    
    # Update the state with the response and suggestions
    state.response = llm_response.get("message", "I'm sorry, I couldn't process your request.")
    state.suggestions = llm_response.get("suggestions", [])
    
    return state

# Define the LangGraph workflow
def create_document_assistant_graph():
    """Create a LangGraph for the document assistant workflow."""
    # Define the graph
    workflow = StateGraph(DocumentAssistantState)
    
    # Add nodes to the graph
    workflow.add_node("generate_response", generate_response)
    
    # Define the edges
    workflow.add_edge("generate_response", END)
    
    # Set the entry point
    workflow.set_entry_point("generate_response")
    
    # Compile the graph
    return workflow.compile()

def validate_suggestions(suggestions: List[Dict[str, Any]], total_blocks: int) -> List[Dict[str, Any]]:
    """Validate suggestions against document structure"""
    validated_suggestions = []
    
    print(f"Validating suggestions against document with {total_blocks} blocks")
    
    for suggestion in suggestions:
        # Always allow replace_all suggestions
        if suggestion.get('type') in ['replace_all', 'replace all']:
            validated_suggestions.append(suggestion)
            continue
            
        # Get the block index
        block_index = suggestion.get('block_index')
        
        # Skip suggestions without a block index
        if block_index is None:
            print(f"Skipping suggestion without block_index: {suggestion}")
            continue
            
        # Validate that block_index is a non-negative integer within range
        if not isinstance(block_index, int) or block_index < 0 or block_index >= total_blocks:
            print(f"Invalid block_index {block_index} (must be 0-{total_blocks-1}): {suggestion}")
            continue
            
        # Add valid suggestion to the list
        validated_suggestions.append(suggestion)
    
    print(f"Filtered {len(suggestions) - len(validated_suggestions)} invalid suggestions")
    return validated_suggestions

# Function to process a user query
def process_query(document_content: str, chat_history: List[Dict[str, Any]], query: str, model: str = DEFAULT_MODEL) -> Dict[str, Any]:
    """
    Process a user query and return an AI response with suggestions.
    
    Args:
        document_content: The content of the document
        chat_history: The chat history
        query: The user's query
        model: The LLM model to use (default: DEFAULT_MODEL)
    
    Returns:
        Dict containing the AI response and suggestions
    """
    # Create the initial state
    state = DocumentAssistantState(
        document_content=document_content,
        chat_history=chat_history,
        current_query=query,
        model=model  # Add the model to the state
    )
    
    # Create the graph
    graph = create_document_assistant_graph()
    
    # Run the graph
    result = graph.invoke(state)
    
    # Extract the final state from the result dictionary
    # The key should be the name of the last node executed, which is 'generate_response'
    try:
        message = result["response"]
        suggestions = result["suggestions"]
        
        # Use the same block parsing logic as generate_response
        document_lines, _ = parse_document_blocks(document_content)
        validated_suggestions = validate_suggestions(suggestions, len(document_lines))
        
        return {
            "message": message,
            "suggestions": validated_suggestions
        }
    except Exception as e:
        print(f"Error extracting result: {e}")
        print(f"Unexpected result structure: {result}")
        return create_error_response("I'm sorry, I couldn't process your request")
