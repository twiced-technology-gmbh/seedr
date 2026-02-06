# Seedr

CLI and web registry for browsing and installing AI coding assistant content: skills, agents, hooks, plugins, MCP servers, and settings. Part of the toolr-suite ecosystem.

## Tech Stack

- **Monorepo**: pnpm workspaces + Turbo
- **CLI**: TypeScript, Commander.js, Chalk, Ora, Inquirer
- **Web**: React 18, Vite, React Router, Tailwind CSS
- **Build**: tsup (CLI), Vite (web)

## Commands

```bash
# Monorepo (from project root)
pnpm install              # Install all dependencies
pnpm build                # Build all packages (via turbo)
pnpm dev                  # Run all dev servers
pnpm lint                 # Lint all packages
pnpm typecheck            # Type-check all packages
pnpm clean                # Clean all build artifacts

# CLI package (from packages/cli/)
pnpm build                # Build CLI
pnpm dev                  # Watch mode
tsx src/cli.ts            # Run CLI directly during dev

# Web app (from apps/web/)
pnpm dev                  # Vite dev server
pnpm build                # Production build
```

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm --filter @toolr/seedr test

# Run tests in watch mode
pnpm --filter @toolr/seedr test:watch

# Run tests with coverage report
pnpm --filter @toolr/seedr test:coverage
```

### Install Smoke Tests

Reads the real `manifest.json` and verifies every item can be installed through its handler.

- **Mocked** (always run, ~50ms): Calls the appropriate handler (`installSkill`, `installPlugin`, etc.) with memfs + mocked registry. Verifies every install returns `success: true`. Empty type categories (agents, hooks, mcp, settings) are auto-skipped.
- **Live URL validation** (`SEEDR_LIVE=true`, ~20s): For every item with an `externalUrl`, fetches the main content file from GitHub raw. Skills must return 200 with YAML frontmatter, plugins must return valid `plugin.json` with a `name` field.

```bash
# Fast mocked tests (CI/build)
pnpm test -- install-all

# Live URL validation (pre-release)
SEEDR_LIVE=true pnpm test -- install-all
```

### Manual Verification

```bash
# CLI changes - test commands directly
cd packages/cli && tsx src/cli.ts --help
tsx src/cli.ts list
tsx src/cli.ts add <skill-name> --dry-run

# Web changes - verify in browser
cd apps/web && pnpm dev  # Opens http://localhost:5173
```

See [docs/manual-tests/dry-run-commands.md](docs/manual-tests/dry-run-commands.md) for comprehensive dry-run testing commands.

## Architecture

### Monorepo Structure

```
seedr/
├── apps/web/             # React web app (seedr.toolr.dev)
├── packages/cli/         # CLI package (npx seedr)
├── registry/
│   ├── manifest.json     # Registry index (source of truth)
│   ├── skills/           # Skill content
│   └── plugins/          # Plugin content
├── .claude/skills/       # Local skill definitions (dev)
├── turbo.json            # Build orchestration
└── pnpm-workspace.yaml   # Workspace config
```

### Key Entry Points

| Component | Entry | Purpose |
|-----------|-------|---------|
| CLI | `packages/cli/src/cli.ts` | Commander setup |
| Web | `apps/web/src/App.tsx` | React router |
| Registry | `packages/cli/src/config/registry.ts` | Manifest loading |

### CLI Package (`packages/cli/`)

- `src/cli.ts` - Entry point, command registration
- `src/commands/` - add, init, list, remove commands
- `src/config/` - Registry and tool configs
- `src/handlers/` - Content type handlers (skill, agent, hook, mcp, settings, plugin)
- `src/utils/` - File system, detection, conversion utilities
- `src/types.ts` - Shared types

### Web App (`apps/web/`)

- `src/routes/` - Browse, Detail, Home pages
- `src/components/` - UI components
- `src/lib/` - Registry client, types, utilities

### Registry

- `registry/manifest.json` - Index of all available items
- Items can be symlinked (dev) or copied (published)
- Manifest structure: `{ skills: [...], agents: [...], ... }`

## Managing Registry Items

Skills for adding and removing items from `registry/manifest.json`:

### `/add-toolr <path>` — Add local toolr items

For first-party content maintained in this repo. Copies files into `registry/` and adds a manifest entry with `sourceType: "toolr"`.

```bash
# Example: add a hook from a local path
/add-toolr /Users/daniel/project/.claude/hooks/pre-commit-lint
```

- Auto-detects content type from path segments (`/skills/`, `/hooks/`, `/agents/`, etc.)
- Asks for name, scope, compatibility, and description via interactive prompts
- Copies content to `registry/<type>s/<slug>/`
- Toolr items are preserved across syncs

### `/add-community <github-url>` — Add community GitHub repos

For third-party content hosted on GitHub. Metadata-only in the manifest (no local file copy) — the CLI fetches content from `externalUrl` at install time.

```bash
# Example: add a community plugin
/add-community https://github.com/obra/superpowers
```

- Detects type via GitHub API (checks `plugin.json` then `SKILL.md`)
- Extracts metadata, builds file tree, asks clarifying questions
- Adds manifest entry with `sourceType: "community"`
- Community items are re-synced from their GitHub repos on `pnpm sync`

### `/remove-toolr <slug>` — Remove local toolr items

Removes a toolr-sourced item by slug. Deletes local files from `registry/<type>s/<slug>/` and removes the manifest entry.

```bash
# Example: remove a hook
/remove-toolr pre-commit-lint
```

- Looks up item by slug with `sourceType: "toolr"`
- Confirms with user before deleting
- Deletes local directory and manifest entry

### `/remove-community <slug>` — Remove community items

Removes a community-sourced item by slug. Removes the manifest entry only (no local files to clean up).

```bash
# Example: remove a community plugin
/remove-community superpowers
```

- Looks up item by slug with `sourceType: "community"`
- Confirms with user before removing
- Removes manifest entry only (metadata-only items)

## Key Design Decisions

- **Turbo for orchestration** - Task caching and parallel execution
- **pnpm workspaces** - Shared dependencies, hoisted node_modules
- **CLI-first** - Main interaction via `seedr add`, `seedr init`
- **Web for discovery** - Browse and preview before installing
- **Registry as data** - manifest.json is the source of truth

## TypeScript Configuration

Each package has its own `tsconfig.json` extending `tsconfig.base.json`:

```bash
# Type check specific package
pnpm --filter @seedr/cli typecheck
pnpm --filter @seedr/web typecheck

# Or from package directory
npx tsc --noEmit
```

## Gotchas

- **pnpm only** - Use `pnpm` not `npm` for all operations
- **Turbo cache** - Run `pnpm clean` if builds seem stale
- **Registry symlinks** - Content in `registry/` directories may be symlinks during dev
- **Local vs remote** - CLI tries local registry first, falls back to GitHub raw
