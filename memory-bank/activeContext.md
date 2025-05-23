# Active Context

## Current Work Focus

The Collaborative Editor project is currently focused on implementing the core functionality of the application, including:

1. **Document Editor Implementation**: Building a rich text editor using Slate.js with formatting options and real-time updates.
2. **AI Assistant Integration**: Implementing the AI assistant using LangChain and LangGraph with real LLM models via OpenRouter API.
3. **Chat Interface**: Creating a chat interface for users to communicate with the AI assistant, including model selection.
4. **Document Management**: Implementing document creation, editing, and version history.

## Recent Changes

### Frontend
- **Refactored DocumentEditor Component**: Broke down the large monolithic DocumentEditor component into smaller, more maintainable pieces:
  - Created a modular directory structure with separate components, hooks, and utilities
  - Extracted UI components (DocumentHeader, EditorToolbar, SuggestionsPanel)
  - Created custom hooks (useSlateEditor, useAutoSave, useSuggestions)
  - Separated utility functions (slateUtils)
- **Fixed Chat Panel JSON Display Issue**: Resolved issue with raw JSON being displayed in the chat panel
  - Added markdown code block parsing in both frontend and backend
  - Enhanced error handling for different response formats
- **Fixed Suggestion Application**: Resolved issues with AI suggestions
  - Fixed the "Accept" button functionality for suggestions
  - Added proper state updates after editor transformations
  - Ensured React re-renders after Slate editor content changes
  - Fixed critical bug where modification suggestions were applied to the wrong block
  - Implemented robust node finding by blockId instead of relying on array indices
  - Added detailed logging for better debugging of suggestion application

### Backend
- **Enhanced AI Response Handling**: Improved handling of LLM responses
  - Added support for markdown-formatted JSON responses
  - Implemented better error handling and fallback mechanisms
  - Added detailed logging for debugging
- Set up FastAPI server with RESTful endpoints
- Implemented document CRUD operations
- Created chat history endpoints
- Integrated LangChain and LangGraph with OpenRouter API for real LLM model integration
- Added support for multiple LLM models (Claude 3.7 Sonnet and GPT-4o Mini)
- Implemented in-memory storage for documents and chat history
- Added environment variable configuration for API keys

## Next Steps

### Short-term Tasks
1. **Continue Code Refactoring**: Further improve code organization and maintainability
   - Consider extracting more components from large files
   - Add comprehensive error handling
   - Improve TypeScript type definitions
2. **Implement Real-time Collaboration**: Add WebSocket support for real-time document updates between multiple users
3. **Enhance AI Suggestions**: Improve the AI suggestion system to provide more relevant and helpful suggestions
4. **User Authentication**: Add user authentication and authorization
5. **UI Improvements**: Enhance the user interface with better styling and user experience

### Medium-term Tasks
1. **Database Integration**: Replace in-memory storage with a proper database
2. **Advanced Document Features**: Add more advanced document features like comments, annotations, and formatting options
3. **User Presence**: Show which users are currently viewing or editing a document
4. **Notification System**: Implement notifications for document changes and chat messages

## Active Decisions and Considerations

### Technical Decisions
1. **Component Architecture**: Adopted a more modular component architecture with smaller, focused components and custom hooks
2. **State Management**: Using React Query for server state management instead of Redux or other global state management libraries to reduce complexity
3. **Editor Framework**: Chose Slate.js over other rich text editors (Draft.js, Quill.js) for its flexibility and extensibility
4. **AI Integration**: Using LangChain and LangGraph with OpenRouter API for AI assistant functionality to leverage real LLM models
5. **LLM Provider**: Using OpenRouter API to access multiple LLM models through a single API
6. **Storage Strategy**: Currently using in-memory storage for simplicity, but designed with future database integration in mind

### UX Decisions
1. **Layout Design**: Split-screen layout with document editor and chat panel side by side for seamless interaction
2. **Suggestion Handling**: AI suggestions are displayed in a separate panel with accept/reject options
3. **Document Navigation**: Simple list view for documents with clear creation and selection options
4. **Formatting Controls**: Toolbar with common formatting options for ease of use
5. **Model Selection**: Dropdown menu in the chat header for selecting different LLM models

## Important Patterns and Preferences

### Code Organization
- Frontend components are organized by feature and responsibility
- Components are broken down into smaller, more focused pieces
- Custom hooks are used to encapsulate and reuse stateful logic
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
- Breaking down large components into smaller pieces improves maintainability and readability
- Custom hooks are powerful for encapsulating and reusing stateful logic
- Explicit state updates are necessary when modifying Slate editor content
- When working with Slate.js, it's critical to handle the potential mismatch between blockIds and array indices
  - Empty lines and document structure can cause array indices to shift
  - Always find nodes by their blockId property rather than assuming array indices match blockIds
  - Use detailed logging to track node positions and properties during operations
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
- Debugging issues in complex component hierarchies
- Ensuring proper state updates in React components with external libraries
- Maintaining consistent block identification in Slate.js
  - Handling the mismatch between blockIds and array indices
  - Dealing with empty lines and document structure changes
  - Ensuring AI suggestions target the correct blocks

### Opportunities
- The AI assistant could be extended to provide more advanced writing assistance
- Document templates could be added for common use cases
- Analytics could provide insights into document quality and collaboration patterns
- Mobile support could extend the application's reach
