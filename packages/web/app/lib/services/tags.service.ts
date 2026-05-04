/**
 * Tags Service
 *
 * Generates tags via a server function that calls OpenRouter.
 * The API key stays server-side and is never exposed to the client.
 */
import { createServerFn } from '@tanstack/react-start';

interface TagInput {
  noteContent: string;
}

interface OpenRouterResponse {
  id?: string;
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
    };
    finish_reason?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
  };
}

const generateTagsOnServer = createServerFn({ method: 'POST' })
  .inputValidator((input: TagInput) => input)
  .handler(async ({ data }): Promise<string[]> => {
    const { noteContent } = data;

    const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
    const OPENROUTER_BASE_URL =
      import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

    if (!OPENROUTER_API_KEY) {
      console.error('VITE_OPENROUTER_API_KEY is not configured');
      return [];
    }

    const messages = [
      {
        role: 'system',
        content:
          'You are a professional ethnographer suggesting the best, most specific and descriptive web ontology tags for notes. Use Library of Congress Subject Headings, ethnographic classification schemes, and subject-specific terminology.',
      },
      {
        role: 'user',
        content: `Suggest 15 one-word tags for the following field notes:\n${noteContent}\nTags should be specific ethnographic terms as a comma-separated list. Each tag must be between 3 and 28 characters. Include themes like: religious practices, social groups, locations, rituals, beliefs, cultural activities, and ethnographic observations.`,
      },
    ];

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Wheres Religion - Tags Generation',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const result: OpenRouterResponse = await response.json();

    if (!response.ok) {
      const errorMessage = result?.error?.message || response.statusText;
      const normalizedMessage = (errorMessage || '').toLowerCase();

      const isQuotaError =
        response.status === 429 ||
        normalizedMessage.includes('quota') ||
        normalizedMessage.includes('billing');

      if (isQuotaError) {
        console.warn('OpenRouter quota exceeded, returning empty tags');
        return [];
      }

      console.error('OpenRouter API error:', errorMessage);
      throw new Error(`OpenRouter error: ${errorMessage}`);
    }

    const content = result?.choices?.[0]?.message?.content;
    if (!content?.trim()) {
      throw new Error('Empty response from OpenRouter');
    }

    return content
      .trim()
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length >= 3 && tag.length <= 28);
  });

/**
 * Generate tags for note content using AI.
 * @param noteContent - The text content to generate tags for
 * @returns Array of tag strings
 */
async function generateTags(noteContent: string): Promise<string[]> {
  return generateTagsOnServer({ data: { noteContent } });
}

export const tagsService = {
  generateTags,
};
