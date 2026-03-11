/**
 * Shared API utilities for making authenticated requests.
 *
 * This is the single HTTP client for all frontend API calls.
 * All requests include credentials (cookies) for session-based auth.
 */

export const API_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

/**
 * Make an authenticated fetch request to the API.
 * Includes credentials (cookies) for session-based auth.
 * Throws on non-ok responses. Returns parsed JSON, or undefined for empty responses (e.g. 204).
 */
export async function fetchWithAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  // Handle empty responses (204 No Content, empty body)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json();
}

/**
 * Build a URL query string from an object of parameters.
 * Filters out null/undefined values.
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}
