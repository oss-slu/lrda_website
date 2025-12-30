import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  // Next.js base configs (flat)
  ...nextCoreWebVitals,
  ...nextTypescript,

  // Global rules
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",

      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "off",

      "@next/next/no-img-element": "off",

      "react/no-children-prop": "off",
      "react/no-unescaped-entities": "off",
      "react/jsx-no-undef": "off",

      "no-var": "off",
      "prefer-const": "off",
    },
  },

  // Overrides for tests / mocks
  {
    files: ["**/__tests__/**/*", "**/__e2e__/**/*", "**/__mocks__/**/*"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
    },
  },
]);
