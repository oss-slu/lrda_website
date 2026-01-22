import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      PORT: "3003",
      DATABASE_URL: "postgresql://lrda:lrda_dev@localhost:5432/lrda_api",
      LOG_LEVEL: "silent",
      BETTER_AUTH_SECRET: "test-secret-key-for-testing-only",
      BETTER_AUTH_URL: "http://localhost:3003",
    },
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});
