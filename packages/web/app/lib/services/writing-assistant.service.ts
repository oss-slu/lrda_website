import { fetchWithAuth } from './api';

export interface WritingAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface WritingAssistantInput {
  userQuery: string;
  noteContent: string;
  noteTitle: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

async function getWritingAssistance(input: WritingAssistantInput): Promise<string> {
  const data = await fetchWithAuth<{ response: string }>('/api/writing-assistant/assist', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.response;
}

export const writingAssistantService = {
  getWritingAssistance,
};
