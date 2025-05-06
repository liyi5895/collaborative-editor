import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DocumentEditor from './components/DocumentEditor';
import ChatPanel from './components/ChatPanel';
import DocumentList from './components/DocumentList';
import { Document } from './types';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-container">
        <header className="app-header">
          <h1>Collaborative Document Editor</h1>
          <div className="header-actions">
            <button 
              className="new-doc-button"
              onClick={() => {
                setSelectedDocument(null);
                setIsCreatingNew(true);
              }}
            >
              New Document
            </button>
          </div>
        </header>
        
        <main className="app-main">
          {!selectedDocument && !isCreatingNew ? (
            <DocumentList onSelectDocument={setSelectedDocument} />
          ) : (
            <div className="editor-container">
              <DocumentEditor 
                document={selectedDocument} 
                isCreatingNew={isCreatingNew}
                onDocumentCreated={(doc) => {
                  setSelectedDocument(doc);
                  setIsCreatingNew(false);
                }}
                onBackToList={() => {
                  setSelectedDocument(null);
                  setIsCreatingNew(false);
                }}
              />
              <ChatPanel documentId={selectedDocument?.id} isCreatingNew={isCreatingNew} />
            </div>
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
