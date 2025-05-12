import React, { useState, useEffect } from 'react';
import { Slate, Editable } from 'slate-react';
import { Descendant } from 'slate';
import { Document } from '../../types';
import { deserialize } from './utils/slateUtils';
import { useSlateEditor } from './hooks/useSlateEditor';
import { useAutoSave } from './hooks/useAutoSave';
import { useSuggestions } from './hooks/useSuggestions';
import DocumentHeader from './components/DocumentHeader';
import EditorToolbar from './components/EditorToolbar';
import SuggestionsPanel from './components/SuggestionsPanel';
import { DocumentEditorProps } from './types';
import '../../components/DocumentEditor.css';

/**
 * Main DocumentEditor component
 */
const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  isCreatingNew,
  suggestions = [],
  onSuggestionApplied,
  onDocumentCreated,
  onBackToList
}) => {
  // State
  const [title, setTitle] = useState<string>(document?.title || '');
  const [value, setValue] = useState<Descendant[]>(() => {
    if (document?.content) {
      return deserialize(document.content);
    }
    return [
      {
        type: 'paragraph',
        children: [{ text: '' }],
      },
    ];
  });

  // Custom hooks
  const { 
    editor, 
    renderElement, 
    renderLeaf, 
    handleMarkClick, 
    isBlockActive, 
    isMarkActive 
  } = useSlateEditor();
  
  const { isAutoSaving } = useAutoSave(document?.id, value, isCreatingNew);
  
  const { 
    activeSuggestions, 
    documentReplacementSuggestion, 
    applySuggestion, 
    rejectSuggestion 
  } = useSuggestions(editor, suggestions, setValue, onSuggestionApplied);

  // Update title when document changes
  useEffect(() => {
    if (document?.title) {
      setTitle(document.title);
    }
  }, [document?.title]);

  // Update value when document content changes
  useEffect(() => {
    if (document?.content) {
      setValue(deserialize(document.content));
    }
  }, [document?.content]);

  return (
    <div className="document-editor">
      <DocumentHeader
        document={document}
        isCreatingNew={isCreatingNew}
        title={title}
        setTitle={setTitle}
        onDocumentCreated={onDocumentCreated}
        onBackToList={onBackToList}
      />
      
      <EditorToolbar
        editor={editor}
        handleMarkClick={handleMarkClick}
        isBlockActive={isBlockActive}
        isMarkActive={isMarkActive}
      />
      
      <div className="editor-content">
        <Slate
          editor={editor}
          value={value}
          onChange={setValue}
        >
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder="Start writing your document here..."
            spellCheck
            autoFocus
          />
        </Slate>
      </div>
      
      <SuggestionsPanel
        activeSuggestions={activeSuggestions}
        documentReplacementSuggestion={documentReplacementSuggestion}
        applySuggestion={applySuggestion}
        rejectSuggestion={rejectSuggestion}
      />
      
      {!isCreatingNew && isAutoSaving && (
        <div className="auto-save-indicator">Saving...</div>
      )}
    </div>
  );
};

export default DocumentEditor;
