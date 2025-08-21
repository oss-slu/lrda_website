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
  // Exclude Playwright E2E tests from Jest runs
  testPathIgnorePatterns: [
    "<rootDir>/app/__e2e__/",
    "<rootDir>/node_modules/"
  ],
};

module.exports = createJestConfig({
  ...customJestConfig,
});
