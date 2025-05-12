import { BaseEditor, BaseElement, BaseText } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';
import { Document, Suggestion } from '../../types';

// Custom types for Slate
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: CustomElement
    Text: CustomText
  }
}

// Define custom element type
export interface CustomElement extends BaseElement {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'heading-three' | 'bulleted-list' | 'numbered-list' | 'list-item';
  children: CustomText[];
  blockId?: number;  // Make optional for backward compatibility
}

// Define custom text type
export interface CustomText extends BaseText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  suggestion?: {
    type: string;
    id: string;
  };
}

// Add or update types
export interface BlockNode extends CustomElement {
  blockId: number;
}

// Props for the main DocumentEditor component
export interface DocumentEditorProps {
  document: Document | null;
  isCreatingNew: boolean;
  suggestions?: Suggestion[];
  onSuggestionApplied?: () => void;
  onDocumentCreated: (document: Document) => void;
  onBackToList: () => void;
}
