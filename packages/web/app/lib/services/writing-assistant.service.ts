/**
 * Ethnographer Professor Service
 *
 * Provides expert ethnography mentorship by calling the API server's
 * OpenRouter-backed chat endpoint. The API key stays server-side.
 */
import { fetchWithAuth } from './api';

export interface WritingAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GetWritingAssistanceInput {
  userQuery: string;
  noteContent: string;
  noteTitle: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

async function getWritingAssistance(input: GetWritingAssistanceInput): Promise<string> {
  const data = await fetchWithAuth<{ response: string }>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.response;
}

export const writingAssistantService = {
  getWritingAssistance,
};
