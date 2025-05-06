import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDocuments } from '../services/api';
import { Document } from '../types';
import '../App.css';

interface DocumentListProps {
  onSelectDocument: (document: Document) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ onSelectDocument }) => {
  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments
  });

  if (isLoading) {
    return <div className="document-list">Loading documents...</div>;
  }

  if (error) {
    return <div className="document-list">Error loading documents. Please try again.</div>;
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="document-list">
        <h2>Your Documents</h2>
        <div className="document-list-empty">
          <p>You don't have any documents yet.</p>
          <p>Click "New Document" to create one.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="document-list">
      <h2>Your Documents</h2>
      {documents.map((doc) => (
        <div 
          key={doc.id} 
          className="document-item"
          onClick={() => onSelectDocument(doc)}
        >
          <div className="document-item-title">{doc.title}</div>
          <div className="document-item-date">
            Last updated: {formatDate(doc.updated_at)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentList;
