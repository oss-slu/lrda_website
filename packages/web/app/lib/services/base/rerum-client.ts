/**
 * RERUM-specific HTTP client that extends the base HttpClient.
 * Provides methods tailored for the RERUM API including paged queries.
 */

import { HttpClient, ApiResponse } from './http-client';

const RERUM_PREFIX = process.env.NEXT_PUBLIC_RERUM_PREFIX || '';

// Validate at runtime (client-side only)
if (typeof window !== 'undefined' && !RERUM_PREFIX) {
  console.error('RERUM_PREFIX is not defined in the environment variables.');
}

export interface PagedQueryOptions {
  limit?: number;
  skip?: number;
}

/**
 * Client for interacting with the RERUM API.
 * RERUM is a Linked Data repository used for storing notes/messages.
 */
export class RerumClient extends HttpClient {
  constructor(baseUrl?: string) {
    super({
      baseUrl: baseUrl || RERUM_PREFIX,
      defaultHeaders: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }

  /**
   * Execute a RERUM query with optional pagination.
   * @param queryObj - The query object to send to RERUM
   * @param options - Pagination options (limit, skip)
   * @returns Array of matching results
   */
  async query<T>(queryObj: object, options: PagedQueryOptions = {}): Promise<T[]> {
    const { limit = 150, skip = 0 } = options;
    const endpoint = `query?limit=${limit}&skip=${skip}`;
    const response = await this.post<T[]>(endpoint, queryObj);
    return response.data;
  }

  /**
   * Execute a paged query that recursively fetches all results.
   * Continues fetching until no more results are returned.
   * @param queryObj - The query object to send to RERUM
   * @param limit - Number of results per page (default: 150)
   * @param skip - Starting offset (default: 0)
   * @param allResults - Accumulated results (used internally)
   * @returns Array of all matching results across all pages
   */
  async pagedQuery<T>(queryObj: object, limit = 150, skip = 0, allResults: T[] = []): Promise<T[]> {
    try {
      const results = await this.query<T>(queryObj, { limit, skip });

      if (results.length > 0) {
        allResults = allResults.concat(results);
        return this.pagedQuery(queryObj, limit, skip + results.length, allResults);
      }

      return allResults;
    } catch (error) {
      console.warn('Could not process a result in paged query', error);
      throw error;
    }
  }

  /**
   * Create a new object in RERUM.
   * @param data - The data to store
   * @returns The created object with RERUM metadata (@id, etc.)
   */
  async create<T>(data: object): Promise<ApiResponse<T>> {
    return this.post<T>('create', data);
  }

  /**
   * Overwrite an existing object in RERUM.
   * The object must include an @id field.
   * @param data - The complete object data (must include @id)
   * @returns The updated object
   */
  async overwrite<T>(data: object): Promise<ApiResponse<T>> {
    return this.put<T>('overwrite', data);
  }

  /**
   * Delete an object from RERUM.
   * @param id - The @id of the object to delete
   * @param additionalBody - Additional fields to include in the delete request
   * @returns True if deletion was successful (204 response)
   */
  async remove(id: string, additionalBody: object = {}): Promise<boolean> {
    // Get auth token from localStorage (client-side only)
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await this.delete<void>(
      'delete',
      {
        '@id': id,
        ...additionalBody,
      },
      headers,
    );

    return response.status === 204;
  }

  /**
   * Fetch a single object by its @id.
   * @param id - The @id of the object to fetch
   * @returns The object or null if not found
   */
  async fetchById<T>(id: string): Promise<T | null> {
    try {
      // RERUM IDs are typically full URLs
      const url = id.startsWith('http') ? id : `${this.baseUrl}id/${id}`;
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn(`Failed to fetch object by id: ${id}`, error);
      return null;
    }
  }
}

// Singleton instance for general use
export const rerumClient = new RerumClient();

// Export the RERUM prefix for services that need it
export { RERUM_PREFIX };
