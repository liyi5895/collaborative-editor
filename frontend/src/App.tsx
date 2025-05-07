import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DocumentEditor from './components/DocumentEditor/index';
import ChatPanel from './components/ChatPanel';
import DocumentList from './components/DocumentList';
import { Document, Suggestion } from './types';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<Suggestion[]>([]);

  // Handler for new suggestions from ChatPanel
  const handleNewSuggestions = (suggestions: Suggestion[]) => {
    console.log("App received suggestions:", suggestions);
    setAiSuggestions(suggestions);
  };

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
                suggestions={aiSuggestions}
                onSuggestionApplied={() => setAiSuggestions([])}
                onDocumentCreated={(doc) => {
                  setSelectedDocument(doc);
                  setIsCreatingNew(false);
                }}
                onBackToList={() => {
                  setSelectedDocument(null);
                  setIsCreatingNew(false);
                }}
              />
              <ChatPanel 
                documentId={selectedDocument?.id} 
                isCreatingNew={isCreatingNew}
                onNewSuggestions={handleNewSuggestions}
              />
            </div>
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
