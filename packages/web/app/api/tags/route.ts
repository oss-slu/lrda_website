/**
 * Server-side API route for generating tags using OpenAI.
 *
 * This moves the OpenAI API key to the server side for security.
 * The client should call this endpoint instead of making direct OpenAI requests.
 */

import { NextRequest, NextResponse } from 'next/server';

// Server-only environment variables (NOT prefixed with NEXT_PUBLIC_)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

interface OpenAIChatChoice {
  index: number;
  message?: {
    role?: string;
    content?: string | null;
  };
  finish_reason?: string;
}

interface OpenAIResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: OpenAIChatChoice[];
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { noteContent } = await request.json();

    if (!noteContent || typeof noteContent !== 'string') {
      return NextResponse.json({ error: 'Invalid note content' }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 });
    }

    const messages = [
      {
        role: 'system',
        content:
          'You are a professional ethnographer suggesting the best, most specific and descriptive web ontology tags for notes.',
      },
      {
        role: 'user',
        content: `Suggest 20 one-word tags for the following notes:\n${noteContent}\nTags as an ethnographer. Keep the responses to one-word tags as a comma-separated list. Each tag must be between 3 and 28 characters. Use specific web ontology such as Library of Congress Subject Headings, Classification, AFS Ethnographic Thesaurus, Subject Schemas, Classification Schemes, and include the city where this note exists in the tags.`,
      },
    ];

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1000,
        n: 1,
      }),
    });

    const data: OpenAIResponse = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || response.statusText;
      const normalizedMessage = (errorMessage || '').toLowerCase();

      const isQuotaError =
        response.status === 429 ||
        normalizedMessage.includes('quota') ||
        normalizedMessage.includes('billing');

      if (isQuotaError) {
        // Graceful degradation - return empty tags instead of error
        console.warn('OpenAI quota exceeded, returning empty tags');
        return NextResponse.json({ tags: [] });
      }

      console.error('OpenAI API error:', errorMessage);
      return NextResponse.json({ error: `OpenAI error: ${errorMessage}` }, { status: 500 });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Empty response from OpenAI' }, { status: 500 });
    }

    const tags = content
      .trim()
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length >= 3 && tag.length <= 28);

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Tag generation error:', error);
    return NextResponse.json({ error: 'Failed to generate tags' }, { status: 500 });
  }
}
