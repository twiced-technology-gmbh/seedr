---
name: ui-design-setup
description: |
  Set up and enforce @toolr/ui-design design system compliance in a consuming application.
  Creates custom ESLint rules that catch design system violations (raw spacing, raw colors,
  arbitrary text sizes, raw HTML form elements, deep imports, direct lucide-react imports,
  browser dialogs), wires them into the app's ESLint config, sets up a Claude Code PostToolUse
  hook for real-time feedback, and optionally adds pre-commit hooks via lint-staged.

  Use this skill when:
  - The user asks to "set up design system enforcement", "add design system linting",
    "enforce the design system", "set up ui-design checks", or "onboard to ui-design"
  - A new toolr app needs to be set up with @toolr/ui-design compliance
  - The user wants to add pre-commit hooks or CI gates for design system rules
  - The user asks to audit or check design system compliance in their app
  - The user mentions "design system lint", "token enforcement", or "styling rules"
  - Even if the user just says "set up linting for design" or "make sure we follow the design system"
---

# UI Design System Setup & Enforcement

This skill sets up automated enforcement of the `@toolr/ui-design` design system in a consuming application. It creates custom ESLint rules, wires them into the existing config, and optionally adds pre-commit hooks.

## When to use

Run this skill in a **consumer app** directory (toolr-app, seedr, configr, etc.) — not in the ui-design package itself.

## Workflow

### Step 1: Audit the current app

Read these files to understand the current state:

1. `package.json` — check for `@toolr/ui-design` dependency, existing lint scripts, lint-staged, husky
2. `eslint.config.js` (or `.mjs`/`.ts`) — understand the existing ESLint setup
3. Check for `.githooks/` or `.husky/` directories
4. Check if `eslint-plugin-toolr-design.js` already exists
5. Verify `@toolr/ui-design/manifest` resolves (the ESLint plugin reads `ai-manifest.json` at runtime for enforcement data)

6. Check if the app's `@theme` block re-registers ui-design's type scale tokens (see "Tailwind v4 type scale fix" below)
7. Audit CSS token aliases (see "CSS token alias audit" below)

Report what's already in place:

```
Design System Enforcement Audit
================================
@toolr/ui-design dependency:  [present / missing]
Token CSS import:              [present / missing]  (check main CSS for @import "@toolr/ui-design/tokens")
Manifest resolvable:           [yes / no]  (try: node -e "require('@toolr/ui-design/manifest')")
ESLint config:                 [flat config / legacy / missing]
Design system ESLint plugin:   [present / missing]
Pre-commit hooks:              [husky / .githooks / none]
lint-staged:                   [configured / not configured]
```

If `@toolr/ui-design` is not in dependencies, stop and tell the user to add it first. Point them to the `ui-consumer` skill for setup instructions.

### Tailwind v4 type scale fix

When a consuming app uses `@import "tailwindcss"`, Tailwind's default `--text-xs`, `--text-sm` etc. shadow the ui-design token values. The custom `--text-xss` token doesn't exist in Tailwind's defaults at all, so `text-xss` falls back to the browser default 16px.

The fix is to re-register ui-design's type scale in the app's `@theme` block:

```css
@theme {
  /* Type scale overrides from ui-design (Tailwind defaults shadow these) */
  --text-xss: 10px;
  --text-xss--line-height: 1;
  --text-xs: 11px;
  --text-xs--line-height: 1.2;
  --text-sm: 12px;
  --text-sm--line-height: 1.33;
}
```

Check for this during the audit. If the app's main CSS has a `@theme` block without these overrides, add them. Without this fix, all `text-xss`, `text-xs`, and `text-sm` classes render at wrong sizes.

### CSS token alias audit

Consumer apps often define their own CSS variables that alias ui-design semantic tokens (e.g., `--color-active: var(--surface-hover)`). These aliases can drift or be set incorrectly, causing subtle visual bugs that are hard to spot.

During the audit, scan the app's CSS files for custom variables that reference ui-design tokens and check for these common problems:

**Surface hierarchy must go lighter as you go up:**
```
--background (#000) < --surface (#0a0a0a) < --surface-hover (#2e2e2e) < --surface-overlay (#1a1a1a)
```

- Hover/active state aliases should point to `--surface-hover` (lighter than the card), not `--surface-secondary` (darker). Using a darker token for hover makes the effect invisible.
- If the app has `--color-active`, `--color-hover`, or similar aliases, verify they resolve to a token that's **lighter** than the surface they sit on.

**Other things to check:**
- Aliases referencing tokens that don't exist in ui-design (typos, renamed tokens)
- Aliases using raw hex values instead of ui-design token references (defeats the purpose of the token system)
- `body { background-color }` must be set to `var(--background)` — without this, portal components (Select, Tooltip, Modal) render with white bleed-through

Report any issues found and fix them.

### Step 2: Create the ESLint plugin

Read the plugin template from `references/eslint-plugin-toolr-design.js` in this skill's directory:

```
<skill-directory>/references/eslint-plugin-toolr-design.js
```

Copy this file to the app root as `eslint-plugin-toolr-design.js`.

The plugin reads enforcement data from `ai-manifest.json` (via `@toolr/ui-design/manifest`) at startup. This means adding new components, import paths, or banned globals to the manifest automatically updates what the linter enforces — no need to edit the plugin file. Four rules are manifest-driven: `prefer-design-components`, `no-deep-imports`, `no-direct-icon-imports`, and `no-browser-dialogs`. The remaining three (spacing, colors, text-size) use pattern-based regex matching.

The plugin provides seven rules:

| Rule | Severity | What it catches |
|------|----------|-----------------|
| `no-raw-spacing` | warn | Spacing values outside the 4px grid (`mt-7`, `px-9`, `gap-12`) |
| `no-raw-colors` | warn | Hex colors, rgb/hsl in classNames and styles, arbitrary Tailwind colors (`bg-[#1f2937]`) |
| `no-raw-text-size` | warn | Arbitrary text sizing (`text-[14px]`, `text-[44px]`) |
| `prefer-design-components` | warn | Raw HTML elements (`<button>`, `<input>`, `<select>`, `<textarea>`) instead of ui-design components |
| `no-deep-imports` | error | Deep imports from `@toolr/ui-design/components/...` |
| `no-direct-icon-imports` | warn | Direct `lucide-react` imports instead of IconButton icon="name" |
| `no-browser-dialogs` | warn | `window.alert/confirm/prompt` instead of AlertModal/ConfirmModal |

All rules respect `// toolr-design-ignore-next-line` comments for rare exceptions.

### Step 3: Wire into ESLint config

Read the app's existing `eslint.config.js` first. Then add the design system plugin block.

The integration depends on the config style. Read `references/eslint-integration.md` for examples of both styles used in toolr apps.

Add a new config block — do not modify existing rule blocks. The block should:
- Target `**/*.{ts,tsx}` files
- Import the local plugin file
- Enable all seven rules

### Step 4: Verify scripts

After step 3, the design system rules are part of the standard ESLint config. The existing `lint` script already runs them — no new scripts needed.

Verify by running the app's lint command (e.g. `npm run lint` or `pnpm lint`) and confirming the `toolr-design/*` rules appear in the output.

### Step 5: Pre-commit hooks (ask the user)

Ask the user:

```
Would you like to set up pre-commit hooks to enforce design system rules on staged files?

1. Yes — add lint-staged + husky (or integrate with existing .githooks)
2. No — just the ESLint rules for now
```

If yes, read `references/pre-commit-setup.md` for the setup instructions.

**For apps with existing `.githooks/`** (like seedr):
Add the lint check to the existing pre-commit hook.

**For apps without hooks** (like toolr-app):
Set up husky + lint-staged.

### Step 6: Set up Claude Code PostToolUse hook

Create `.claude/scripts/check-ui-patterns.sh` in the app to give Claude real-time feedback when it writes or edits `.tsx` files. This catches patterns that are harder to express as ESLint rules (template literal classNames, group-hover tooltips) and provides instant correction during coding.

Read the hook template from `references/check-ui-patterns.sh` in this skill's directory and copy it to `.claude/scripts/check-ui-patterns.sh`.

Then ensure `.claude/settings.json` has the PostToolUse hooks configured. If the file exists, merge the hooks. If not, create it:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [{ "type": "command", "command": "bash .claude/scripts/check-ui-patterns.sh \"$TOOL_INPUT_FILE_PATH\"" }]
      },
      {
        "matcher": "Edit",
        "hooks": [{ "type": "command", "command": "bash .claude/scripts/check-ui-patterns.sh \"$TOOL_INPUT_FILE_PATH\"" }]
      }
    ]
  }
}
```

### Step 7: Report

After setup, show a summary:

```
Design System Enforcement — Setup Complete
============================================

Created:
  - eslint-plugin-toolr-design.js (7 custom rules)
  - Updated eslint.config.js with design system rules
  - .claude/scripts/check-ui-patterns.sh (real-time Claude hook)
  - Updated .claude/settings.json with PostToolUse hooks

ESLint rules (run at lint/CI time):
  - toolr-design/no-raw-spacing            (warn)
  - toolr-design/no-raw-colors             (warn)
  - toolr-design/no-raw-text-size          (warn)
  - toolr-design/prefer-design-components  (warn)
  - toolr-design/no-deep-imports           (error)
  - toolr-design/no-direct-icon-imports    (warn)
  - toolr-design/no-browser-dialogs        (warn)

Claude hook (real-time feedback on Write/Edit):
  - Template literal classNames → use cn()
  - group-hover tooltip patterns → use Tooltip component

Run `npm run lint` to check current violations.

Suggested next steps:
  1. Run lint to see current violation count
  2. Fix critical violations (no-deep-imports errors)
  3. Gradually address warnings
  4. Add design system lint to CI pipeline
```

### CI Gate (suggestion only)

Suggest adding this to the app's CI workflow but don't create the file — CI config varies too much:

```yaml
# Add to your existing CI workflow
- name: Design system compliance
  run: npm run lint -- --max-warnings 0
```

## Exception handling

All rules support an escape hatch comment. Place it on the line before the violation:

```tsx
// toolr-design-ignore-next-line
<div className="mt-7 bg-[#custom]">Exception with reason in PR</div>
```

Exceptions should be rare and reviewed in PRs.
