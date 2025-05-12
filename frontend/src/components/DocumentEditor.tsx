import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  createEditor,
  Descendant,
  Editor,
  Transforms,
  Element as SlateElement,
  Text,
  BaseEditor,
  BaseElement,
  BaseText
} from 'slate';
import {
  Slate,
  Editable,
  withReact,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps
} from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDocument, updateDocument } from '../services/api';
import { Document, Suggestion } from '../types';
import './DocumentEditor.css';
import { useSuggestions } from './DocumentEditor/hooks/useSuggestions';
import { useAutoSave } from './DocumentEditor/hooks/useAutoSave';
import { serializeWithBlockIds } from './DocumentEditor/utils/slateUtils';
import { CustomElement, CustomText } from './DocumentEditor/types';

interface DocumentEditorProps {
  document: Document | null;
  isCreatingNew: boolean;
  suggestions?: Suggestion[];
  onSuggestionApplied?: () => void;
  onDocumentCreated: (document: Document) => void;
  onBackToList: () => void;
}

// Custom types for Slate
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: CustomElement
    Text: CustomText
  }
}

// Define a serializing function that takes a Slate value and returns a string
const serialize = (nodes: Descendant[]): string => {
  return nodes.map(n => serializeNode(n)).join('\n');
};

const serializeNode = (node: Descendant): string => {
  if (Text.isText(node)) {
    let string = node.text;
    if (node.bold) {
      string = `**${string}**`;
    }
    if (node.italic) {
      string = `*${string}*`;
    }
    if (node.underline) {
      string = `__${string}__`;
    }
    if (node.code) {
      string = `\`${string}\``;
    }
    return string;
  }

  const children = node.children.map(n => serializeNode(n)).join('');

  switch ((node as CustomElement).type) {
    case 'heading-one':
      return `# ${children}\n`;
    case 'heading-two':
      return `## ${children}\n`;
    case 'heading-three':
      return `### ${children}\n`;
    case 'bulleted-list':
      return children;
    case 'numbered-list':
      return children;
    case 'list-item':
      return `- ${children}\n`;
    default:
      return `${children}\n`;
  }
};

// Define a deserializing function that takes a string and returns a Slate value
const deserialize = (content: string): Descendant[] => {
  // For simplicity, we'll just create paragraphs
  return content.split('\n').map(line => {
    return {
      type: 'paragraph',
      children: [{ text: line }],
    };
  });
};

const DocumentEditor: React.FC<DocumentEditorProps> = ({ 
  document, 
  isCreatingNew, 
  suggestions = [],
  onSuggestionApplied,
  onDocumentCreated, 
  onBackToList 
}) => {
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

  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const queryClient = useQueryClient();

  // Use the autoSave hook
  const { isAutoSaving } = useAutoSave(document?.id, value, isCreatingNew);

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: ({ title, content }: { title: string; content: string }) => 
      createDocument(title, content),
    onSuccess: (newDocument) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onDocumentCreated(newDocument);
    },
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => 
      updateDocument(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', document?.id] });
    },
  });

  // Use the useSuggestions hook instead
  const {
    activeSuggestions,
    documentReplacementSuggestion,
    applySuggestion,
    rejectSuggestion
  } = useSuggestions(editor, suggestions, setValue, onSuggestionApplied);

  // Custom element renderer
  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    
    switch ((element as CustomElement).type) {
      case 'heading-one':
        return <h1 {...attributes}>{children}</h1>;
      case 'heading-two':
        return <h2 {...attributes}>{children}</h2>;
      case 'heading-three':
        return <h3 {...attributes}>{children}</h3>;
      case 'bulleted-list':
        return <ul {...attributes}>{children}</ul>;
      case 'numbered-list':
        return <ol {...attributes}>{children}</ol>;
      case 'list-item':
        return <li {...attributes}>{children}</li>;
      default:
        return <p {...attributes}>{children}</p>;
    }
  }, []);

  // Custom leaf renderer
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    const { attributes, children, leaf } = props;
    
    let renderedChildren = children;
    
    if (leaf.bold) {
      renderedChildren = <strong>{renderedChildren}</strong>;
    }
    
    if (leaf.italic) {
      renderedChildren = <em>{renderedChildren}</em>;
    }
    
    if (leaf.underline) {
      renderedChildren = <u>{renderedChildren}</u>;
    }
    
    if (leaf.code) {
      renderedChildren = <code>{renderedChildren}</code>;
    }
    
    if (leaf.suggestion) {
      const suggestionType = leaf.suggestion.type;
      let className = '';
      
      if (suggestionType === 'addition') {
        className = 'suggestion-addition';
      } else if (suggestionType === 'deletion') {
        className = 'suggestion-deletion';
      } else if (suggestionType === 'modification') {
        className = 'suggestion-modification';
      }
      
      renderedChildren = <span className={className}>{renderedChildren}</span>;
    }
    
    return <span {...attributes}>{renderedChildren}</span>;
  }, []);

  // Toolbar button click handler
  const handleMarkClick = (event: React.MouseEvent, format: string) => {
    event.preventDefault();
    
    if (['bold', 'italic', 'underline', 'code'].includes(format)) {
      Editor.addMark(editor, format, true);
    } else if (['heading-one', 'heading-two', 'heading-three', 'paragraph'].includes(format)) {
      const isActive = isBlockActive(editor, format);
      const newProperties: Partial<CustomElement> = {
        type: isActive ? 'paragraph' : format as CustomElement['type'],
      };
      Transforms.setNodes(editor, newProperties);
    } else if (['bulleted-list', 'numbered-list'].includes(format)) {
      const isList = isBlockActive(editor, format);
      
      Transforms.unwrapNodes(editor, {
        match: n => 
          !Editor.isEditor(n) && 
          SlateElement.isElement(n) && 
          ['bulleted-list', 'numbered-list'].includes((n as CustomElement).type),
        split: true,
      });
      
      const newProperties: Partial<CustomElement> = {
        type: isList ? 'paragraph' : 'list-item',
      };
      Transforms.setNodes(editor, newProperties);
      
      if (!isList) {
        const block: CustomElement = {
          type: format as 'bulleted-list' | 'numbered-list',
          children: []
        };
        Transforms.wrapNodes(editor, block);
      }
    }
  };

  // Check if a block format is active
  const isBlockActive = (editor: Editor, format: string) => {
    const [match] = Editor.nodes(editor, {
      match: n => 
        !Editor.isEditor(n) && 
        SlateElement.isElement(n) && 
        (n as CustomElement).type === format,
    });
    
    return !!match;
  };

  // Check if a mark format is active
  const isMarkActive = (editor: Editor, format: string) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format as keyof typeof marks] === true : false;
  };

  // Handle saving a new document
  const handleSaveNewDocument = () => {
    if (!title.trim()) {
      alert('Please enter a title for your document');
      return;
    }
    
    const content = serializeWithBlockIds(value);  // Use serializeWithBlockIds
    createDocumentMutation.mutate({ title, content });
  };

  return (
    <div className="document-editor">
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
      
      <div className="editor-toolbar">
        <button
          onMouseDown={(e) => handleMarkClick(e, 'bold')}
          className={isMarkActive(editor, 'bold') ? 'active' : ''}
        >
          B
        </button>
        <button
          onMouseDown={(e) => handleMarkClick(e, 'italic')}
          className={isMarkActive(editor, 'italic') ? 'active' : ''}
        >
          I
        </button>
        <button
          onMouseDown={(e) => handleMarkClick(e, 'underline')}
          className={isMarkActive(editor, 'underline') ? 'active' : ''}
        >
          U
        </button>
        <button
          onMouseDown={(e) => handleMarkClick(e, 'code')}
          className={isMarkActive(editor, 'code') ? 'active' : ''}
        >
          {'</>'}
        </button>
        <span className="toolbar-divider">|</span>
        <button
          onMouseDown={(e) => handleMarkClick(e, 'heading-one')}
          className={isBlockActive(editor, 'heading-one') ? 'active' : ''}
        >
          H1
        </button>
        <button
          onMouseDown={(e) => handleMarkClick(e, 'heading-two')}
          className={isBlockActive(editor, 'heading-two') ? 'active' : ''}
        >
          H2
        </button>
        <button
          onMouseDown={(e) => handleMarkClick(e, 'heading-three')}
          className={isBlockActive(editor, 'heading-three') ? 'active' : ''}
        >
          H3
        </button>
        <span className="toolbar-divider">|</span>
        <button
          onMouseDown={(e) => handleMarkClick(e, 'bulleted-list')}
          className={isBlockActive(editor, 'bulleted-list') ? 'active' : ''}
        >
          • List
        </button>
        <button
          onMouseDown={(e) => handleMarkClick(e, 'numbered-list')}
          className={isBlockActive(editor, 'numbered-list') ? 'active' : ''}
        >
          1. List
        </button>
      </div>
      
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
      
      {(activeSuggestions.length > 0 || documentReplacementSuggestion) && (
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
            {activeSuggestions.map((suggestion: Suggestion, index: number) => (
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
      )}
      
      {!isCreatingNew && isAutoSaving && (
        <div className="auto-save-indicator">Saving...</div>
      )}
    </div>
  );
};

export default DocumentEditor;
