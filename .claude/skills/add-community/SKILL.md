---
name: add-community
description: |
  Add a community GitHub repository to the seedr registry.
  Trigger on: "/add-community <github-url>", "add community repo", "register community plugin/skill".
  Accepts a GitHub repo URL, fetches metadata via GitHub API (plugin.json or SKILL.md),
  detects content type, builds a file tree, asks clarifying questions, and updates
  registry/manifest.json. No local file copy — uses externalUrl for install-time fetching.
---

# Add Community

Add a community GitHub repository to the seedr registry.

## Workflow

### 1. Parse the GitHub URL

Extract `owner/repo` from the URL. Accepted formats:
- `https://github.com/owner/repo`
- `https://github.com/owner/repo/tree/main/subpath` (for items nested in a repo)
- `owner/repo` (shorthand)

Normalize to `owner` and `repo` variables. If a subpath is present, store it as `basePath` (default: repo root).

### 2. Detect content type via GitHub API

Use `gh api` to inspect the repo. Check in this order:

**Plugin** (most common for full repos):
```bash
gh api repos/{owner}/{repo}/contents/.claude-plugin/plugin.json --jq '.content' | base64 -d
```
If `.claude-plugin/plugin.json` exists, this is a **plugin**. Parse the JSON for metadata.

**Skill** (for single-skill repos or subpath pointing to a skill):
```bash
gh api repos/{owner}/{repo}/contents/{basePath}/SKILL.md --jq '.content' | base64 -d
```
If `SKILL.md` exists, this is a **skill**. Parse YAML frontmatter for name/description.

**Ambiguous**: If neither is found, ask the user with AskUserQuestion what type it is.

### 3. Extract metadata

**From plugin.json:**
```json
{
  "name": "...",
  "description": "...",
  "author": { "name": "...", "url": "..." }
}
```

**From SKILL.md frontmatter:**
```yaml
---
name: ...
description: ...
---
```

Derive `slug` from the repo name (kebab-cased). For subpath items, use the last path segment.

### 4. Build file tree

Fetch the repo's directory structure via GitHub API:
```bash
gh api repos/{owner}/{repo}/contents/{basePath} --jq '.[].name'
```

Recursively build `FileTreeNode[]` (max depth 3 to avoid API rate limits). For each entry:
- If `type == "dir"`, recurse into it and add as `{ name, type: "directory", children: [...] }`
- If `type == "file"`, add as `{ name, type: "file" }`

For plugins, also parse the tree to populate `PluginContents`:
- `skills/` directory → list `.md` files as `contents.skills`
- `agents/` directory → list `.md` files as `contents.agents`
- `hooks/` directory → list as `contents.hooks`
- `commands/` directory → list `.md` files as `contents.commands`
- `mcp-servers/` or `mcp-configs/` → list as `contents.mcpServers`

### 5. Fetch last commit date

```bash
gh api repos/{owner}/{repo}/commits?per_page=1 --jq '.[0].commit.committer.date'
```

### 6. Ask clarifying questions

Use AskUserQuestion. Pre-fill from detected metadata.

**Batch 1 — Identity & compatibility:**

```
questions:
  - question: "Name for registry: '<auto-detected name>'?"
    header: "Name"
    options:
      - label: "<detected name> (Recommended)"
        description: "From plugin.json / SKILL.md"
      - label: "Custom name"
        description: "Enter your own name"

  - question: "Which AI tools is this compatible with?"
    header: "Compat"
    multiSelect: true
    options:
      - label: "All"
        description: "Compatible with claude, copilot, gemini, opencode, and codex"
      - label: "claude"
        description: "Anthropic Claude Code"
      - label: "copilot"
        description: "GitHub Copilot"
      - label: "gemini"
        description: "Google Gemini CLI"
      - label: "opencode"
        description: "OpenCode CLI"
      - label: "codex"
        description: "OpenAI Codex CLI"
```

Notes:
- If the user selects "All", expand to `["claude", "copilot", "gemini", "opencode", "codex"]` in the compatibility array.
- Plugins are generally Claude-only (`["claude"]`), since `.claude-plugin` is a Claude concept.
- Skills may be multi-tool compatible.
- Community items do NOT have targetScope (scope is only for Toolr items).

**Batch 2 — Description:**

Do NOT blindly use the description from plugin.json or SKILL.md frontmatter. Instead, read the actual content files (README.md, SKILL.md body, plugin skills/agents) to understand what the item *really* does, then write a comprehensive description following these rules:

**Description quality requirements:**

- **Length**: 1-2 concise sentences, 25-50 words
- **Lead with action**: Start with what the item *does*, not what it *is* (good: "Manage GitLab repositories, merge requests, and CI/CD pipelines directly from Claude Code" / bad: "GitLab DevOps platform integration")
- **Be specific**: Mention concrete capabilities, categories, or differentiators (good: "Includes a code-reviewer agent and slash commands for planning and execution" / bad: "Includes various development tools")
- **No title-restatements**: Never just restate the name (bad: "X plugin for Claude", "X integration")
- **No trigger instructions**: Don't include "Use when..." or "Trigger on..." — that belongs in skill frontmatter, not the registry description
- **Show value**: Explain why someone would want this, not just what it does mechanically
- **For well-known tools** (GitHub, Slack, Linear, etc.): Focus on what the integration *enables in-editor*, not what the tool itself is. Everyone knows what Slack is — describe what the integration lets you do
- **Mention key numbers**: If the item covers a specific count of rules, patterns, or agents, include it (e.g., "57 performance rules", "6 specialized review agents")

**Examples of good descriptions:**

- "Search Slack messages, read channels and threads, and pull team discussions into your coding context. Useful for finding prior decisions, debugging context, or relevant conversations without leaving Claude Code."
- "57 performance rules from Vercel Engineering for React and Next.js apps. Covers waterfall prevention, bundle size reduction, server/client optimization, re-render elimination, and JS performance patterns."
- "Security audit plugin from Trail of Bits that builds deep architectural context through ultra-granular function-level code analysis before vulnerability hunting. Includes a function-analyzer agent and completeness checklists."

**Examples of bad descriptions:**

- "Stripe development plugin for Claude" (title restatement, says nothing about capabilities)
- "Slack workspace integration" (just restates what everyone already knows)
- "Use when asked to review UI, check accessibility..." (trigger instruction, not description)

Then present the description to the user:

```
questions:
  - question: "Use this description? '<auto-generated description>'"
    header: "Description"
    options:
      - label: "Yes, use it (Recommended)"
        description: "Accept the auto-generated description"
      - label: "Edit it"
        description: "Provide your own"
```

### 7. Check for duplicates

Before adding, check if `registry/<type>s/<slug>/item.json` already exists.

If found, warn the user and ask: **Update existing** or **Abort**.

### 8. Write item.json and compile manifest

Create the directory and write `registry/<type>s/<slug>/item.json`:

```bash
mkdir -p registry/<type>s/<slug>
```

Item shape:

```json
{
  "slug": "<slug>",
  "name": "<confirmed name>",
  "type": "<detected type>",
  "description": "<confirmed description>",
  "compatibility": ["<from user>"],
  "sourceType": "community",
  "author": {
    "name": "<from plugin.json or repo owner>",
    "url": "<author url or github profile>"
  },
  "externalUrl": "https://github.com/{owner}/{repo}/tree/main/{basePath}",
  "updatedAt": "<last commit date ISO 8601>",
  "contents": {
    "skills": ["<skill names>"],
    "agents": ["<agent names>"],
    "hooks": ["<hook names>"],
    "commands": ["<command names>"],
    "mcpServers": ["<mcp names>"],
    "files": [<file tree>]
  }
}
```

Note: Community items do NOT include `targetScope` — that field is only for Toolr items.

Only include `contents` sub-fields that have items (omit empty arrays).

Write with `JSON.stringify(item, null, 2) + "\n"`.

Then recompile the manifest:
```bash
npx tsx scripts/compile-manifest.ts
```

### 9. Confirm

Print summary:
- Type, slug, name, author
- Number of skills, agents, hooks, etc. (for plugins)
- `externalUrl`
- Remind user to commit and push

## Important notes

- **No local file copy** — community items are metadata-only in the manifest. The CLI/web fetches content from `externalUrl` at install time.
- `sourceType` is `"community"`, same as Anthropic's synced community plugins. The sync script (`scripts/sync.ts`) preserves manually-added community items by checking slugs — if a community item's slug doesn't match any freshly synced item, it survives the sync.
- GitHub API rate limits: unauthenticated = 60 req/hr, authenticated (gh cli) = 5000 req/hr. Using `gh api` ensures authenticated access.
- For repos with many subdirectories, limit file tree depth to 3 levels to stay within reasonable API usage.
