import '@testing-library/jest-dom';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

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
