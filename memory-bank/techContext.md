# Technical Context

## Technologies Used

### Frontend
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript for improved developer experience
- **Slate.js**: Framework for building rich text editors
- **React Query**: Data fetching and state management library
- **Axios**: HTTP client for API requests
- **Tailwind CSS**: Utility-first CSS framework for styling

### Backend
- **Python**: Programming language for backend development
- **FastAPI**: Modern, high-performance web framework for building APIs
- **LangChain**: Framework for developing applications powered by language models
- **LangGraph**: Framework for building stateful, multi-step workflows with LLMs
- **Pydantic**: Data validation and settings management using Python type annotations
- **Uvicorn**: ASGI server for running the FastAPI application

### Development Tools
- **Node.js**: JavaScript runtime for frontend development
- **npm**: Package manager for JavaScript
- **Docker**: Containerization platform for application deployment
- **Docker Compose**: Tool for defining and running multi-container Docker applications

## Development Setup

### Prerequisites
- Node.js (v14+)
- Python (v3.9+)
- Docker and Docker Compose (optional)

### Frontend Setup
1. Navigate to the frontend directory
2. Install dependencies with `npm install`
3. Run the development server:
   - On Windows: `start.bat`
   - On macOS/Linux: `chmod +x start.sh && ./start.sh`

### Backend Setup
1. Navigate to the backend directory
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run the server: `python run.py`

### Docker Setup
1. From the project root, run `docker-compose up`
2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Technical Constraints

### Frontend
1. **Browser Compatibility**: The application targets modern browsers (Chrome, Firefox, Safari, Edge)
2. **Node.js Version**: The application requires Node.js v14+ due to dependencies
3. **OpenSSL Compatibility**: Node.js 18 uses a newer version of OpenSSL, requiring the `NODE_OPTIONS=--openssl-legacy-provider` environment variable

### Backend
1. **Python Version**: The application requires Python 3.9+ for compatibility with dependencies
2. **API Design**: The backend follows RESTful API design principles
3. **Data Storage**: Currently uses in-memory storage, which means data is lost when the server restarts

### AI Integration
1. **Model Limitations**: The AI assistant uses mock responses in the current implementation
2. **Response Time**: AI processing may introduce latency in the chat interface
3. **Suggestion Quality**: The quality of AI suggestions depends on the underlying model and prompt engineering

## Dependencies

### Frontend Dependencies
- **@tanstack/react-query**: For data fetching and caching
- **axios**: For HTTP requests
- **slate**: Core library for the rich text editor
- **slate-react**: React components for Slate
- **slate-history**: History tracking for Slate
- **tailwindcss**: For styling

### Backend Dependencies
- **fastapi**: Web framework
- **uvicorn**: ASGI server
- **pydantic**: Data validation
- **langchain**: LLM application framework
- **langgraph**: Workflow management for LLMs

## API Structure

### Document Endpoints
- `GET /documents`: Retrieve all documents
- `POST /documents`: Create a new document
- `GET /documents/{document_id}`: Retrieve a specific document
- `PUT /documents/{document_id}`: Update a document
- `GET /documents/{document_id}/versions`: Get document version history

### Chat Endpoints
- `GET /documents/{document_id}/chat`: Get chat history for a document
- `POST /documents/{document_id}/chat`: Send a message and get AI response

## Data Models

### Document
```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}
```

### Document Version
```typescript
interface DocumentVersion {
  id: string;
  document_id: string;
  content: string;
  created_at: string;
}
```

### Chat Message
```typescript
interface ChatMessage {
  content: string;
  role: string; // "user" or "ai"
  timestamp?: string;
}
```

### AI Suggestion
```typescript
interface Suggestion {
  type: string; // "addition", "deletion", or "modification"
  content: string;
  position: number;
  reason?: string;
}
```

## Tool Usage Patterns

### Slate.js Editor
- Custom element renderers for different block types (headings, paragraphs, lists)
- Custom leaf renderers for text formatting (bold, italic, underline, code)
- Custom serialization/deserialization for document content
- Editor toolbar for formatting controls

### React Query
- Queries for fetching documents and chat history
- Mutations for creating and updating documents
- Mutations for sending chat messages
- Query invalidation for refreshing data after mutations

### LangChain and LangGraph
- State management for AI assistant conversations
- Document content analysis for generating suggestions
- Structured output parsing for AI responses
