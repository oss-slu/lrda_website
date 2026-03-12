import '@testing-library/jest-dom/vitest';
import { vi, beforeAll, afterAll } from 'vitest';

// Mock global fetch
const fetchMock = vi.fn(() =>
  Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
);
vi.stubGlobal('fetch', fetchMock);

// Ensure API env var exists in test environment
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// Suppress noisy console output from component code during tests
const suppressedMessages = [
  'Error fetching messages',
  'There was a server error logging in',
  'Geolocation not supported',
  'Geolocation is not supported by this browser',
  'User data is not loaded yet',
  'Could not process a result in paged query',
  'User is not an instructor',
  'No students found for instructor',
];

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

function isSuppressed(args: unknown[]): boolean {
  if (!args.length) return false;
  const msg = String(args[0] || '');
  return suppressedMessages.some(s => msg.includes(s));
}

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (isSuppressed(args)) return;
    originalConsoleError(...args);
  };
  console.warn = (...args: unknown[]) => {
    if (isSuppressed(args)) return;
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
