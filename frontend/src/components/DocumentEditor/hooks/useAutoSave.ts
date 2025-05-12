import { useState, useEffect } from 'react';
import { Descendant } from 'slate';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDocument } from '../../../services/api';
import { serializeWithBlockIds } from '../utils/slateUtils';

/**
 * Custom hook to handle auto-saving functionality
 */
export const useAutoSave = (
  documentId: string | undefined,
  value: Descendant[],
  isCreatingNew: boolean
) => {
  const queryClient = useQueryClient();
  
  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => 
      updateDocument(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    },
  });

  useEffect(() => {
    if (!isCreatingNew && documentId) {
      const timer = setTimeout(() => {
        const content = serializeWithBlockIds(value);
        updateDocumentMutation.mutate({ id: documentId, content });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [value, documentId, isCreatingNew]);

  return { isAutoSaving: updateDocumentMutation.isLoading };
};
