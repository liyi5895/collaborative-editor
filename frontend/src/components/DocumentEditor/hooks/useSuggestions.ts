import { useState, useEffect } from 'react';
import { Editor, Transforms, Text } from 'slate';
import { Suggestion } from '../../../types';
import { deserialize } from '../utils/slateUtils';

/**
 * Custom hook to manage document suggestions
 */
export const useSuggestions = (
  editor: Editor,
  suggestions: Suggestion[] = [],
  onSuggestionApplied?: () => void
) => {
  const [activeSuggestions, setActiveSuggestions] = useState<Suggestion[]>([]);
  const [documentReplacementSuggestion, setDocumentReplacementSuggestion] = useState<Suggestion | null>(null);

  // Process incoming suggestions
  useEffect(() => {
    if (suggestions && suggestions.length > 0) {
      console.log("DocumentEditor received suggestions:", suggestions);
      processSuggestions(suggestions);
    }
  }, [suggestions, editor]);

  // Function to process suggestions
  const processSuggestions = (suggestionsToProcess: Suggestion[]) => {
    console.log("Processing suggestions:", suggestionsToProcess);
    
    // Check for document-wide replacement first
    // Handle both "replace_all" and "replace all" formats
    const replaceAllSuggestion = suggestionsToProcess.find(
      s => s.type === 'replace_all' || s.type === 'replace all'
    );
    
    if (replaceAllSuggestion) {
      console.log("Found document-wide replacement suggestion:", replaceAllSuggestion);
      setDocumentReplacementSuggestion(replaceAllSuggestion);
      setActiveSuggestions([]);
      return;
    }
    
    // Process block-specific suggestions
    const blockSuggestions = suggestionsToProcess.filter(
      s => s.type !== 'replace_all' && s.type !== 'replace all'
    );
    console.log("Processing block-specific suggestions:", blockSuggestions);
    setActiveSuggestions(blockSuggestions);
    highlightSuggestions(blockSuggestions);
  };

  // Function to highlight suggestions in the document
  const highlightSuggestions = (suggestionsToHighlight: Suggestion[]) => {
    // This is a simplified approach - in a real implementation,
    // you would need to handle more complex document structures
    suggestionsToHighlight.forEach(suggestion => {
      try {
        const { type, block_index, content } = suggestion;
        
        // Skip if block_index is not provided
        if (typeof block_index !== 'number') {
          console.log("Skipping suggestion without block_index:", suggestion);
          return;
        }
        
        // Check if the block exists
        if (block_index >= editor.children.length) {
          console.error(`Block index ${block_index} is out of range`);
          return;
        }
        
        // Mark the block with suggestion
        const path = [block_index];
        const suggestionId = Math.random().toString(36).substring(2, 9);
        
        Transforms.setNodes(
          editor,
          { suggestion: { type, id: suggestionId } },
          { at: path }
        );
        
        console.log(`Highlighted block ${block_index} with suggestion type ${type}`);
      } catch (error) {
        console.error("Error highlighting suggestion:", error);
      }
    });
  };
  
  // Apply document-wide replacement
  const applyDocumentReplacementSuggestion = (content: string) => {
    try {
      console.log("Applying document-wide replacement");
      
      // Parse the content into Slate nodes
      const newValue = deserialize(content);
      
      // Replace the entire editor content
      Transforms.delete(editor, {
        at: {
          anchor: Editor.start(editor, []),
          focus: Editor.end(editor, []),
        },
      });
      
      // Insert the new content
      newValue.forEach((node) => {
        Transforms.insertNodes(editor, node, { at: [editor.children.length] });
      });
      
      console.log("Document replacement applied successfully");
      
      // Clear the document replacement suggestion
      setDocumentReplacementSuggestion(null);
      
      // Notify parent that a suggestion was applied
      if (onSuggestionApplied) {
        onSuggestionApplied();
      }
    } catch (error) {
      console.error("Error applying document replacement:", error);
    }
  };
  
  // Adjust suggestion indices after an addition or deletion
  const adjustSuggestionIndices = (operation: 'addition' | 'deletion', index: number) => {
    setActiveSuggestions(prev => 
      prev.map(s => {
        if (typeof s.block_index !== 'number') return s;
        
        if (operation === 'addition' && s.block_index >= index) {
          return { ...s, block_index: s.block_index + 1 };
        }
        
        if (operation === 'deletion' && s.block_index > index) {
          return { ...s, block_index: s.block_index - 1 };
        }
        
        return s;
      })
    );
  };

  // Apply AI suggestions to the document
  const applySuggestion = (suggestion: Suggestion) => {
    const { type, block_index, content } = suggestion;
    
    try {
      // Handle document-wide replacement
      if (type === 'replace_all' || type === 'replace all') {
        applyDocumentReplacementSuggestion(content);
        return;
      }
      
      // Skip if block_index is not provided
      if (typeof block_index !== 'number') {
        console.error("Block index is required for non-replace_all suggestions");
        return;
      }
      
      // Check if the block exists
      if (block_index >= editor.children.length) {
        console.error(`Block index ${block_index} is out of range`);
        return;
      }
      
      console.log(`Applying ${type} suggestion to block ${block_index}`);
      
      if (type === 'addition') {
        // Insert a new block at the specified index
        Transforms.insertNodes(editor, {
          type: 'paragraph',
          children: [{ text: content }]
        }, { at: [block_index] });
        
        // Adjust indices of remaining suggestions
        adjustSuggestionIndices('addition', block_index);
      } 
      else if (type === 'deletion') {
        // Delete the block at the specified index
        Transforms.removeNodes(editor, { at: [block_index] });
        
        // Adjust indices of remaining suggestions
        adjustSuggestionIndices('deletion', block_index);
      } 
      else if (type === 'modification') {
        // Replace the block at the specified index
        Transforms.removeNodes(editor, { at: [block_index] });
        Transforms.insertNodes(editor, {
          type: 'paragraph',
          children: [{ text: content }]
        }, { at: [block_index] });
      }
      
      // Remove the suggestion from the active list
      setActiveSuggestions(prev => prev.filter(s => s !== suggestion));
      
      // Notify parent that a suggestion was applied
      if (onSuggestionApplied) {
        onSuggestionApplied();
      }
    } catch (error) {
      console.error("Error applying suggestion:", error);
    }
  };

  // Reject a suggestion
  const rejectSuggestion = (suggestion: Suggestion) => {
    if (suggestion === documentReplacementSuggestion) {
      setDocumentReplacementSuggestion(null);
    } else {
      setActiveSuggestions(prev => prev.filter(s => s !== suggestion));
    }
  };

  return {
    activeSuggestions,
    documentReplacementSuggestion,
    applySuggestion,
    rejectSuggestion
  };
};
