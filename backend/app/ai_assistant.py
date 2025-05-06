from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_core.runnables import RunnablePassthrough
from langchain_core.messages import HumanMessage, AIMessage
from typing import List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
import os
import json

# Define the state for the LangGraph
class DocumentAssistantState(BaseModel):
    document_content: str
    chat_history: List[Dict[str, Any]]
    current_query: str
    suggestions: Optional[List[Dict[str, Any]]] = None
    response: Optional[str] = None

# Define the output schema for the AI suggestions
class DocumentSuggestion(BaseModel):
    type: str = Field(description="Type of suggestion: 'addition', 'deletion', or 'modification'")
    content: str = Field(description="The content to be added, deleted, or used as replacement")
    position: int = Field(description="The position in the document where this suggestion applies")
    reason: str = Field(description="Explanation for why this suggestion is being made")

class AIAssistantResponse(BaseModel):
    message: str = Field(description="The AI assistant's response to the user's query")
    suggestions: List[DocumentSuggestion] = Field(description="List of suggested changes to the document")

# Create a function to generate AI responses
def generate_response(state: DocumentAssistantState):
    """Generate a response from the AI assistant based on the document content and user query."""
    # In a production environment, this would use a real LLM
    # For now, we'll use a placeholder implementation
    
    # Format the chat history for context
    formatted_history = ""
    for message in state.chat_history:
        role = message.get("role", "")
        content = message.get("content", "")
        formatted_history += f"{role.upper()}: {content}\n"
    
    # Create a prompt template
    prompt = ChatPromptTemplate.from_template(
        """You are an AI assistant helping with a document.
        
        DOCUMENT CONTENT:
        {document_content}
        
        CHAT HISTORY:
        {chat_history}
        
        USER QUERY:
        {current_query}
        
        Based on the document content and the user's query, provide a helpful response.
        Also suggest any changes to the document that might improve it.
        
        Your response should be in JSON format with a 'message' field and a 'suggestions' field.
        Each suggestion should have a 'type' (addition, deletion, or modification),
        'content' (the text to add, delete, or use as replacement),
        'position' (where in the document to apply the change), and
        'reason' (why you're suggesting this change).
        """
    )
    
    # For demonstration purposes, we'll create a mock response
    # In a real implementation, this would call an LLM
    mock_response = {
        "message": f"I've analyzed your document and your query: '{state.current_query}'",
        "suggestions": [
            {
                "type": "addition",
                "content": "This is a suggested addition to your document.",
                "position": 0,
                "reason": "Adding an introduction would make the document clearer."
            },
            {
                "type": "modification",
                "content": "This is a suggested modification.",
                "position": len(state.document_content) // 2,
                "reason": "This change would improve the clarity of your main point."
            }
        ]
    }
    
    # Update the state with the response and suggestions
    state.response = mock_response["message"]
    state.suggestions = mock_response["suggestions"]
    
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
def process_query(document_content: str, chat_history: List[Dict[str, Any]], query: str) -> Dict[str, Any]:
    """Process a user query and return an AI response with suggestions."""
    # Create the initial state
    state = DocumentAssistantState(
        document_content=document_content,
        chat_history=chat_history,
        current_query=query
    )
    
    # Create the graph
    graph = create_document_assistant_graph()
    
    # Run the graph
    result = graph.invoke(state)
    
    # Based on LangGraph documentation, result should be a dictionary
    # For debugging
    print(f"LangGraph result type: {type(result)}")
    
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
