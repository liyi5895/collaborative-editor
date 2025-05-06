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
  type: string; // "addition", "deletion", or "modification"
  content: string;
  position: number;
  reason?: string;
}

export interface AIResponse {
  message: string;
  suggestions: Suggestion[];
}
