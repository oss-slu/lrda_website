// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config';
import pluginRouter from '@tanstack/eslint-plugin-router';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.wrangler/**',
      '**/.wrangler-output/**',
      '**/.next/**',
      '**/.open-next/**',
      '**/.output/**',
      '**/.vinxi/**',
      'eslint.config.js',
      'packages/web/src/routeTree.gen.ts',
      'packages/api/drizzle/**',
      'packages/api/vitest.config.ts',
      'packages/api/src/__tests__/**',
      'packages/api/src/scripts/**',
      // Tests and mocks excluded from tsconfig (type-aware rules can't parse them)
      '**/__tests__/**',
      '**/__e2e__/**',
      '**/__mocks__/**',
      'packages/docs/**',
    ],
  },
  ...tanstackConfig,
  ...pluginRouter.configs['flat/recommended'],
  {
    rules: {
      // Cosmetic import/sort rules -- not worth the churn
      'sort-imports': 'off',
      'import/order': 'off',
      'import/first': 'off',
      'import/consistent-type-specifier-style': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',

      // Codebase uses T[] everywhere, no need to enforce Array<T>
      '@typescript-eslint/array-type': 'off',

      // Too noisy in shadcn/ui generated code, TS catches the real bugs
      'no-shadow': 'off',
    },
  },
  {
    files: ['packages/web/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['**/__tests__/**/*', '**/__e2e__/**/*', '**/__mocks__/**/*'],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];
