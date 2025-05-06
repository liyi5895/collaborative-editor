# Collaborative Document Editor with AI Assistance

A full-stack collaborative document editor with real-time editing and AI assistance. This application allows users to create and edit documents, receive AI-powered suggestions, and interact with an AI assistant through a chat interface.

## Features

- Rich text editing with formatting options
- AI-powered suggestions for document improvements
- Chat interface with AI assistant
- Document version history
- Auto-save functionality

## Tech Stack

### Frontend
- React.js with TypeScript
- Slate.js for rich text editing
- React Query for data fetching and caching
- Tailwind CSS for styling

### Backend
- Python with FastAPI
- LangChain for AI integration
- LangGraph for workflow management
- SQLAlchemy for database ORM (in-memory storage for demo)

## Project Structure

```
collaborative-editor/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── services/         # API services
│   │   └── types.ts          # TypeScript types
│   └── Dockerfile            # Frontend Docker configuration
├── backend/                  # Python backend
│   ├── app/                  # Main application
│   │   ├── api/              # API endpoints
│   │   ├── core/             # Core functionality
│   │   ├── models/           # Data models
│   │   └── services/         # Business logic
│   └── Dockerfile            # Backend Docker configuration
└── docker-compose.yml        # Docker Compose configuration
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Python 3.9+ (for local development)

### Running with Docker

1. Clone the repository:
   ```
   git clone <repository-url>
   cd collaborative-editor
   ```

2. Start the application using Docker Compose:
   ```
   docker compose up
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Troubleshooting

If you encounter an error related to OpenSSL when starting the frontend container:
```
Error: error:0308010C:digital envelope routines::unsupported
```

This is due to Node.js 18 using a newer version of OpenSSL. The Dockerfile has been configured to handle this by setting the `NODE_OPTIONS=--openssl-legacy-provider` environment variable. If you're running the application locally without Docker, you may need to set this environment variable manually:

```
# On Linux/macOS
export NODE_OPTIONS=--openssl-legacy-provider
npm start

# On Windows
set NODE_OPTIONS=--openssl-legacy-provider
npm start
```

### Running Locally

#### Backend

1. Navigate to the backend directory:
   ```
   cd collaborative-editor/backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the backend server:
   ```
   python run.py
   ```

#### Frontend

1. Navigate to the frontend directory:
   ```
   cd collaborative-editor/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the frontend development server using the provided scripts:

   **On Linux/macOS:**
   ```
   # Make the script executable
   chmod +x start.sh
   
   # Run the script
   ./start.sh
   ```

   **On Windows:**
   ```
   start.bat
   ```

   These scripts automatically set the required `NODE_OPTIONS` environment variable to avoid OpenSSL errors.

   Alternatively, you can manually set the environment variable and run the app:
   ```
   # On Linux/macOS
   export NODE_OPTIONS=--openssl-legacy-provider
   npm start

   # On Windows
   set NODE_OPTIONS=--openssl-legacy-provider
   npm start
   ```

## API Documentation

The backend API documentation is available at http://localhost:8000/docs when the server is running.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
