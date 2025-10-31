const nextJest = require("next/jest");
const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: "jest-environment-jsdom",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  maxWorkers: "50%",  // Limit to 50% of available CPUs to avoid overloading
  // Transform ES modules for Jest compatibility
  transformIgnorePatterns: [
    "node_modules/(?!(react-resizable-panels|@react-resizable-panels|@radix-ui|@googlemaps|@react-googlemaps)/)"
  ],
  // Map ES module packages to their mocks
  moduleNameMapper: {
    "^uuid$": "<rootDir>/app/__mocks__/uuid.js",
    "^react-player$": "<rootDir>/app/__mocks__/react-player.js",
    "^intro\\.js$": "<rootDir>/app/__mocks__/intro.js",
    "^intro\\.js/introjs\\.css$": "<rootDir>/app/__mocks__/styleMock.js",
  },
  // Exclude Playwright E2E tests from Jest runs
  testPathIgnorePatterns: [
    "<rootDir>/app/__e2e__/",
    "<rootDir>/node_modules/"
  ],
};

module.exports = createJestConfig({
  ...customJestConfig,
});
