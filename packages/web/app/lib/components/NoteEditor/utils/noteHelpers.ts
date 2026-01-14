/**
 * Normalize note IDs - handles both URL format and plain ID
 */
export const normalizeNoteId = (id: string | undefined | null): string | null => {
  if (!id) return null;
  // If it's a URL, extract the ID from it
  if (id.startsWith('http://') || id.startsWith('https://')) {
    // Extract ID from RERUM URL format: .../v1/id/{id} or .../id/{id}
    const match = id.match(/\/(?:v1\/)?id\/([^\/\?]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // Fallback: get the last part of the URL
    const parts = id.split('/');
    return parts[parts.length - 1] || id;
  }
  return id;
};

/**
 * Check if two note IDs match (handles URL and plain formats)
 */
export const noteIdsMatch = (
  id1: string | undefined | null,
  id2: string | undefined | null,
): boolean => {
  const normalized1 = normalizeNoteId(id1);
  const normalized2 = normalizeNoteId(id2);
  if (!normalized1 || !normalized2) return false;
  return normalized1 === normalized2;
};

/**
 * Get a cookie value by name
 */
export const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

/**
 * Set a cookie with expiration
 */
export const setCookie = (name: string, value: string, days: number): void => {
  if (typeof window === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; path=/; expires=${date.toUTCString()}`;
};
