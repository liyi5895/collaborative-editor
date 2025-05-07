import { useState, useEffect } from 'react';
import { Descendant } from 'slate';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDocument } from '../../../services/api';
import { serialize } from '../utils/slateUtils';

/**
 * Custom hook to handle auto-saving functionality
 */
export const useAutoSave = (
  documentId: string | undefined,
  value: Descendant[],
  isCreatingNew: boolean
) => {
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => 
      updateDocument(id, content),
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      setIsSaving(false);
    },
    onError: () => {
      setIsSaving(false);
    }
  });

  // Auto-save functionality
  useEffect(() => {
    if (!isCreatingNew && documentId) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      const timer = setTimeout(() => {
        const content = serialize(value);
        updateDocumentMutation.mutate({ id: documentId, content });
      }, 2000); // Auto-save after 2 seconds of inactivity
      
      setAutoSaveTimer(timer);
    }
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [value, documentId, isCreatingNew]);

  return { isSaving };
};
