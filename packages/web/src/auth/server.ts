import { getRequestHeaders } from '@tanstack/react-start/server';
import { API_URL } from '../services/api';

/**
 * Make an authenticated fetch to the API from server-side code,
 * forwarding the request cookies.
 */
export async function fetchFromAPI<T>(path: string): Promise<T | null> {
  const headers = getRequestHeaders();
  const cookieHeader =
    headers instanceof Headers ?
      headers.get('cookie')
    : (headers as Record<string, string>).cookie;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        cookie: cookieHeader || '',
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}
