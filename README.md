# seedr

Seed your projects with AI configurations. Part of the [toolr-suite](https://toolr.dev) ecosystem.

## What is seedr?

seedr is a CLI tool and registry for AI coding assistant configurations. Install curated skills, hooks, and agents for Claude Code, GitHub Copilot, Gemini, Codex, and OpenCode with a single command.

## Installation

```bash
# Install a skill interactively
npx seedr add

# Install a specific skill
npx seedr add lint-doctor

# Install for all compatible AI tools
npx seedr add design-patterns --agents all

# List available skills
npx seedr list
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `claude-md-doctor` | Diagnose and improve CLAUDE.md files and .claude/rules/ |
| `lint-doctor` | Diagnose and fix linting issues across multiple languages |
| `code-smell-doctor` | Detect and refactor code smells using Martin Fowler's catalog |
| `design-patterns` | Apply Gang of Four design patterns effectively |
| `refactoring-techniques` | Systematic refactoring using proven techniques |

Browse all skills at [seedr.toolr.dev](https://seedr.toolr.dev)

## CLI Commands

```bash
seedr add [name]              # Install a skill
  -a, --agents <tools>        # Target AI tools (claude,copilot,gemini,codex,opencode) or "all"
  --scope <scope>             # Installation scope: project, user, or global
  -m, --method <method>       # Installation method: symlink or copy
  -y, --yes                   # Skip confirmation prompts

seedr list                    # List available skills
  -i, --installed             # Show only installed skills

seedr remove <name>           # Remove an installed skill

seedr init                    # Initialize AI tool config directories
```

## Supported AI Tools

| Tool | Project Path | User Path |
|------|--------------|-----------|
| Claude Code | `.claude/commands/` | `~/.claude/commands/` |
| GitHub Copilot | `.github/copilot-instructions/` | - |
| Gemini Code Assist | `.gemini/` | - |
| OpenAI Codex | `.codex/` | - |
| OpenCode | `.opencode/agents/` | - |

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

## License

MIT - see [LICENSE](LICENSE)

---

Made by [twiceD Technology GmbH](https://twiced.de)
