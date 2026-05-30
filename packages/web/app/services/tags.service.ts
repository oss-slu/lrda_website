/**
 * Tags Service
 *
 * Generates tags by calling the API server's OpenRouter-backed endpoint.
 */
import { fetchWithAuth } from './api';

export interface GenerateTagsInput {
  content: string;
  title?: string;
  locationName?: string;
  existingTags?: string[];
  time?: string;
}

async function generateTags(input: GenerateTagsInput): Promise<string[]> {
  try {
    const data = await fetchWithAuth<{ tags: string[] }>('/api/tags/generate', {
      method: 'POST',
      body: JSON.stringify(input),
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
