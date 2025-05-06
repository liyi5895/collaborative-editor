import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChatHistory, sendChatMessage } from '../services/api';
import { ChatMessage, Suggestion } from '../types';
import './ChatPanel.css';

interface ChatPanelProps {
  documentId?: string;
  isCreatingNew?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ documentId, isCreatingNew = false }) => {
  const [message, setMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Query for chat history
  const { 
    data: chatHistory, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['chatHistory', documentId || (isCreatingNew ? 'temp' : '')],
    queryFn: () => documentId ? getChatHistory(documentId) : Promise.resolve([]),
    enabled: !!documentId || isCreatingNew,
  });

  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: ({ documentId, content }: { documentId: string; content: string }) => 
      sendChatMessage(documentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory', documentId] });
    },
  });

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!documentId && !isCreatingNew) || !message.trim()) {
      return;
    }
    
    if (isCreatingNew && !documentId) {
      // If creating a new document, just show the message in the UI
      // We'll handle this case by showing a temporary message
      const tempMessage: ChatMessage = {
        content: message,
        role: 'user',
        timestamp: new Date().toISOString()
      };
      
      // Show a response that prompts the user to save the document first
      const aiResponse: ChatMessage = {
        content: "Please save your document first to enable full AI assistant functionality.",
        role: 'ai',
        timestamp: new Date().toISOString()
      };
      
      // Update the local state to show these messages
      queryClient.setQueryData(['chatHistory', 'temp'], [tempMessage, aiResponse]);
      setMessage('');
    } else if (documentId) {
      // Normal case with an existing document
      sendMessageMutation.mutate({ documentId, content: message });
      setMessage('');
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!documentId && !isCreatingNew) {
    return (
      <div className="chat-panel chat-panel-disabled">
        <div className="chat-panel-placeholder">
          <p>Select or create a document to chat with the AI assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>AI Assistant</h2>
      </div>
      
      <div className="chat-messages">
        {isLoading ? (
          <div className="chat-loading">Loading conversation...</div>
        ) : error ? (
          <div className="chat-error">Error loading conversation. Please try again.</div>
        ) : chatHistory && chatHistory.length > 0 ? (
          <>
            {chatHistory.map((msg, index) => (
              <div 
                key={index} 
                className={`chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}
              >
                <div className="message-content">{msg.content}</div>
                <div className="message-timestamp">{formatTimestamp(msg.timestamp)}</div>
              </div>
            ))}
          </>
        ) : isCreatingNew && !documentId ? (
          <div className="chat-empty">
            <p>Save your document first to enable full AI assistant functionality.</p>
            <p>You can still send messages, but they will be temporary until the document is saved.</p>
          </div>
        ) : (
          <div className="chat-empty">
            <p>No messages yet. Start the conversation with the AI assistant.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask the AI assistant..."
          disabled={sendMessageMutation.isLoading}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!message.trim() || sendMessageMutation.isLoading}
        >
          {sendMessageMutation.isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
