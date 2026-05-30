import { defineConfig } from 'vitest/config';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['src/__e2e__/**'],
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
