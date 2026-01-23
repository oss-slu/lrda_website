/**
 * REST API client for the Hono backend.
 * Uses session-based authentication with cookies.
 */

import { HttpClient, ApiResponse } from './http-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

/**
 * Client for interacting with our REST API (Hono backend).
 * All requests include credentials for session-based auth.
 */
export class RestClient extends HttpClient {
  constructor(baseUrl?: string) {
    super({
      baseUrl: baseUrl || API_URL,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Override request to include credentials (cookies) for auth.
   */
  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return super.request<T>(endpoint, {
      ...options,
      credentials: 'include',
    });
  }

  /**
   * Build query string from object.
   */
  buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
  }
}

// Singleton instance for general use
export const restClient = new RestClient();

// Export API URL for services that need it
export { API_URL };
