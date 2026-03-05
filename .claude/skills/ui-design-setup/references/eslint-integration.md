# ESLint Integration Examples

How to wire `eslint-plugin-toolr-design.js` into different ESLint config styles used across toolr apps.

## Style 1: defineConfig (toolr-app, eslint 9)

```js
import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import toolrDesign from './eslint-plugin-toolr-design.js'

export default defineConfig([
  // ... existing config blocks ...

  // Design system enforcement
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'toolr-design': toolrDesign,
    },
    rules: {
      'toolr-design/no-raw-spacing': 'warn',
      'toolr-design/no-raw-colors': 'warn',
      'toolr-design/no-raw-text-size': 'warn',
      'toolr-design/prefer-design-components': 'warn',
      'toolr-design/no-deep-imports': 'error',
      'toolr-design/no-direct-icon-imports': 'warn',
      'toolr-design/no-browser-dialogs': 'warn',
    },
  },
])
```

## Style 2: tseslint.config (seedr, eslint 10)

```js
import tseslint from 'typescript-eslint'
import toolrDesign from './eslint-plugin-toolr-design.js'

export default tseslint.config(
  // ... existing config blocks ...

  // Design system enforcement
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'toolr-design': toolrDesign,
    },
    rules: {
      'toolr-design/no-raw-spacing': 'warn',
      'toolr-design/no-raw-colors': 'warn',
      'toolr-design/no-raw-text-size': 'warn',
      'toolr-design/prefer-design-components': 'warn',
      'toolr-design/no-deep-imports': 'error',
      'toolr-design/no-direct-icon-imports': 'warn',
      'toolr-design/no-browser-dialogs': 'warn',
    },
  }
)
```

## Monorepo apps (seedr with turbo)

For monorepos, the ESLint config may be at the root or in individual packages. Check which applies:

- If there's a root `eslint.config.js` with rules covering `apps/web/**`, add the design system block there with the same file pattern.
- If each package has its own `eslint.config.js`, add the block to the web app's config.

## Scope

Only target source files, not config or scripts:

```js
{
  files: ['src/**/*.{ts,tsx}'],  // or 'apps/web/src/**/*.{ts,tsx}' for monorepos
  // ...
}
```

Exclude test files if they have relaxed rules:

```js
{
  files: ['src/**/*.{ts,tsx}'],
  ignores: ['**/__tests__/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
  // ...
}
```
