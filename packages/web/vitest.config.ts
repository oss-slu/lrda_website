import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

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
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/**/__mocks__/**',
        'src/routeTree.gen.ts',
      ],
      reporter: ['text-summary', 'html'],
      thresholds: {
        lines: 5.67,
      },
      reportOnFailure: true,
    },
    alias: {
      // Module mocks for packages that break in jsdom
      uuid: fileURLToPath(new URL('./src/__mocks__/uuid.js', import.meta.url)),
      'react-player': fileURLToPath(new URL('./src/__mocks__/react-player.js', import.meta.url)),
      'intro.js/introjs.css': fileURLToPath(
        new URL('./src/__mocks__/styleMock.js', import.meta.url),
      ),
      'intro.js': fileURLToPath(new URL('./src/__mocks__/intro.js', import.meta.url)),
    },
  },
});
