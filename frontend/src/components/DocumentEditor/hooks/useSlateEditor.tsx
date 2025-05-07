import React, { useMemo, useCallback } from 'react';
import { createEditor, Transforms, Editor, Element as SlateElement, Text } from 'slate';
import { withReact, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { CustomElement } from '../types';

/**
 * Custom hook to handle Slate editor configuration and formatting
 */
export const useSlateEditor = () => {
  // Create a Slate editor object that won't change across renders
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

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

  return {
    editor,
    renderElement,
    renderLeaf,
    handleMarkClick,
    isBlockActive,
    isMarkActive
  };
};
