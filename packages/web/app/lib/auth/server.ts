import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

const API_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

/**
 * Fetch the current user from the API using server-side cookies.
 * Returns the user object if authenticated, or null otherwise.
 */
export const getServerUser = createServerFn().handler(async () => {
  const headers = getRequestHeaders()
  const cookieHeader = headers instanceof Headers ? headers.get('cookie') : (headers as Record<string, string>)?.cookie

  if (!cookieHeader) return null

  try {
    const res = await fetch(`${API_URL}/api/users/me`, {
      headers: { cookie: cookieHeader },
    })

    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
})

/**
 * Make an authenticated fetch to the API from server-side code,
 * forwarding the request cookies.
 */
export async function fetchFromAPI<T>(path: string): Promise<T | null> {
  const headers = getRequestHeaders()
  const cookieHeader = headers instanceof Headers ? headers.get('cookie') : (headers as Record<string, string>)?.cookie

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        cookie: cookieHeader || '',
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}
