# Scheduler & CI/CD Workflows

Seedr uses GitHub Actions to automatically sync content from upstream sources and deploy updates.

## Workflows

### 1. Sync Registry (`sync.yml`)

**Trigger:** Daily at 6:00 UTC + manual dispatch

**Purpose:** Fetches skills and plugins from Anthropic repositories and updates the registry manifest.

**Sources:**
- `anthropics/skills` → Official skills (all AI tools)
- `anthropics/claude-plugins-official/plugins` → Official plugins (Claude only)
- `anthropics/claude-plugins-official/external_plugins` → Community plugins (Claude only)

**Flow:**
```
Schedule (6:00 UTC) or Manual Trigger
            ↓
    Fetch from Anthropic repos
            ↓
    Update registry/manifest.json
            ↓
    If changes detected:
      → Commit to main
      → Push to main AND prod
```

### 2. Deploy (`deploy.yml`)

**Trigger:** Push to `prod` branch + manual dispatch

**Purpose:** Deploys web app to Cloudflare Pages and publishes CLI to npm.

**Flow:**
```
Push to prod
     ↓
┌────────────────────────────────────┐
│ Job 1: Deploy Web                  │
│   → Build all packages             │
│   → Deploy to Cloudflare Pages     │
└────────────────────────────────────┘
     ↓
┌────────────────────────────────────┐
│ Job 2: Publish CLI                 │
│   → Check for changes in:          │
│     - packages/cli/**              │
│     - registry/**                  │
│   → If changes since last release: │
│     - Bump patch version           │
│     - Commit version bump          │
│     - Publish to npm               │
└────────────────────────────────────┘
```

## Automatic Version Bumping

The CLI version is automatically bumped when:

1. **CLI code changes** - Any file in `packages/cli/` modified
2. **Registry changes** - `registry/manifest.json` updated (e.g., new skills from Anthropic)

Version bump logic:
- Compares current `package.json` version with npm
- If already different → publish without bumping (manual bump detected)
- If same → check for file changes since last version commit
- If changes exist → bump patch version (0.1.3 → 0.1.4)

## End-to-End Flow

When Anthropic adds a new skill:

```
1. Daily sync runs at 6:00 UTC
        ↓
2. Fetches new skill from anthropics/skills
        ↓
3. Updates registry/manifest.json
        ↓
4. Commits: "chore: sync registry from Anthropic"
        ↓
5. Pushes to main AND prod
        ↓
6. Push to prod triggers deploy.yml
        ↓
7. Deploy detects registry/ changed
        ↓
8. Bumps CLI version (0.1.4 → 0.1.5)
        ↓
9. Commits: "chore(cli): bump version to 0.1.5 [skip ci]"
        ↓
10. Publishes @toolr/seedr@0.1.5 to npm
        ↓
11. Users get new skill via: npx @toolr/seedr add <new-skill>
```

## Manual Triggers

Both workflows can be triggered manually from GitHub Actions:

- **Sync:** Actions → Sync Registry → Run workflow
- **Deploy:** Actions → Deploy → Run workflow

## Files

| File | Purpose |
|------|---------|
| `.github/workflows/sync.yml` | Registry sync workflow |
| `.github/workflows/deploy.yml` | Deploy + publish workflow |
| `scripts/sync.ts` | Main sync orchestrator |
| `scripts/sync/anthropic.ts` | Anthropic-specific fetch logic |
| `registry/manifest.json` | Registry index (source of truth) |
