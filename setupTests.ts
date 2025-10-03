import '@testing-library/jest-dom';
import fetchMock from 'jest-fetch-mock';
import { TextEncoder, TextDecoder } from 'util';

fetchMock.enableMocks();

// Mock TextEncoder and TextDecoder for jsPDF compatibility
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Ensure Firebase env vars exist in test environment
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'test-auth.example.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'test-bucket';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123:web:abc';

const originalConsoleError = console.error;

beforeAll(() => {
  console.error = (...args) => {
    const suppressed = [
      "Error fetching messages",
      "There was a server error logging in",
    ];

    if (
      typeof args[0] === "string" &&
      suppressed.some((msg) => args[0].includes(msg))
    ) {
      return; // suppress specific known benign messages
    }

    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
