import { useState, useEffect } from 'react';
import { Editor, Transforms, Text, Descendant } from 'slate';
import { Suggestion } from '../../../types';
import { deserialize } from '../utils/slateUtils';
import { BlockNode } from '../types';

export interface UseSuggestionsResult {
  activeSuggestions: Suggestion[];
  documentReplacementSuggestion: Suggestion | null;
  applySuggestion: (suggestion: Suggestion) => void;
  rejectSuggestion: (suggestion: Suggestion) => void;
}

/**
 * Custom hook to manage document suggestions
 */
export const useSuggestions = (
  editor: Editor,
  suggestions: Suggestion[] = [],
  setValue: React.Dispatch<React.SetStateAction<Descendant[]>>,
  onSuggestionApplied?: () => void
): UseSuggestionsResult => {
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
    // Log the current editor structure for debugging
    console.log("Current editor structure:", 
      JSON.stringify(editor.children.map((node, i) => ({ 
        arrayIndex: i, 
        blockId: (node as any).blockId,
        type: (node as any).type,
        text: (node as any).children[0]?.text?.substring(0, 30) + "..."
      })), null, 2));
    console.log(`Editor has ${editor.children.length} blocks`);
    
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
        
        // Find the node with the matching blockId
        let nodeIndex = -1;
        for (let i = 0; i < editor.children.length; i++) {
          const node = editor.children[i] as any;
          if (node.blockId === block_index) {
            nodeIndex = i;
            break;
          }
        }
        
        if (nodeIndex === -1) {
          console.error(`Could not find node with blockId ${block_index}`);
          return;
        }
        
        // Mark the block with suggestion
        const path = [nodeIndex];
        const suggestionId = Math.random().toString(36).substring(2, 9);
        
        Transforms.setNodes(
          editor,
          { suggestion: { type, id: suggestionId } },
          { at: path }
        );
        
        console.log(`Highlighted block with blockId ${block_index} at array index ${nodeIndex} with suggestion type ${type}`);
      } catch (error) {
        console.error("Error highlighting suggestion:", error);
        console.error("Suggestion that caused error:", JSON.stringify(suggestion, null, 2));
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
      
      // Update the value state to trigger a re-render
      setValue(editor.children as Descendant[]);
      
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
      // Log the current editor structure before applying the suggestion
      console.log("Editor structure before applying suggestion:", 
        JSON.stringify(editor.children.map((node, i) => ({ index: i, type: (node as any).type })), null, 2));
      console.log(`Attempting to apply suggestion:`, JSON.stringify(suggestion, null, 2));
      
      // If the block_index is specified, verify it exists in the editor
      if (typeof block_index === 'number' && block_index >= editor.children.length) {
        console.error(`Block index ${block_index} is out of range (editor has ${editor.children.length} blocks)`);
        console.error("This might be due to a mismatch between the block indices used by the AI and the actual editor structure.");
        console.error("Suggestion will not be applied to avoid corrupting the document.");
        return;
      }
      
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
      
      // Find the node with the matching blockId (for all operations)
      let nodeIndex = -1;
      for (let i = 0; i < editor.children.length; i++) {
        const node = editor.children[i] as any;
        if (node.blockId === block_index) {
          nodeIndex = i;
          break;
        }
      }
      
      if (nodeIndex === -1 && type !== 'addition') {
        console.error(`Could not find node with blockId ${block_index}`);
        return;
      }
      
      console.log(`Applying ${type} suggestion to block with blockId ${block_index}`);
      
      if (type === 'addition') {
        // For addition, if we can't find the node with the exact blockId,
        // we'll insert at the specified index or at the end
        const insertIndex = nodeIndex !== -1 ? nodeIndex : 
                           (block_index < editor.children.length ? block_index : editor.children.length);
        
        console.log(`Inserting new block at array index ${insertIndex}`);
        
        // Insert a new block with the next available blockId
        const maxBlockId = Math.max(...editor.children.map(n => (n as BlockNode).blockId ?? -1));
        Transforms.insertNodes(editor, {
          type: 'paragraph',
          children: [{ text: content }],
          blockId: maxBlockId + 1
        }, { at: [insertIndex] });
        
        // Update the value state to trigger a re-render
        setValue(editor.children as Descendant[]);
        
        // Adjust indices of remaining suggestions
        adjustSuggestionIndices('addition', insertIndex);
      } 
      else if (type === 'deletion') {
        console.log(`Deleting block with blockId ${block_index} at array index ${nodeIndex}`);
        
        // Delete the block at the specified index
        Transforms.removeNodes(editor, { at: [nodeIndex] });
        
        // Update the value state to trigger a re-render
        setValue(editor.children as Descendant[]);
        
        // Adjust indices of remaining suggestions
        adjustSuggestionIndices('deletion', nodeIndex);
      } 
      else if (type === 'modification') {
        // Log the current editor structure to debug the mismatch
        console.log("Current editor structure:", 
          JSON.stringify(editor.children.map((node, i) => ({ 
            arrayIndex: i, 
            blockId: (node as any).blockId,
            type: (node as any).type,
            text: (node as any).children[0]?.text?.substring(0, 30) + "..."
          })), null, 2));
        
        console.log(`Attempting to modify block with blockId ${block_index} and content: ${content}`);
        
        // Find the node with the matching blockId
        let nodeIndex = -1;
        for (let i = 0; i < editor.children.length; i++) {
          const node = editor.children[i] as any;
          if (node.blockId === block_index) {
            nodeIndex = i;
            break;
          }
        }
        
        if (nodeIndex === -1) {
          console.error(`Could not find node with blockId ${block_index}`);
          return;
        }
        
        // Get the current node to preserve its type and other properties
        const currentNode = editor.children[nodeIndex] as any;
        
        // Log detailed information about the node we're about to modify
        console.log(`Found node with blockId ${block_index} at array index ${nodeIndex}:`, {
          blockId: currentNode.blockId,
          type: currentNode.type,
          text: currentNode.children[0]?.text,
          fullNode: JSON.stringify(currentNode, null, 2)
        });
        
        const nodeType = currentNode.type || 'paragraph';
        
        try {
          // For list items and other complex structures, we need a different approach
          if (nodeType === 'list-item' || nodeType === 'bulleted-list' || nodeType === 'numbered-list') {
            // For list items, we need to preserve the parent list structure
            // First, select the node
            Transforms.select(editor, [nodeIndex]);
            
            // Delete the content but keep the node
            Transforms.delete(editor);
            
            // Insert the new text at the current selection
            Transforms.insertText(editor, content);
          } else {
            // The issue is that setNodes doesn't properly update the children property
            // Let's use a more direct approach
            console.log(`Modifying block ${block_index} with content: ${content}`);
            
            try {
              // Create a new node with the same properties but updated content
              const updatedNode = {
                ...currentNode,
                children: [{ text: content }]
              };
              
              // Log the node we're about to insert
              console.log("Updated node to insert:", JSON.stringify(updatedNode, null, 2));
              
              // IMPORTANT: Use nodeIndex (array index) instead of block_index (blockId)
              // Remove the old node
              Transforms.removeNodes(editor, { at: [nodeIndex] });
              
              // Insert the new node at the same position
              Transforms.insertNodes(editor, updatedNode, { at: [nodeIndex] });
              
              console.log(`After replacement, checking node at index ${nodeIndex}:`, 
                JSON.stringify(editor.children[nodeIndex], null, 2));
            } catch (error) {
              console.error("Error updating node:", error);
              
              // Fallback to the text replacement approach
              // Use nodeIndex instead of block_index
              Transforms.select(editor, [nodeIndex]);
              Transforms.delete(editor);
              Transforms.insertText(editor, content);
            }
          }
          
          // Update the value state to trigger a re-render
          setValue(editor.children as Descendant[]);
          
          console.log(`Block with blockId ${block_index} at array index ${nodeIndex} modified with preserved type: ${nodeType}`);
          console.log("Updated node:", JSON.stringify(editor.children[nodeIndex], null, 2));
        } catch (error) {
          console.error("Error modifying node:", error);
          
          // Fallback approach - simple text replacement
          try {
            // Select the node using nodeIndex
            Transforms.select(editor, [nodeIndex]);
            
            // Delete the content
            Transforms.delete(editor);
            
            // Insert the new text
            Transforms.insertText(editor, content);
            
            // Update the value state
            setValue(editor.children as Descendant[]);
            
            console.log("Used fallback approach to modify node");
          } catch (fallbackError) {
            console.error("Fallback modification also failed:", fallbackError);
          }
        }
      }
      
      // Log the editor structure after applying the suggestion
      console.log("Editor structure after applying suggestion:", 
        JSON.stringify(editor.children.map((node, i) => ({ index: i, type: (node as any).type })), null, 2));
      
      // Remove the suggestion from the active list
      setActiveSuggestions(prev => prev.filter(s => s !== suggestion));
      
      // Notify parent that a suggestion was applied
      if (onSuggestionApplied) {
        onSuggestionApplied();
      }
    } catch (error) {
      console.error("Error applying suggestion:", error);
      console.error("Suggestion that caused error:", JSON.stringify(suggestion, null, 2));
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
