# Seedr

Seed your projects with AI configurations. Part of the [toolr-suite](https://toolr.dev) ecosystem.

## What is Seedr?

Seedr is a CLI tool and registry for AI coding assistant content. Install curated skills, agents, hooks, plugins, MCP servers, and settings for Claude Code, GitHub Copilot, Gemini, Codex, and OpenCode with a single command.

## Quick Start

```bash
# Install content interactively
npx @toolr/seedr add

# Install a specific item
npx @toolr/seedr add lint-doctor

# Install for all compatible AI tools
npx @toolr/seedr add design-patterns -a all

# List available content
npx @toolr/seedr list
```

## Content Types

| Type | Description | Compatibility |
|------|-------------|---------------|
| **Skills** | Specialized workflows and domain knowledge | All tools |
| **Agents** | Single-file agent definitions | Claude only |
| **Hooks** | Event-triggered automation | Claude only |
| **Plugins** | Extended functionality packages | Claude only |
| **MCP Servers** | Model Context Protocol integrations | All tools |
| **Settings** | Configuration presets | Claude only |

Browse all content at [seedr.toolr.dev](https://seedr.toolr.dev)

## CLI Commands

### `add [name]`

Install a skill, agent, hook, plugin, MCP server, or settings preset. Without a name, opens an interactive picker.

```bash
npx @toolr/seedr add                              # Interactive picker
npx @toolr/seedr add lint-doctor                   # Install by name
npx @toolr/seedr add github-mcp -t mcp            # Specify content type
npx @toolr/seedr add design-patterns -a all        # Install for all AI tools
npx @toolr/seedr add pdf -s user                   # Install to user scope
npx @toolr/seedr add code-review --dry-run         # Preview without writing files
```

| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Content type: `skill`, `agent`, `hook`, `plugin`, `mcp`, `settings` |
| `-a, --agents <tools>` | Target AI tools: `claude`, `copilot`, `gemini`, `codex`, `opencode`, or `all` |
| `-s, --scope <scope>` | Installation scope: `project`, `user`, or `local` |
| `-m, --method <method>` | Installation method: `symlink` or `copy` |
| `-y, --yes` | Skip confirmation prompts |
| `-f, --force` | Overwrite existing files |
| `-n, --dry-run` | Preview changes without writing files |

### `list` (alias: `ls`)

List available content from the registry, or show what's installed locally.

```bash
npx @toolr/seedr list                             # List all available content
npx @toolr/seedr list -t plugin                   # Filter by content type
npx @toolr/seedr list -i                          # Show installed items only
npx @toolr/seedr list -i --scope user             # Show user-scoped installations
```

| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Filter by type: `skill`, `agent`, `hook`, `plugin`, `mcp`, `settings` |
| `-i, --installed` | Show only installed items |
| `--scope <scope>` | Scope for installed check: `project` or `user` (default: `project`) |

### `remove <name>` (alias: `rm`)

Remove an installed item. Requires `--type` to identify what to remove. Auto-detects which AI tools have it installed unless `--agents` is specified.

```bash
npx @toolr/seedr remove lint-doctor -t skill       # Remove a skill
npx @toolr/seedr rm pdf -t skill -a claude          # Remove from Claude only
npx @toolr/seedr remove superpowers -t plugin -y    # Skip confirmation
```

| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Content type (required): `skill`, `agent`, `hook`, `plugin`, `mcp`, `settings` |
| `-a, --agents <tools>` | Remove from specific AI tools only (default: auto-detect) |
| `--scope <scope>` | Installation scope: `project`, `user`, or `global` (default: `project`) |
| `-y, --yes` | Skip confirmation prompts |

### `init`

Create AI tool configuration directories in the current project. Useful for setting up a project before installing content.

```bash
npx @toolr/seedr init                             # Initialize for Claude (default)
npx @toolr/seedr init -a all                      # Initialize for all AI tools
npx @toolr/seedr init -a copilot,gemini           # Initialize for specific tools
```

| Option | Description |
|--------|-------------|
| `-a, --agents <tools>` | AI tools to initialize (default: `claude`) |
| `-y, --yes` | Skip confirmation prompts |

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run dev servers (CLI watch + web)
pnpm dev

# Test CLI locally
cd packages/cli && tsx src/cli.ts --help
```

## Testing

```bash
# Run unit tests
pnpm --filter @toolr/seedr test

# Run tests with coverage
pnpm --filter @toolr/seedr test:coverage

# Dry-run an installation (no files written)
cd packages/cli && npx tsx src/cli.ts add code-smell-doctor -a all --scope project --dry-run -y
```

See [docs/manual-tests/dry-run-commands.md](docs/manual-tests/dry-run-commands.md) for comprehensive manual testing commands.

## Self-Hosting

Run your own private seedr instance. See the [Self-Hosting Guide](docs/self-hosting.md) for step-by-step instructions.

## Playgrounds

Interactive HTML playgrounds that visualize seedr's architecture and behavior.

**Live:** [seedr.toolr.dev/playgrounds/](https://seedr.toolr.dev/playgrounds/)

| Playground | What it shows |
|------------|---------------|
| [CLI Explorer](https://seedr.toolr.dev/playgrounds/cli-explorer.html) | Build `npx seedr` commands interactively, see terminal output and file effects |
| [Installation Paths](https://seedr.toolr.dev/playgrounds/install-paths.html) | Where files land for every tool/type/scope/method combination |
| [Registry Architecture](https://seedr.toolr.dev/playgrounds/registry-architecture.html) | The 3-level split manifest system and data flow |
| [Compatibility Matrix](https://seedr.toolr.dev/playgrounds/compatibility-matrix.html) | Which content types work with which AI tools |

