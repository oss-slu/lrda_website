/**
 * Ethnographer Professor Service
 *
 * Provides expert ethnography mentorship via a server function that calls OpenRouter.
 * Acts as a professional ethnographer professor guiding students on research methodology.
 * The API key stays server-side and is never exposed to the client.
 */
import { createServerFn } from '@tanstack/react-start';

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

const getWritingAssistanceOnServer = createServerFn({ method: 'POST' })
  .inputValidator((input: WritingAssistantInput) => input)
  .handler(async ({ data }): Promise<string> => {
    const { userQuery, noteContent, noteTitle, conversationHistory } = data;

    const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
    const OPENROUTER_BASE_URL =
      import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

    if (!OPENROUTER_API_KEY) {
      console.error('VITE_OPENROUTER_API_KEY is not configured');
      throw new Error('Ethnographer Professor is not configured');
    }

    const systemPrompt = `You are an expert ethnographer professor mentoring graduate students in qualitative field research methodology. Your role is to:

- Guide students on rigorous ethnographic observation and documentation
- Help them develop critical perspectives on lived religion and cultural practices
- Question their assumptions and encourage reflexivity about observer bias
- Provide constructive feedback on field note quality, clarity, and detail
- Teach proper methodology: ethical considerations, consent, positionality, and research ethics
- Suggest follow-up questions and areas for deeper investigation
- Help students recognize patterns, themes, and theoretical implications
- Maintain academic rigor while supporting their learning journey
- Challenge vague observations and encourage specificity
- Connect their fieldwork to ethnographic theory and literature

Current student note being reviewed:
Title: "${noteTitle}"
Content: "${noteContent}"

Respond as a supportive but rigorous mentor. Ask probing questions. Point out strengths and areas for improvement. Encourage deeper thinking about methodology and ethics.`;

    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt,
      },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: userQuery,
      },
    ];

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'Wheres Religion - Ethnographer Professor',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages,
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as OpenRouterResponse;
        const errorMessage = errorData.error?.message || 'Failed to get mentorship response';
        throw new Error(errorMessage);
      }

      const result = (await response.json()) as OpenRouterResponse;

      if (!result.choices || result.choices.length === 0) {
        throw new Error('No response from ethnographer professor');
      }

      const assistantMessage = result.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error('Empty response from ethnographer professor');
      }

      return assistantMessage;
    } catch (error) {
      console.error('Ethnographer Professor error:', error);
      throw error;
    }
  });

async function getWritingAssistance(input: WritingAssistantInput): Promise<string> {
  return getWritingAssistanceOnServer({ data: input });
}

export const writingAssistantService = {
  getWritingAssistance,
};
