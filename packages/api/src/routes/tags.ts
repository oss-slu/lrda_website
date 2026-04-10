import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';
import { getEnv } from './helpers';

const GenerateTagsInputSchema = z.object({
  content: z.string().min(1),
  title: z.string().optional(),
  locationName: z.string().optional(),
  existingTags: z.array(z.string()).optional(),
  time: z.string().optional(),
});

const GenerateTagsResponseSchema = z.object({
  tags: z.array(z.string()),
});

const ErrorResponseSchema = z.object({ error: z.string() });

const generateTagsRoute = createRoute({
  method: 'post',
  path: '/generate',
  middleware: [requireAuth],
  request: {
    body: {
      content: { 'application/json': { schema: GenerateTagsInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Generated tags',
      content: { 'application/json': { schema: GenerateTagsResponseSchema } },
    },
    500: {
      description: 'Tag generation failed',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const tagRoutes = new OpenAPIHono<AppEnv>().openapi(generateTagsRoute, async (c) => {
  const env = getEnv(c);
  const { content, title, locationName, existingTags, time } = c.req.valid('json');

  if (!env.OPENROUTER_API_KEY || !env.OPENROUTER_MODELS) {
    return c.json({ error: 'OPENROUTER_API_KEY and OPENROUTER_MODELS must be set' }, 500);
  }

  // Build context from all available note metadata
  const contextParts: string[] = [];
  if (title) contextParts.push(`Title: ${title}`);
  if (locationName) contextParts.push(`Location: ${locationName}`);
  if (time) contextParts.push(`Date: ${time}`);
  if (existingTags?.length) contextParts.push(`Existing tags: ${existingTags.join(', ')}`);
  contextParts.push(`Content:\n${content}`);

  const noteContext = contextParts.join('\n');

  const messages = [
    {
      role: 'system',
      content:
        'You are a professional ethnographer suggesting the best, most specific and descriptive web ontology tags for field research entries.',
    },
    {
      role: 'user',
      content: `Suggest 20 one-word tags for the following research entry:\n\n${noteContext}\n\nTag as an ethnographer. Keep the responses to one-word tags as a comma-separated list. Each tag must be between 3 and 28 characters. Use specific web ontology such as Library of Congress Subject Headings, AFS Ethnographic Thesaurus, and standard classification schemes. Include the location if known. Do not repeat any existing tags.`,
    },
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      // OpenRouter tries models in order, falling back if one is unavailable
      models: env.OPENROUTER_MODELS.split(',').map((m) => m.trim()),
      messages,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = (body as { error?: { message?: string } })?.error?.message || response.statusText;
    console.error('OpenRouter API error:', message);
    return c.json({ error: `OpenRouter error: ${message}` }, 500);
  }

  const result = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };

  const raw = result?.choices?.[0]?.message?.content;
  if (!raw?.trim()) {
    return c.json({ error: 'Empty response from OpenRouter' }, 500);
  }

  const tags = raw
    .trim()
    .split(',')
    .map((t: string) => t.trim())
    .filter((t: string) => t.length >= 3 && t.length <= 28);

  return c.json({ tags }, 200);
});
