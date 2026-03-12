/**
 * Get a cookie value by name
 */
export const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match?.[2] ?? null;
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
