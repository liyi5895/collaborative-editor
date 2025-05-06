from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import uuid
from datetime import datetime
import os

# Create FastAPI app
app = FastAPI(title="Collaborative Document Editor API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for documents and chat messages
# In a production environment, this would be replaced with a database
documents = {}
chat_history = {}
document_versions = {}

# Models
class DocumentCreate(BaseModel):
    title: str
    content: str

class DocumentUpdate(BaseModel):
    content: str

class Document(BaseModel):
    id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

class DocumentVersion(BaseModel):
    id: str
    document_id: str
    content: str
    created_at: datetime

class ChatMessage(BaseModel):
    content: str
    role: str  # "user" or "ai"

class ChatMessageCreate(BaseModel):
    content: str
    model: Optional[str] = None

class AIResponse(BaseModel):
    message: str
    suggestions: Optional[List[Dict[str, Any]]] = None

# Routes
@app.get("/")
async def root():
    return {"message": "Welcome to the Collaborative Document Editor API"}

@app.post("/documents", response_model=Document)
async def create_document(document: DocumentCreate):
    doc_id = str(uuid.uuid4())
    now = datetime.now()
    new_document = {
        "id": doc_id,
        "title": document.title,
        "content": document.content,
        "created_at": now,
        "updated_at": now
    }
    documents[doc_id] = new_document
    
    # Initialize chat history for this document
    chat_history[doc_id] = []
    
    # Create initial version
    version_id = str(uuid.uuid4())
    document_versions[doc_id] = [{
        "id": version_id,
        "document_id": doc_id,
        "content": document.content,
        "created_at": now
    }]
    
    return new_document

@app.get("/documents", response_model=List[Document])
async def get_documents():
    return list(documents.values())

@app.get("/documents/{document_id}", response_model=Document)
async def get_document(document_id: str):
    if document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    return documents[document_id]

@app.put("/documents/{document_id}", response_model=Document)
async def update_document(document_id: str, document_update: DocumentUpdate):
    if document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    documents[document_id]["content"] = document_update.content
    documents[document_id]["updated_at"] = datetime.now()
    
    # Create a new version
    version_id = str(uuid.uuid4())
    document_versions[document_id].append({
        "id": version_id,
        "document_id": document_id,
        "content": document_update.content,
        "created_at": datetime.now()
    })
    
    return documents[document_id]

@app.get("/documents/{document_id}/versions", response_model=List[DocumentVersion])
async def get_document_versions(document_id: str):
    if document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document_id not in document_versions:
        return []
    
    return document_versions[document_id]

from app.ai_assistant import process_query

@app.post("/documents/{document_id}/chat", response_model=AIResponse)
async def create_chat_message(document_id: str, message: ChatMessageCreate):
    if document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Add user message to chat history
    if document_id not in chat_history:
        chat_history[document_id] = []
    
    chat_history[document_id].append({
        "content": message.content,
        "role": "user",
        "timestamp": datetime.now()
    })
    
    # Process with AI and generate response using LangChain and LangGraph
    document_content = documents[document_id]["content"]
    chat_messages = [
        {"role": msg["role"], "content": msg["content"]} 
        for msg in chat_history[document_id]
    ]
    
    # Get the model from the request or use the default
    from app.ai_assistant import DEFAULT_MODEL
    model = message.model or DEFAULT_MODEL
    
    ai_response = process_query(
        document_content=document_content,
        chat_history=chat_messages,
        query=message.content,
        model=model
    )
    
    # Add AI response to chat history
    chat_history[document_id].append({
        "content": ai_response["message"],
        "role": "ai",
        "timestamp": datetime.now()
    })
    
    return ai_response

@app.get("/documents/{document_id}/chat", response_model=List[ChatMessage])
async def get_chat_history(document_id: str):
    if document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document_id not in chat_history:
        return []
    
    return chat_history[document_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
