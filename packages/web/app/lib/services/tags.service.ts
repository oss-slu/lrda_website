/**
 * Tags Service
 *
 * Generates tags via a server function that calls OpenAI.
 * The API key stays server-side and is never exposed to the client.
 */
import { createServerFn } from '@tanstack/react-start'

interface TagInput {
  noteContent: string
}

interface OpenAIChatChoice {
  index: number
  message?: {
    role?: string
    content?: string | null
  }
  finish_reason?: string
}

interface OpenAIResponse {
  id?: string
  object?: string
  created?: number
  model?: string
  choices?: OpenAIChatChoice[]
  error?: {
    message?: string
    type?: string
    code?: string
  }
}

const generateTagsOnServer = createServerFn({ method: 'POST' })
  .inputValidator((input: TagInput) => input)
  .handler(async ({ data }): Promise<string[]> => {
    const { noteContent } = data

    const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY
    const OPENAI_API_URL =
      import.meta.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions'

    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured')
      return []
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
    ]

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
    })

    const result: OpenAIResponse = await response.json()

    if (!response.ok) {
      const errorMessage = result?.error?.message || response.statusText
      const normalizedMessage = (errorMessage || '').toLowerCase()

      const isQuotaError =
        response.status === 429 ||
        normalizedMessage.includes('quota') ||
        normalizedMessage.includes('billing')

      if (isQuotaError) {
        console.warn('OpenAI quota exceeded, returning empty tags')
        return []
      }

      console.error('OpenAI API error:', errorMessage)
      throw new Error(`OpenAI error: ${errorMessage}`)
    }

    const content = result?.choices?.[0]?.message?.content
    if (!content?.trim()) {
      throw new Error('Empty response from OpenAI')
    }

    return content
      .trim()
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length >= 3 && tag.length <= 28)
  })

/**
 * Generate tags for note content using AI.
 * @param noteContent - The text content to generate tags for
 * @returns Array of tag strings
 */
async function generateTags(noteContent: string): Promise<string[]> {
  return generateTagsOnServer({ data: { noteContent } })
}

export const tagsService = {
  generateTags,
}
