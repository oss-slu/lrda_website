const API_URL = () => process.env.__TEST_API_URL || 'http://localhost:3002';
const ORIGIN = () => process.env.__TEST_API_URL || 'http://localhost:3002';

/**
 * Authenticated GET request.
 */
export async function authenticatedGet(path: string, cookie: string): Promise<Response> {
  return fetch(`${API_URL()}${path}`, {
    method: 'GET',
    headers: {
      Cookie: cookie,
      Origin: ORIGIN(),
    },
  });
}

/**
 * Authenticated POST request with JSON body.
 */
export async function authenticatedPost(
  path: string,
  body: unknown,
  cookie: string,
): Promise<Response> {
  return fetch(`${API_URL()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      Origin: ORIGIN(),
    },
    body: JSON.stringify(body),
  });
}

/**
 * Authenticated PATCH request with JSON body.
 */
export async function authenticatedPatch(
  path: string,
  body: unknown,
  cookie: string,
): Promise<Response> {
  return fetch(`${API_URL()}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      Origin: ORIGIN(),
    },
    body: JSON.stringify(body),
  });
}

/**
 * Authenticated DELETE request.
 */
export async function authenticatedDelete(path: string, cookie: string): Promise<Response> {
  return fetch(`${API_URL()}${path}`, {
    method: 'DELETE',
    headers: {
      Cookie: cookie,
      Origin: ORIGIN(),
    },
  });
}

/**
 * Unauthenticated GET request.
 */
export async function unauthenticatedGet(path: string): Promise<Response> {
  return fetch(`${API_URL()}${path}`, {
    method: 'GET',
    headers: {
      Origin: ORIGIN(),
    },
  });
}

/**
 * Unauthenticated POST request with JSON body.
 */
export async function unauthenticatedPost(path: string, body: unknown): Promise<Response> {
  return fetch(`${API_URL()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN(),
    },
    body: JSON.stringify(body),
  });
}

/**
 * POST request with a mismatched Origin header (for CSRF testing).
 */
export async function crossOriginPost(
  path: string,
  body: unknown,
  cookie: string,
): Promise<Response> {
  return fetch(`${API_URL()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      Origin: 'https://evil-site.example.com',
    },
    body: JSON.stringify(body),
  });
}
