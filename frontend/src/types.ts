export interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  content: string;
  created_at: string;
}

export interface ChatMessage {
  content: string;
  role: string; // "user" or "ai"
  timestamp?: string;
}

export interface Suggestion {
  type: string; // "addition", "deletion", "modification", or "replace_all"
  block_index?: number; // Optional because replace_all doesn't need it
  content: string;
  reason?: string;
}

export interface AIResponse {
  message: string;
  suggestions: Suggestion[];
}
