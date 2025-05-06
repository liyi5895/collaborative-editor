import axios from 'axios';
import { Document, DocumentVersion, ChatMessage, AIResponse } from '../types';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Document API
export const getDocuments = async (): Promise<Document[]> => {
  const response = await api.get('/documents');
  return response.data;
};

export const getDocument = async (id: string): Promise<Document> => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const createDocument = async (title: string, content: string): Promise<Document> => {
  const response = await api.post('/documents', { title, content });
  return response.data;
};

export const updateDocument = async (id: string, content: string): Promise<Document> => {
  const response = await api.put(`/documents/${id}`, { content });
  return response.data;
};

export const getDocumentVersions = async (id: string): Promise<DocumentVersion[]> => {
  const response = await api.get(`/documents/${id}/versions`);
  return response.data;
};

// Chat API
export const getChatHistory = async (documentId: string): Promise<ChatMessage[]> => {
  const response = await api.get(`/documents/${documentId}/chat`);
  return response.data;
};

export const sendChatMessage = async (documentId: string, content: string, model?: string): Promise<AIResponse> => {
  const response = await api.post(`/documents/${documentId}/chat`, { content, model });
  return response.data;
};

export default api;
