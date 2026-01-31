# seedr

Seed your projects with AI configurations. Part of the [toolr-suite](https://toolr.dev) ecosystem.

## What is seedr?

seedr is a CLI tool and registry for AI coding assistant content. Install curated skills, agents, hooks, plugins, MCP servers, and settings for Claude Code, GitHub Copilot, Gemini, Codex, and OpenCode with a single command.

## Installation

```bash
# Install content interactively
npx @toolr/seedr add

# Install a specific item
npx @toolr/seedr add lint-doctor

# Install a specific content type
npx @toolr/seedr add github-mcp -t mcp

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

```bash
npx @toolr/seedr add [name]       # Install content
  -t, --type <type>               # Content type (skill,agent,hook,plugin,mcp,settings)
  -a, --agents <tools>            # Target AI tools (claude,copilot,gemini,codex,opencode) or "all"
  --scope <scope>                 # Installation scope: project, user, or local
  -m, --method <method>           # Installation method: symlink or copy
  -y, --yes                       # Skip confirmation prompts
  --dry-run                       # Preview changes without writing files

npx @toolr/seedr list             # List available content
  -t, --type <type>               # Filter by content type
  -i, --installed                 # Show only installed content

npx @toolr/seedr remove <name>    # Remove installed content

npx @toolr/seedr init             # Initialize AI tool config directories
```

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

## License

MIT - see [LICENSE](LICENSE)

---

Made by [twiceD Technology GmbH](https://twiced.de)
