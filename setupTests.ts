import '@testing-library/jest-dom';
import fetchMock from 'jest-fetch-mock';
import { TextEncoder, TextDecoder } from 'util';

fetchMock.enableMocks();

// Mock TextEncoder and TextDecoder for jsPDF compatibility
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Polyfill setImmediate for Node.js environments
if (typeof global.setImmediate === 'undefined') {
  (global as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) => {
    return setTimeout(() => fn(...args), 0);
  };
  (global as any).clearImmediate = (id: ReturnType<typeof setTimeout>) => {
    return clearTimeout(id);
  };
}

// Ensure Firebase env vars exist in test environment
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'test-auth.example.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'test-bucket';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123:web:abc';

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// List of suppressed console messages (expected in tests, not actual errors)
const suppressedMessages = [
  // Error messages
  "Error fetching messages",
  "There was a server error logging in",
  "Geolocation not supported",
  "Geolocation is not supported by this browser",
  
  // Warning messages
  "User data is not loaded yet",
  "Could not process a result in paged query",
  "User is not an instructor",
  "No students found for instructor",
  "No user data found in Firestore",
  
  // Log messages (debug/info that's noisy in tests)
  "🔍 User.getRoles()",
  "No userData, user has only auth - returning default roles",
  "EnhancedNoteCard received note:",
  "Fetching location for Lat/Lng:",
  "Geocoding API response:",
  "Using last known location due to error:",
  "📝 Student UIDs from instructor data:",
  "📋 All student notes fetched:",
  "📋 Total unarchived notes:",
  "⏳ Awaiting approval count:",
  "isInstructor:",
  "parentInstructorId:",
  "Fetched Notes:",
  "Fetched personal notes:",
  "Fetched global notes:",
  "Username or password cannot be empty.",
  "Login status:",
  "An error occurred during login:",
  
  // Jest cleanup messages
  "All mocks and timers have been cleared",
];

beforeAll(() => {
  // Suppress console.error for known benign messages
  console.error = (...args) => {
    if (!args || args.length === 0) return;
    const message = String(args[0] || '');
    // Skip if message matches suppressed patterns
    if (suppressedMessages.some((msg) => message.includes(msg))) {
      return; // suppress
    }
    originalConsoleError(...args);
  };

  // Suppress console.warn for known benign messages
  console.warn = (...args) => {
    if (!args || args.length === 0) return;
    const message = String(args[0] || '');
    // Skip if message matches suppressed patterns
    if (suppressedMessages.some((msg) => message.includes(msg))) {
      return; // suppress
    }
    originalConsoleWarn(...args);
  };

  // Suppress console.log for known debug/info messages (but keep test output visible)
  console.log = (...args) => {
    if (!args || args.length === 0) return;
    const message = String(args[0] || '');
    // Skip if message matches suppressed patterns, but allow Jest test output
    if (
      suppressedMessages.some((msg) => message.includes(msg)) ||
      message.includes('setupTests.ts') // Suppress internal setup file messages
    ) {
      return; // suppress
    }
    originalConsoleLog(...args);
  };
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});
