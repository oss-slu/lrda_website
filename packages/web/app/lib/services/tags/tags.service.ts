/**
 * Tags Service
 *
 * Client-side service for generating tags via the server-side API.
 * This keeps the OpenAI API key secure on the server.
 */

interface TagsResponse {
  tags: string[];
  error?: string;
}

class TagsService {
  /**
   * Generate tags for note content using AI.
   * @param noteContent - The text content to generate tags for
   * @returns Array of tag strings
   * @throws Error if tag generation fails
   */
  async generateTags(noteContent: string): Promise<string[]> {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteContent }),
      });

      const data: TagsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate tags');
      }

      return data.tags;
    } catch (error) {
      console.error('Error generating tags:', error);
      throw error;
    }
  }

  /**
   * Generate tags for multiple notes.
   * @param noteContents - Array of note text contents
   * @returns Array of tag strings (combined from all notes)
   */
  async generateTagsForMultiple(noteContents: string[]): Promise<string[]> {
    const combined = noteContents.join('\n');
    return this.generateTags(combined);
  }
}

// Export singleton instance
export const tagsService = new TagsService();

// Export class for testing
export { TagsService };
