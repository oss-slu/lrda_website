/**
 * @deprecated This file is deprecated. Use the new services in app/lib/services/ instead.
 * Only fetchMessages remains for backwards compatibility.
 * Will be removed in a future update.
 */

import { notesService } from '@/app/lib/services';

/**
 * @deprecated Use notesService from app/lib/services/ instead.
 * This class is kept only for backwards compatibility.
 */
export default class ApiService {
  /**
   * Fetches messages from the API, with optional pagination.
   * @deprecated Use notesService.fetchMessages() instead.
   * @param {boolean} global - Indicates whether to fetch global messages or user-specific messages.
   * @param {boolean} published - Indicates whether to fetch only published messages.
   * @param {string} userId - The ID of the user for user-specific messages.
   * @param {number} [limit=150] - The limit of messages per page. Defaults to 150.
   * @param {number} [skip=0] - The iterator to skip messages for pagination.
   * @returns {Promise<any[]>} The array of messages fetched from the API.
   */
  static async fetchMessages(
    global: boolean,
    published: boolean,
    userId: string,
    limit = 150,
    skip = 0,
  ): Promise<any[]> {
    console.warn(
      'ApiService.fetchMessages is deprecated. Use notesService.fetchMessages() from @/app/lib/services instead.',
    );
    return notesService.fetchMessages(global, published, userId, limit, skip);
  }
}
