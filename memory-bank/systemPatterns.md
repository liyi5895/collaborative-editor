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
                └───────┬─────┘     └────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼─────┐ ┌───────▼────────┐
│DocumentHeader│ │EditorToolbar│ │SuggestionsPanel│
└──────────────┘ └────────────┘ └────────────────┘
```

#### DocumentEditor Component Structure

After refactoring, the DocumentEditor component has been broken down into a modular structure:

```
DocumentEditor/
├── index.tsx                 # Main component
├── types.ts                  # Shared types
├── components/               # UI components
│   ├── DocumentHeader.tsx    # Title and document controls
│   ├── EditorToolbar.tsx     # Formatting toolbar
│   └── SuggestionsPanel.tsx  # Suggestions UI
├── hooks/                    # Custom hooks
│   ├── useAutoSave.ts        # Auto-save functionality
│   ├── useSlateEditor.tsx    # Editor configuration
│   └── useSuggestions.ts     # Suggestion processing
└── utils/                    # Utility functions
    └── slateUtils.ts         # Serialization helpers
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

React components are structured using composition, with smaller, focused components combined to create more complex UI elements. The refactored DocumentEditor is a prime example, composed of several smaller components:
- DocumentHeader for title and controls
- EditorToolbar for formatting options
- SuggestionsPanel for AI suggestions
- Slate editor components for the main editing area

### 2. Container/Presentational Pattern

- Container components handle data fetching and state management
- Presentational components focus on rendering UI based on props
- For example, the main DocumentEditor component acts as a container, while components like EditorToolbar are presentational

### 3. Custom Hooks

Custom hooks encapsulate and reuse stateful logic across components:
- **useSlateEditor**: Manages editor configuration and formatting
- **useAutoSave**: Handles automatic document saving
- **useSuggestions**: Processes and applies AI suggestions
- These hooks separate logic from UI components, improving maintainability

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
User Input → DocumentEditor → Custom Hooks → Slate Editor → UI Updates
                   ↓                ↓
              API Service      State Updates
                   ↓
                Backend
                   ↓
               Database
```

### Document Editor Component Interaction

```
┌─────────────────────────────────────────────────────────┐
│                     DocumentEditor                      │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │useSlateEditor│  │ useAutoSave │  │ useSuggestions  │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                  │           │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌────────▼────────┐  │
│  │EditorToolbar│  │Slate Editor │  │SuggestionsPanel │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### AI Assistant Flow

```
User Message → ChatPanel → API Service → Backend → AI Service
                  ↓                                   ↓
        Response Parsing                       LangChain/LangGraph
                  ↓                                   ↓
          Display Message                        AI Response
                  ↓                                   ↓
        Extract Suggestions                  Format as JSON/Markdown
                  ↓                                   ↓
      Pass to DocumentEditor                Return to Frontend
                  ↓
        useSuggestions Hook
                  ↓
        SuggestionsPanel UI
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
- Changes are tracked in component state via the Slate onChange handler
- useAutoSave hook detects changes and schedules auto-save
- After a delay, changes are sent to the backend via API service
- Document versions are created on the backend

### 2. AI Assistance

- User sends a message through the chat interface
- Message is sent to the backend API with selected model
- Backend processes the message using LangChain and LangGraph
- AI generates a response and document suggestions (potentially in markdown format)
- Backend parses and formats the response
- Response and suggestions are returned to the frontend
- ChatPanel component parses the response and extracts suggestions
- Suggestions are passed to the DocumentEditor component
- useSuggestions hook processes the suggestions
- SuggestionsPanel displays suggestions for user acceptance/rejection

### 3. Document Management

- Documents are listed in the DocumentList component
- Selecting a document loads it in the DocumentEditor
- Creating a new document initializes a blank editor
- DocumentHeader component handles document title and save functionality
- Saving updates the document on the backend

### 4. Suggestion Application

- User clicks "Accept" on a suggestion in the SuggestionsPanel
- SuggestionsPanel calls the applySuggestion function from useSuggestions hook
- useSuggestions determines the type of suggestion (addition, deletion, modification, replace_all)
- Appropriate Slate Transforms are applied to modify the editor content
- setValue is called to update React state and trigger re-rendering
- The suggestion is removed from the active suggestions list
