from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_core.runnables import RunnablePassthrough
from langchain_core.messages import HumanMessage, AIMessage
from typing import List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
import os
import json
import requests
from dotenv import load_dotenv

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
        raise ValueError("OpenRouter API key not found. Please set the OPENROUTER_API_KEY environment variable.")
    
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
                "content": """You are an AI assistant helping with a document. 
                Analyze the document content and provide helpful responses.
                Also suggest changes to improve the document.
                Your response should be in JSON format with a 'message' field and a 'suggestions' field.
                
                Each suggestion should have:
                - 'type': "addition", "deletion", "modification", or "replace_all"
                - 'block_index': The index of the block to modify (as shown in [])
                - 'content': The text to add, delete, or use as replacement
                - 'reason': Why you're suggesting this change
                
                For complete document rewrites, use type: "replace_all" instead of a block_index."""
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
            # Parse the JSON content
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # If the response is not valid JSON, create a fallback response
                return {
                    "message": content,
                    "suggestions": []
                }
        else:
            return {
                "message": "I'm sorry, I couldn't process your request.",
                "suggestions": []
            }
    except Exception as e:
        print(f"Error calling OpenRouter API: {str(e)}")
        return {
            "message": f"I'm sorry, there was an error processing your request: {str(e)}",
            "suggestions": []
        }

# Create a function to generate AI responses
def generate_response(state: DocumentAssistantState):
    """Generate a response from the AI assistant based on the document content and user query."""
    # Format the chat history for context
    formatted_history = ""
    for message in state.chat_history:
        role = message.get("role", "")
        content = message.get("content", "")
        formatted_history += f"{role.upper()}: {content}\n"
    
    # Format document with block indices
    document_lines = state.document_content.split('\n')
    formatted_document = "\n".join([f"[{i}] {line}" for i, line in enumerate(document_lines)])
    
    # Create the prompt for the LLM
    prompt = f"""
        DOCUMENT CONTENT (with block indices):
        {formatted_document}

        CHAT HISTORY:
        {formatted_history}

        USER QUERY:
        {state.current_query}

        Based on the document content and the user's query, provide a helpful response.
        Also suggest any changes to the document that might improve it.
        
        For any suggested changes, specify:
        - type: "addition", "deletion", "modification", or "replace_all"
        - block_index: The index of the block to modify (as shown in [])
        - content: The text to add, delete, or use as replacement
        - reason: Why you're suggesting this change
        
        For complete document rewrites, use type: "replace_all" instead of a block_index.
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
        return {
            "message": result["response"],
            "suggestions": result["suggestions"]
        }
    except:
        # Fallback in case the result structure is different
        print(f"Unexpected result structure: {result}")
        return {
            "message": "I'm sorry, I couldn't process your request.",
            "suggestions": []
        }
