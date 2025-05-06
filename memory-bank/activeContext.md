# Active Context

## Current Work Focus

The Collaborative Editor project is currently focused on implementing the core functionality of the application, including:

1. **Document Editor Implementation**: Building a rich text editor using Slate.js with formatting options and real-time updates.
2. **AI Assistant Integration**: Implementing the AI assistant using LangChain and LangGraph with real LLM models via OpenRouter API.
3. **Chat Interface**: Creating a chat interface for users to communicate with the AI assistant, including model selection.
4. **Document Management**: Implementing document creation, editing, and version history.

## Recent Changes

### Frontend
- Implemented the main App component with React Query integration
- Created the DocumentEditor component with Slate.js
- Implemented the ChatPanel component for AI interaction with model selection dropdown
- Added document list view for managing documents
- Implemented API service for communication with the backend
- Updated the ChatPanel styling to accommodate the model selection dropdown

### Backend
- Set up FastAPI server with RESTful endpoints
- Implemented document CRUD operations
- Created chat history endpoints
- Integrated LangChain and LangGraph with OpenRouter API for real LLM model integration
- Added support for multiple LLM models (Claude 3.7 Sonnet and GPT-4.1)
- Implemented in-memory storage for documents and chat history
- Added environment variable configuration for API keys

## Next Steps

### Short-term Tasks
1. **Implement Real-time Collaboration**: Add WebSocket support for real-time document updates between multiple users
2. **Enhance AI Suggestions**: Improve the AI suggestion system to provide more relevant and helpful suggestions
3. **User Authentication**: Add user authentication and authorization
4. **UI Improvements**: Enhance the user interface with better styling and user experience
5. **Add More LLM Models**: Expand the available models in the dropdown menu

### Medium-term Tasks
1. **Database Integration**: Replace in-memory storage with a proper database
2. **Advanced Document Features**: Add more advanced document features like comments, annotations, and formatting options
3. **User Presence**: Show which users are currently viewing or editing a document
4. **Notification System**: Implement notifications for document changes and chat messages

## Active Decisions and Considerations

### Technical Decisions
1. **State Management**: Using React Query for server state management instead of Redux or other global state management libraries to reduce complexity
2. **Editor Framework**: Chose Slate.js over other rich text editors (Draft.js, Quill.js) for its flexibility and extensibility
3. **AI Integration**: Using LangChain and LangGraph with OpenRouter API for AI assistant functionality to leverage real LLM models
4. **LLM Provider**: Using OpenRouter API to access multiple LLM models through a single API
5. **Storage Strategy**: Currently using in-memory storage for simplicity, but designed with future database integration in mind

### UX Decisions
1. **Layout Design**: Split-screen layout with document editor and chat panel side by side for seamless interaction
2. **Suggestion Handling**: AI suggestions are displayed in a separate panel with accept/reject options
3. **Document Navigation**: Simple list view for documents with clear creation and selection options
4. **Formatting Controls**: Toolbar with common formatting options for ease of use
5. **Model Selection**: Dropdown menu in the chat header for selecting different LLM models

## Important Patterns and Preferences

### Code Organization
- Frontend components are organized by feature
- Backend code follows a service-oriented architecture
- API endpoints are RESTful and follow consistent naming conventions
- TypeScript interfaces are used for type safety across the application

### Styling Approach
- Using Tailwind CSS for utility-first styling
- Component-specific CSS files for more complex styling needs
- Consistent color scheme and spacing throughout the application

### State Management
- Local component state for UI-specific state
- React Query for server state
- Props for component communication
- Custom hooks for reusable stateful logic

## Learnings and Project Insights

### Technical Insights
- Slate.js has a steep learning curve but offers great flexibility for custom editor features
- LangChain and LangGraph provide a structured way to work with language models
- OpenRouter API simplifies integration with multiple LLM providers
- React Query simplifies data fetching and caching, reducing the need for manual state management
- FastAPI's automatic documentation generation is valuable for API development

### Challenges
- Implementing real-time collaboration requires careful consideration of conflict resolution
- AI suggestions need to be relevant and non-intrusive to be useful
- Balancing feature richness with simplicity in the editor interface
- Ensuring good performance with potentially large documents
- Managing API keys securely for LLM integration
- Handling different response formats from various LLM models

### Opportunities
- The AI assistant could be extended to provide more advanced writing assistance
- Document templates could be added for common use cases
- Analytics could provide insights into document quality and collaboration patterns
- Mobile support could extend the application's reach
