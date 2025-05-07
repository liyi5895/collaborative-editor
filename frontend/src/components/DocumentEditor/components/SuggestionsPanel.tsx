import React from 'react';
import { Suggestion } from '../../../types';

interface SuggestionsPanelProps {
  activeSuggestions: Suggestion[];
  documentReplacementSuggestion: Suggestion | null;
  applySuggestion: (suggestion: Suggestion) => void;
  rejectSuggestion: (suggestion: Suggestion) => void;
}

/**
 * Panel component for displaying and managing AI suggestions
 */
const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({
  activeSuggestions,
  documentReplacementSuggestion,
  applySuggestion,
  rejectSuggestion
}) => {
  if (activeSuggestions.length === 0 && !documentReplacementSuggestion) {
    return null;
  }

  return (
    <div className="suggestions-panel">
      <h3>AI Suggestions</h3>
      <div className="suggestions-list">
        {documentReplacementSuggestion && (
          <div className="suggestion-item document-replacement">
            <div className="suggestion-content">
              <span className="suggestion-type suggestion-type-addition">
                DOCUMENT REPLACEMENT
              </span>
              <p>The AI suggests replacing the entire document content.</p>
              {documentReplacementSuggestion.reason && (
                <p className="suggestion-reason">{documentReplacementSuggestion.reason}</p>
              )}
            </div>
            <div className="suggestion-actions">
              <button 
                className="accept-button"
                onClick={() => applySuggestion(documentReplacementSuggestion)}
              >
                Accept
              </button>
              <button 
                className="reject-button"
                onClick={() => rejectSuggestion(documentReplacementSuggestion)}
              >
                Reject
              </button>
            </div>
          </div>
        )}
        {activeSuggestions.map((suggestion, index) => (
          <div key={index} className="suggestion-item">
            <div className="suggestion-content">
              <span className={`suggestion-type suggestion-type-${suggestion.type}`}>
                {suggestion.type.toUpperCase()} {suggestion.block_index !== undefined ? `(Block ${suggestion.block_index})` : ''}
              </span>
              <p>{suggestion.content}</p>
              {suggestion.reason && (
                <p className="suggestion-reason">{suggestion.reason}</p>
              )}
            </div>
            <div className="suggestion-actions">
              <button 
                className="accept-button"
                onClick={() => applySuggestion(suggestion)}
              >
                Accept
              </button>
              <button 
                className="reject-button"
                onClick={() => rejectSuggestion(suggestion)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestionsPanel;
