# System Patterns

## System Architecture

The Collaborative Editor follows a client-server architecture with a clear separation between the frontend and backend components:

```
┌─────────────────┐      ┌─────────────────┐
│    Frontend     │      │     Backend     │
│  (React + TS)   │◄────►│  (Python/FastAPI)│
└─────────────────┘      └─────────────────┘
```

### Frontend Architecture

The frontend follows a component-based architecture using React with TypeScript:

```
┌─────────────────────────────────────────┐
│                  App                    │
└───────────────────┬─────────────────────┘
          ┌─────────┴─────────┐
┌─────────▼─────────┐ ┌───────▼───────────┐
│   DocumentList    │ │  Editor Container │
└───────────────────┘ └───────┬───────────┘
                        ┌─────┴─────┐
                ┌───────▼───┐     ┌─▼──────────┐
                │DocumentEditor│     │ ChatPanel │
                └───────────┘     └────────────┘
```

### Backend Architecture

The backend uses FastAPI with a service-oriented architecture:

```
┌─────────────────────────────────────────┐
│                FastAPI                  │
└───────────────────┬─────────────────────┘
          ┌─────────┴─────────┐
┌─────────▼─────────┐ ┌───────▼───────────┐
│     API Routes    │ │    AI Services    │
└───────────────────┘ └───────┬───────────┘
                        ┌─────┴─────┐
                ┌───────▼───┐     ┌─▼──────────┐
                │ LangChain  │     │ LangGraph  │
                └───────────┘     └────────────┘
```

## Key Technical Decisions

### 1. Rich Text Editing with Slate.js

The application uses Slate.js for rich text editing, which provides:
- A customizable and extensible framework for building rich text editors
- Support for complex document structures
- Ability to implement custom formatting and suggestions

### 2. State Management

- React Query for server state management (data fetching, caching, synchronization)
- React's useState and useEffect for local component state
- No global state management library (Redux, Zustand, etc.) is used as the application's complexity doesn't warrant it

### 3. API Communication

- Axios for HTTP requests to the backend API
- RESTful API design for document operations
- Structured error handling and response parsing

### 4. AI Integration

- LangChain for AI model integration and prompt management
- LangGraph for workflow management of AI interactions
- Structured output parsing for AI suggestions

### 5. Data Storage

- In-memory storage for the demo version
- Structured to be easily replaced with a database in production

## Design Patterns

### 1. Component Composition

React components are structured using composition, with smaller, focused components combined to create more complex UI elements.

### 2. Container/Presentational Pattern

- Container components handle data fetching and state management
- Presentational components focus on rendering UI based on props

### 3. Custom Hooks

Custom hooks encapsulate and reuse stateful logic across components, such as:
- Document editing functionality
- Chat interactions
- AI suggestion handling

### 4. Render Props and Higher-Order Components

Used in the Slate.js implementation for customizing the editor's behavior and appearance.

### 5. Service Pattern

Backend functionality is organized into service modules that handle specific aspects of the application:
- Document management
- Chat processing
- AI integration

## Component Relationships

### Document Editor Flow

```
User Input → DocumentEditor → API Service → Backend → Database
                   ↓
              UI Updates
                   ↓
           Document Rendering
```

### AI Assistant Flow

```
User Message → ChatPanel → API Service → Backend → AI Service
                                                      ↓
                                                LangChain/LangGraph
                                                      ↓
                                                 AI Response
                                                      ↓
                                                  ChatPanel
                                                      ↓
                                              Document Suggestions
```

### Document Versioning Flow

```
Document Update → API Service → Backend → Version Creation
                                              ↓
                                        Version Storage
                                              ↓
                                      Version Retrieval API
```

## Critical Implementation Paths

### 1. Real-time Document Editing

- User edits document in the Slate.js editor
- Changes are tracked in component state
- Auto-save functionality sends updates to the backend
- Document versions are created on the backend

### 2. AI Assistance

- User sends a message through the chat interface
- Message is sent to the backend API
- Backend processes the message using LangChain and LangGraph
- AI generates a response and document suggestions
- Response and suggestions are returned to the frontend
- Suggestions are displayed in the UI for user acceptance/rejection

### 3. Document Management

- Documents are listed in the DocumentList component
- Selecting a document loads it in the DocumentEditor
- Creating a new document initializes a blank editor
- Saving updates the document on the backend
