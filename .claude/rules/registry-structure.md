---
paths:
  - registry/**
  - .claude/skills/**
  - packages/cli/src/config/registry.ts
  - apps/web/src/lib/registry.ts
---

# Registry Structure

## Directory Layout

```
registry/                    # Published registry (fetched by CLI)
├── manifest.json            # Index of all available items
└── skills/<slug>/           # Skill source files
    ├── SKILL.md             # Main skill definition
    └── references/          # Supporting reference files

.claude/skills/              # Local skill definitions (dev)
├── lint-doctor/
├── claude-md-doctor/
└── ...
```

## Manifest Format

```json
{
  "version": "1.0.0",
  "skills": [
    {
      "name": "rust-skills",
      "description": "Rust development best practices",
      "version": "1.0.0",
      "author": "toolr",
      "compatibility": ["claude"],
      "path": "skills/rust-skills"
    }
  ],
  "agents": [],
  "hooks": [],
  "mcp": []
}
```

## Skill File Structure

Each skill directory contains:

| File | Required | Purpose |
|------|----------|---------|
| `SKILL.md` | Yes | Main skill definition |
| `references/*.md` | No | Supporting reference docs |
| `metadata.json` | No | Extended metadata |

## Registry Client

Both CLI and web use a shared registry client pattern:

```typescript
// Load manifest
const manifest = await fetchManifest()

// Get item by name
const skill = manifest.skills.find(s => s.name === name)

// Get item content
const content = await fetchItemContent(skill.path)
```

## Adding New Items

1. Create directory under appropriate category
2. Add main content file (CLAUDE.md for skills)
3. Update manifest.json with entry
4. (Optional) Add metadata.json for extended info

## Development vs Production

- **Dev**: Skills in `.claude/skills/` for local testing
- **Prod**: Skills published to `registry/` and fetched from GitHub raw
- **Loading**: CLI tries local path first, falls back to GitHub
