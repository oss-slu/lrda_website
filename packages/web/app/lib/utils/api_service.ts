/**
 * @deprecated This file is deprecated. Use the new services in app/lib/services/ instead.
 * Only fetchMessages remains for admin_utils.ts compatibility.
 * Will be removed once admin functionality is migrated.
 */

const RERUM_PREFIX = process.env.NEXT_PUBLIC_RERUM_PREFIX || '';

// Only validate at runtime, not during build/SSR
if (typeof window !== 'undefined') {
  if (!RERUM_PREFIX) {
    console.error('RERUM_PREFIX is not defined in the environment variables.');
  }
}

/**
 * @deprecated Use services from app/lib/services/ instead.
 * This class is kept only for admin_utils.ts backwards compatibility.
 */
export default class ApiService {
  /**
   * Fetches messages from the API, with optional pagination.
   * @deprecated This method will be moved to a dedicated service.
   * @param {boolean} global - Indicates whether to fetch global messages or user-specific messages.
   * @param {boolean} published - Indicates whether to fetch only published messages.
   * @param {string} userId - The ID of the user for user-specific messages.
   * @param {number} [limit=150] - The limit of messages per page. Defaults to 150.
   * @param {number} [skip=0] - The iterator to skip messages for pagination.
   * @param {Array} [allResults=[]] - The accumulated results for pagination.
   * @returns {Promise<any[]>} The array of messages fetched from the API.
   */
  static async fetchMessages(
    global: boolean,
    published: boolean,
    userId: string,
    limit = 150,
    skip = 0,
    allResults: any[] = [],
  ): Promise<any[]> {
    try {
      const url = `${RERUM_PREFIX}query?limit=${limit}&skip=${skip}`;

      const headers = {
        'Content-Type': 'application/json',
      };

      let body: { type: string; published?: boolean; creator?: string } = {
        type: 'message',
      };

      if (global) {
        body = { type: 'message' };
      } else if (published) {
        body = { type: 'message', published: true, creator: userId };
      } else {
        body = { type: 'message', creator: userId };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.length > 0) {
        allResults = allResults.concat(data);
        return this.fetchMessages(global, published, userId, limit, skip + data.length, allResults);
      }

      return allResults;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }
}
