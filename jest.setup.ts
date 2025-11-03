// jest.setup.ts

process.env.NEXT_PUBLIC_RERUM_PREFIX = "http://mock-rerum-prefix";
process.env.NEXT_PUBLIC_OPENAI_API_KEY = "mock-openai-api-key";
process.env.NEXT_PUBLIC_OPENAI_API_URL = "http://mock-openai-api-url";
process.env.NEXT_PUBLIC_MAP_KEY = "test-api-key"; // Stub for Google Maps API key in tests

// Increase the timeout for all tests
jest.setTimeout(30000); // 30 seconds
