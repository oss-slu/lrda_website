import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    css: false,
    alias: {
      // Module mocks for packages that break in jsdom
      uuid: './src/__mocks__/uuid.js',
      'react-player': './src/__mocks__/react-player.js',
      'intro.js': './src/__mocks__/intro.js',
      'intro.js/introjs.css': './src/__mocks__/styleMock.js',
    },
  },
});
