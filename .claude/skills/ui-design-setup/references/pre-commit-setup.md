# Pre-commit Hook Setup

## Option A: lint-staged + husky (for apps without existing hooks)

### Install

```bash
npm install -D lint-staged husky
npx husky init
```

### Configure lint-staged in package.json

```json
{
  "lint-staged": {
    "*.{ts,tsx}": "eslint --max-warnings 0"
  }
}
```

### Wire husky pre-commit hook

Write to `.husky/pre-commit`:

```bash
npx lint-staged
```

## Option B: Integrate with existing .githooks (for seedr and similar)

If the app already uses `.githooks/pre-commit`, append the lint check:

```bash
#!/usr/bin/env bash

# (keep existing hook content above)

# Design system lint on staged TS/TSX files
STAGED_TS=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)
if [ -n "$STAGED_TS" ]; then
  echo "$STAGED_TS" | xargs npx eslint --max-warnings 0
fi
```

## Option C: pnpm/turbo monorepo

For monorepos with turbo, add lint-staged at the root:

```json
{
  "lint-staged": {
    "apps/web/src/**/*.{ts,tsx}": "eslint --max-warnings 0"
  }
}
```

And configure the `prepare` script to set up hooks:

```json
{
  "scripts": {
    "prepare": "husky || true"
  }
}
```

Or if already using `"prepare": "git config core.hooksPath .githooks"`, use Option B instead.
