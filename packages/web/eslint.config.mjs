import { defineConfig } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  // Ignore config files (CommonJS)
  {
    ignores: ['jest.config.js', 'tailwind.config.js', 'values.js'],
  },

  // Next.js base configs (flat)
  ...nextCoreWebVitals,
  ...nextTypescript,

  // Global rules
  {
    rules: {
      // TypeScript rules - keep relaxed for now
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',

      // React Hooks - IMPORTANT: These catch real bugs
      'react-hooks/rules-of-hooks': 'error', // Hooks must be called in consistent order
      'react-hooks/exhaustive-deps': 'warn', // Warn about missing dependencies

      // React rules - basic safety
      'react/jsx-key': 'error', // Require key prop in iterators
      'react/no-children-prop': 'off',
      'react/no-unescaped-entities': 'off',
      'react/jsx-no-undef': 'off',

      // Next.js rules
      '@next/next/no-img-element': 'off',

      // General JS rules
      'no-var': 'off',
      'prefer-const': 'off',
    },
  },

  // Overrides for tests / mocks - more relaxed
  {
    files: ['**/__tests__/**/*', '**/__e2e__/**/*', '**/__mocks__/**/*'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'react-hooks/exhaustive-deps': 'off', // Tests often have intentional dependency patterns
    },
  },
]);
