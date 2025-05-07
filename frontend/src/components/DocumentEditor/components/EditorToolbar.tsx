import React from 'react';
import { Editor } from 'slate';

interface EditorToolbarProps {
  editor: Editor;
  handleMarkClick: (event: React.MouseEvent, format: string) => void;
  isBlockActive: (editor: Editor, format: string) => boolean;
  isMarkActive: (editor: Editor, format: string) => boolean;
}

/**
 * Toolbar component for the document editor
 */
const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  handleMarkClick,
  isBlockActive,
  isMarkActive
}) => {
  return (
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
  );
};

export default EditorToolbar;
