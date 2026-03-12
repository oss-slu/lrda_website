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
  envPrefix: ['NEXT_PUBLIC_'],
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
          const staticPaths = ['/', '/resources', '/wheres-religion'];
          return staticPaths.includes(path);
        },
      },
    }),
    viteReact(),
  ],
});
