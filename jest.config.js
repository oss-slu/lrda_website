const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: "jest-environment-jsdom",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  maxWorkers: "50%",
  moduleNameMapper: {
    "^@/app/(.*)$": "<rootDir>/app/$1",           // ✅ fix this line
    "^@/components/(.*)$": "<rootDir>/app/lib/components/$1",  // Optional if needed
    "^@/utils/(.*)$": "<rootDir>/app/utils/$1",   // Optional if needed
  },
};

module.exports = createJestConfig(customJestConfig);
