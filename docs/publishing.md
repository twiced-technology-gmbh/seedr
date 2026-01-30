# Publishing Guide

## Prerequisites

- Node.js >= 20
- pnpm installed
- npm account ([signup](https://www.npmjs.com/signup))

## npm Publishing

### 1. Login to npm

```bash
npm login
# Enter username, password, email, and 2FA code if enabled

# Verify login:
npm whoami
```

### 2. Check Package Name Availability

```bash
npm view seedr
# 404 = available, package info = taken
```

### 3. Build and Publish

```bash
# From monorepo root:
pnpm build

# Navigate to CLI package:
cd packages/cli

# Dry run first:
npm publish --dry-run

# Publish:
npm publish --access public
```

### 4. Verify Publication

```bash
npm view seedr

# Test (wait a minute for npm to propagate):
npx seedr --help
```

## Version Bumping

Before publishing updates:

```bash
cd packages/cli

# Patch version (0.1.0 -> 0.1.1):
npm version patch

# Minor version (0.1.0 -> 0.2.0):
npm version minor

# Major version (0.1.0 -> 1.0.0):
npm version major
```

Then rebuild and publish.

## GitHub Repository

The CLI fetches skill files from GitHub raw content. The repository must be **public** for this to work.

Update the GitHub URL in `packages/cli/src/config/registry.ts` if using a different org:

```typescript
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/YOUR_ORG/seedr/main/registry";
```

Also update `packages/cli/package.json`:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_ORG/seedr.git"
  }
}
```

## Web App Deployment

Deploy `apps/web` to your hosting provider (Vercel, Netlify, etc.) at `seedr.toolr.dev`.

The web app displays available skills with copy-able `npx seedr add <skill>` commands.
