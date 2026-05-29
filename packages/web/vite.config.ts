import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig, type UserConfig } from 'vite';
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
  // sanitize-html (via postcss) imports node's `path`. Only the browser bundle
  // lacks it; the Worker gets it from nodejs_compat (and path-browserify is CJS,
  // which the workerd dev runner can't load), so shim it for the client alone.
  // `alias` is valid here at runtime but absent from EnvironmentResolveOptions's
  // type, hence the cast.
  environments: {
    client: {
      resolve: {
        alias: { path: 'path-browserify' },
      } as UserConfig['resolve'],
    },
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
          const staticPaths = ['/', '/resources', '/wheres-religion'];
          return staticPaths.includes(path);
        },
      },
    }),
    viteReact(),
  ],
});
