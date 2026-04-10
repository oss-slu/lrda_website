import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  workspaces: {
    '.': {
      entry: [],
      project: ['*.{ts,js}'],
    },
    'packages/shared': {
      project: ['src/**/*.ts'],
    },
    'packages/api': {
      entry: ['src/scripts/*.ts'],
      project: ['src/**/*.ts'],
    },
    'packages/web': {
      entry: [
        'src/start.ts',
        'src/router.tsx',
        'src/routes/**/*.{ts,tsx}',
        'app/globals.css',
      ],
      project: [
        'src/**/*.{ts,tsx}',
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
      ],
      // shadcn/ui components export everything by convention
      ignore: ['components/ui/**'],
    },
    'packages/docs': {
      ignoreDependencies: ['vue'], // VitePress peer dependency
      project: ['.vitepress/**/*.{ts,mts}'],
    },
  },
  // System binaries used in npm scripts
  ignoreBinaries: ['sleep', 'lsof'],
};

export default config;
