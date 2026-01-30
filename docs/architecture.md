# Architecture

## Overview

Seedr consists of three main components:

```
seedr/
├── packages/cli/     # npm package (npx seedr)
├── apps/web/         # Web UI (seedr.toolr.dev)
└── registry/         # Skill files (hosted on GitHub)
```

## How npx Installation Works

When a user runs `npx seedr add lint-doctor`:

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Machine                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. npx seedr add lint-doctor                               │
│       │                                                     │
│       ▼                                                     │
│  2. npm registry downloads 'seedr' package to temp cache    │
│       │                                                     │
│       ▼                                                     │
│  3. Executes ./dist/cli.js (has shebang #!/usr/bin/env node)│
│       │                                                     │
│       ▼                                                     │
│  4. CLI fetches manifest from GitHub raw:                   │
│     raw.githubusercontent.com/.../registry/manifest.json    │
│       │                                                     │
│       ▼                                                     │
│  5. CLI fetches skill content from GitHub raw:              │
│     raw.githubusercontent.com/.../registry/skills/<slug>/   │
│       │                                                     │
│       ▼                                                     │
│  6. Writes skill to target location:                        │
│     ~/.claude/commands/lint-doctor.md                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### CLI Package (`packages/cli`)

- Published to npm as `seedr`
- Entry point: `dist/cli.js`
- Built with tsup (ESM bundle with shebang)

**Key files:**
- `src/cli.ts` - Commander setup, subcommands
- `src/config/registry.ts` - Manifest/content fetching (local + remote fallback)
- `src/handlers/skill.ts` - Installation logic
- `src/config/tools.ts` - AI tool paths (Claude, Copilot, etc.)

### Web App (`apps/web`)

- React + Vite + Tailwind
- Displays available skills from registry
- Shows `npx seedr add <skill>` commands
- Deployed to seedr.toolr.dev

### Registry (`registry/`)

```
registry/
├── manifest.json           # Index of all available items
└── skills/                 # Skill source files
    └── <slug>/
        ├── SKILL.md        # Main skill definition
        └── references/     # Supporting reference files
```

Skills are fetched directly from source files via `raw.githubusercontent.com`.

## Data Flow

```
                    ┌──────────────┐
                    │   GitHub     │
                    │  (public)    │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ npm install │ │  CLI fetch  │ │  Web app    │
    │  (package)  │ │  (skills)   │ │  (display)  │
    └─────────────┘ └─────────────┘ └─────────────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    User      │
                    └──────────────┘
```

## Registry Loading Strategy

The CLI uses a local-first, remote-fallback approach:

```typescript
// 1. Try local path (for development)
const localPath = join(__dirname, "../../../../registry");
await readFile(join(localPath, "manifest.json"));

// 2. Fall back to GitHub raw (production)
const remoteUrl = "https://raw.githubusercontent.com/toolr-suite/seedr/main/registry";
await fetch(`${remoteUrl}/manifest.json`);
```

This allows:
- Local development without network requests
- Production use fetches from GitHub
- Skills can be updated by pushing to GitHub (no npm publish needed)

## Installation Targets

Skills can be installed for multiple AI tools:

| Tool | Project Path | User Path |
|------|--------------|-----------|
| Claude | `.claude/commands/` | `~/.claude/commands/` |
| Copilot | `.github/copilot-instructions/` | - |
| Gemini | `.gemini/` | - |
| Codex | `.codex/` | - |
| OpenCode | `.opencode/agents/` | - |
