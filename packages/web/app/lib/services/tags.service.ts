/**
 * Tags Service
 *
 * Generates tags by calling the API server's OpenRouter-backed endpoint.
 */
import { fetchWithAuth } from './api';

async function generateTags(noteContent: string): Promise<string[]> {
  try {
    const data = await fetchWithAuth<{ tags: string[] }>('/api/tags/generate', {
      method: 'POST',
      body: JSON.stringify({ content: noteContent }),
    });
    return data.tags;
  } catch (error) {
    console.error('Tag generation failed:', error);
    return [];
  }
}

export const tagsService = {
  generateTags,
};
