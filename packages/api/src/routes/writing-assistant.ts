import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';
import { getEnv } from './helpers';

const SYSTEM_PROMPT = `You are an expert ethnographer professor mentoring graduate students in qualitative field research methodology. Your role is to:

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

Respond as a supportive but rigorous mentor. Ask probing questions. Point out strengths and areas for improvement. Encourage deeper thinking about methodology and ethics.`;

const MAX_HISTORY_MESSAGES = 20;

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const WritingAssistantInputSchema = z.object({
  userQuery: z.string().min(1),
  noteContent: z.string(),
  noteTitle: z.string(),
  conversationHistory: z.array(MessageSchema).max(MAX_HISTORY_MESSAGES),
});

const WritingAssistantResponseSchema = z.object({
  response: z.string(),
});

const ErrorResponseSchema = z.object({ error: z.string() });

const assistRoute = createRoute({
  method: 'post',
  path: '/assist',
  middleware: [requireAuth],
  request: {
    body: {
      content: { 'application/json': { schema: WritingAssistantInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Writing assistance response',
      content: { 'application/json': { schema: WritingAssistantResponseSchema } },
    },
    500: {
      description: 'Writing assistance failed',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const writingAssistantRoutes = new OpenAPIHono<AppEnv>().openapi(
  assistRoute,
  async (c) => {
    const env = getEnv(c);
    const { userQuery, noteContent, noteTitle, conversationHistory } = c.req.valid('json');

    if (!env.OPENROUTER_API_KEY) {
      return c.json({ error: 'OpenRouter API key is not configured' }, 500);
    }

    const noteContext = [
      `Student note title: ${noteTitle}`,
      `Student note content:\n${noteContent}`,
    ].join('\n');

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: noteContext },
      ...conversationHistory.slice(-MAX_HISTORY_MESSAGES),
      { role: 'user', content: userQuery },
    ];

    const models = env.OPENROUTER_MODELS
      ? env.OPENROUTER_MODELS.split(',').map((m) => m.trim())
      : ['google/gemini-2.5-flash-lite'];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        models,
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message =
        (body as { error?: { message?: string } })?.error?.message || response.statusText;
      console.error('OpenRouter API error:', message);
      return c.json({ error: `OpenRouter error: ${message}` }, 500);
    }

    const result = (await response.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };

    const content = result?.choices?.[0]?.message?.content;
    if (!content?.trim()) {
      return c.json({ error: 'Empty response from OpenRouter' }, 500);
    }

    return c.json({ response: content }, 200);
  },
);
