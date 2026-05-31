import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  envPrefix: ['VITE_'],
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: false,
        filter: ({ path }) => {
          const staticPaths = [
            '/',
            '/resources',
            '/wheres-religion',
            '/login',
            '/signup',
            '/forgot-password',
            '/reset-password',
            '/confirm',
            '/verify-email',
          ];
          return staticPaths.includes(path);
        },
      },
    }),
    viteReact(),
  ],
});
