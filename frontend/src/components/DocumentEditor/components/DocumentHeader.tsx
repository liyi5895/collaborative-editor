import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDocument } from '../../../services/api';
import { Document } from '../../../types';
import { serializeWithBlockIds } from '../utils/slateUtils';

interface DocumentHeaderProps {
  document: Document | null;
  isCreatingNew: boolean;
  title: string;
  setTitle: (title: string) => void;
  onDocumentCreated: (document: Document) => void;
  onBackToList: () => void;
}

/**
 * Header component for the document editor
 */
const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  document,
  isCreatingNew,
  title,
  setTitle,
  onDocumentCreated,
  onBackToList
}) => {
  const queryClient = useQueryClient();

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: ({ title, content }: { title: string; content: string }) => 
      createDocument(title, content),
    onSuccess: (newDocument) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onDocumentCreated(newDocument);
    },
  });

  // Handle saving a new document
  const handleSaveNewDocument = () => {
    if (!title.trim()) {
      alert('Please enter a title for your document');
      return;
    }
    
    // Create an empty document with block IDs
    const emptyContent = serializeWithBlockIds([
      {
        type: 'paragraph',
        children: [{ text: '' }]
      }
    ]);
    
    createDocumentMutation.mutate({ title, content: emptyContent });
  };

  return (
    <div className="editor-header">
      <button className="back-button" onClick={onBackToList}>
        ← Back to Documents
      </button>
      
      {isCreatingNew ? (
        <>
          <input
            type="text"
            className="document-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title..."
          />
          <button 
            className="save-button"
            onClick={handleSaveNewDocument}
            disabled={createDocumentMutation.isLoading}
          >
            {createDocumentMutation.isLoading ? 'Saving...' : 'Save Document'}
          </button>
        </>
      ) : (
        <h2 className="document-title">{document?.title}</h2>
      )}
    </div>
  );
};

export default DocumentHeader;
