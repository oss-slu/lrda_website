// jest.setup.ts

process.env.NEXT_PUBLIC_RERUM_PREFIX = "http://mock-rerum-prefix";
process.env.NEXT_PUBLIC_OPENAI_API_KEY = "mock-openai-api-key";
process.env.NEXT_PUBLIC_OPENAI_API_URL = "http://mock-openai-api-url";

// Increase the timeout for all tests
jest.setTimeout(30000); // 30 seconds
