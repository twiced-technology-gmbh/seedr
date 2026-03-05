import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import reactHooks from "eslint-plugin-react-hooks";
import { reactRefresh } from "eslint-plugin-react-refresh";
import toolrDesign from "./eslint-plugin-toolr-design.js";

export default tseslint.config(
  // Global ignores
  {
    ignores: ["**/dist/", "**/node_modules/", "**/coverage/", "**/*.d.ts"],
  },

  // Base config for all TS/JS files
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Shared rules for all packages
  {
    files: ["**/*.{js,ts,jsx,tsx}"],
    plugins: {
      sonarjs,
      unicorn,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      // Complexity
      "sonarjs/cognitive-complexity": ["warn", 15],
      "max-depth": ["warn", 4],

      // Code quality
      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/no-identical-functions": "warn",

      // Modern JS
      "unicorn/prefer-array-find": "warn",
      "unicorn/prefer-single-call": "warn",

      // TypeScript
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // React-specific config for web app
  {
    files: ["apps/web/**/*.{jsx,tsx}"],
    ...reactRefresh.configs.vite,
    plugins: {
      "react-hooks": reactHooks,
      ...reactRefresh.configs.vite.plugins,
    },
    rules: {
      ...reactRefresh.configs.vite.rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Design system enforcement
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    plugins: {
      "toolr-design": toolrDesign,
    },
    rules: {
      "toolr-design/no-raw-spacing": "warn",
      "toolr-design/no-raw-colors": "warn",
      "toolr-design/no-raw-text-size": "warn",
      "toolr-design/prefer-design-components": "warn",
      "toolr-design/no-deep-imports": "error",
      "toolr-design/no-direct-icon-imports": "warn",
      "toolr-design/no-browser-dialogs": "warn",
    },
  }
);
