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
    include: ['app/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['app/__e2e__/**'],
    css: false,
    alias: {
      // Module mocks for packages that break in jsdom
      uuid: './app/__mocks__/uuid.js',
      'react-player': './app/__mocks__/react-player.js',
      'intro.js': './app/__mocks__/intro.js',
      'intro.js/introjs.css': './app/__mocks__/styleMock.js',
    },
  },
});
