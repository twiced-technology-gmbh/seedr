---
name: ui-consumer
description: |
  How to correctly use @toolr/ui-design components, tokens, and patterns in consuming applications.
  Use this skill whenever working on files that import from `@toolr/ui-design`, building UI features
  in apps like configr/reviewr/seedr/toolr-app, or when the user mentions using design system components,
  form controls, icons, modals, tooltips, or any @toolr/ui-design exports. Also trigger when setting
  up a new app to use the design system, or when debugging styling issues that might relate to missing
  tokens or incorrect imports.
  ALWAYS trigger when: creating/editing .tsx files that involve UI (features/, core/, components/),
  adding UI elements, building forms, adding buttons, creating layouts, or any task involving visual
  components in a toolr consumer app.
  NEVER use native HTML form elements (<button>, <input>, <select>, <textarea>) — always check
  the manifest for a design system replacement first.
---

# Using @toolr/ui-design in Applications

This skill covers how to correctly use `@toolr/ui-design` in consuming apps. It is not about building the design system itself — that's the `ui-playground` skill.

## Dynamic Data Sources

The design system publishes two machine-readable files that are the single source of truth. Read them when you need component details, enforcement rules, or agent guidelines:

| File | Import Path | Contains |
|------|-------------|----------|
| `ai-manifest.json` | `@toolr/ui-design/manifest` | All components (grouped by category), conventions, types, hooks, utilities, enforcement rules |
| `agent-rules.json` | `@toolr/ui-design/agent-rules` | Do/don't rules organized by category (Setup, Typography, Components, Styling, Portals, State & Data, Code Hygiene) |

To find these files locally, look for `node_modules/@toolr/ui-design/ai-manifest.json` or follow the `file:` dependency path in `package.json`.

When you need to pick the right component for a task, read `ai-manifest.json` — the `components` section is organized by category (`form`, `action`, `display`, `layout`, `navigation`, `modal`, `section`, `settings`, `brand`) with descriptions, key props, and which HTML elements each component replaces.

## Setup

A consuming app needs these things configured:

```jsonc
// package.json — path varies by app location
{ "@toolr/ui-design": "file:../../shared/ui-design" }
```

```css
/* app CSS entry point — loads semantic tokens and keyframes */
@import "@toolr/ui-design/tokens";
```

```css
/* Critical: portals render at document.body with semi-transparent backgrounds */
body { background-color: var(--background); }
```

**Tailwind v4 type scale fix** — `@import "tailwindcss"` shadows ui-design's type scale tokens with Tailwind defaults, and `text-xss` doesn't exist in Tailwind at all (falls back to browser default 16px). Re-register them in the app's `@theme` block:

```css
@theme {
  --text-xss: 10px;
  --text-xss--line-height: 1;
  --text-xs: 11px;
  --text-xs--line-height: 1.2;
  --text-sm: 12px;
  --text-sm--line-height: 1.33;
}
```

```ts
// tailwind.config.ts (if using Tailwind config file)
import { toolrPreset } from '@toolr/ui-design/preset'
export default { presets: [toolrPreset] }
```

Peer dependencies: `react` ^18 || ^19, `react-dom` ^18 || ^19.

## Imports

Always import from the barrel — never deep paths:

```tsx
import { IconButton, Input, Select, cn, type FormColor } from '@toolr/ui-design'
```

Valid sub-path exports:

| Path | Use |
|------|-----|
| `@toolr/ui-design` | All components, hooks, utilities, types |
| `@toolr/ui-design/tokens` | CSS import for design tokens |
| `@toolr/ui-design/preset` | Tailwind preset (breakpoints, Inter font) |
| `@toolr/ui-design/content` | Info panel primitives |
| `@toolr/ui-design/diagrams` | Diagram utilities |
| `@toolr/ui-design/manifest` | AI manifest JSON (for tooling, not app code) |
| `@toolr/ui-design/agent-rules` | Agent rules JSON (for tooling, not app code) |

Deep imports like `@toolr/ui-design/components/ui/input` are banned and enforced by the ESLint plugin.

## Core Conventions

These are the patterns agents get wrong most often. For the full list, read the `conventions` section in `ai-manifest.json`.

### onChange receives values, not events

```tsx
<Input value={name} onChange={(val) => setName(val)} />
<Select value={color} onChange={(val) => setColor(val)} options={opts} />
<Checkbox checked={agreed} onChange={(val) => setAgreed(val)} />
```

Every form component follows this pattern. Never destructure `e.target.value`.

### cn() for all class composition

```tsx
import { cn } from '@toolr/ui-design'
<div className={cn('p-4 bg-surface', isActive && 'bg-blue-500/20', className)} />
```

Never string-concatenate or use template literals for Tailwind classes. `cn()` uses `clsx` + `tailwind-merge` so conflicting classes resolve correctly.

### Icons are string names

```tsx
<IconButton icon="search" tooltip={{ description: 'Search' }} onClick={handleSearch} />
<IconButton icon="trash" color="red" tooltip={{ description: 'Delete' }} onClick={handleDelete} />
```

Do NOT import from `lucide-react`. Use the `iconMap` export to check available names. For custom icons not in the map, pass a `ReactNode`.

### Tooltips are always objects

```tsx
// Standalone
<Tooltip content={{ description: 'Saves the document' }}>
  <button>Save</button>
</Tooltip>

// On IconButton (most common)
<IconButton icon="save" tooltip={{ title: 'Save', description: 'Save current changes' }} />
```

`TooltipContent`: `{ title?: string, description: string | ReactNode, extra?: string }`

Never pass a plain string as a tooltip.

### Portal components

`Modal`, `Tooltip`, `Select`, `FilterDropdown` render to `document.body`. Don't rely on parent `overflow`, `z-index`, or `position` to affect them. Never use CSS `group-hover` patterns as a tooltip substitute.

### Modals replace browser dialogs

```tsx
<ConfirmModal
  isOpen={show} onClose={close} onConfirm={handleDelete}
  title="Delete item" kind="warning" confirmLabel="Delete" loading={isDeleting}
>
  This action cannot be undone.
</ConfirmModal>

<AlertModal isOpen={show} onClose={close} title="Done" kind="success">
  Operation completed.
</AlertModal>
```

Never use `window.alert()`, `window.confirm()`, or `window.prompt()`. The ESLint plugin enforces this.

## FormColor — Unified Accent System

Most form controls accept a `color` prop typed as `FormColor` — 13 colors shared across components. `Label`, `Checkbox`, and `Toggle` add `pink` and `teal` (15 colors total).

For custom styling matching design system accents, use `FORM_COLORS`:

```tsx
import { FORM_COLORS } from '@toolr/ui-design'
const { border, hover, focus, selectedBg, accent } = FORM_COLORS['blue']
```

## Picking Components

Before reaching for HTML elements, check if a design system component exists. The `enforcement.htmlReplacements` section of the manifest maps HTML elements to their design system replacements — the ESLint plugin enforces these.

For choosing between similar components (e.g., `Select` vs `FilterDropdown` vs `SortDropdown`), read the component descriptions in `ai-manifest.json`. Each entry includes `description`, `keyProps`, and `replaces` to help you pick the right one.

### Section components

Sections are feature-complete panels that manage complex state via companion hooks:

```tsx
import { TabbedPromptEditor, usePromptEditor } from '@toolr/ui-design'

const editor = usePromptEditor({
  prompts: savedPrompts,
  onPromptChange: handleSave,
  tools: toolTabs,
  variables: templateVars,
})

<TabbedPromptEditor {...editor} standalone className="h-[600px]" />
```

Pattern: `UseXxxOptions` (config input) → `useXxx()` hook → spread return onto component. Add `standalone` for independent use with border/rounding.

## Design Tokens

After importing `@toolr/ui-design/tokens`, semantic CSS custom properties are available:

| Category | Tokens |
|----------|--------|
| Page | `--background`, `--foreground` |
| Surfaces | `--surface`, `--surface-secondary`, `--surface-overlay` |
| Text | `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-emphasis` |
| Borders | `--border`, `--border-subtle` |
| Interactive | `--primary`, `--destructive`, `--ring` |

Use semantic tokens for layout chrome. Accent colors stay as Tailwind classes (e.g., `text-blue-400`, `bg-green-500/20`). Never hardcode hex values.

## Typography & Spacing

| Scale | Size | Tailwind | Usage |
|-------|------|----------|-------|
| Tiny | 10px | `text-xss` | Fine print (needs `@theme` override, see Setup) |
| Small | 11px | `text-xs` | **Dominant** — labels, badges, most text (needs `@theme` override) |
| Body | 12px | `text-sm` | Body text, descriptions (needs `@theme` override) |
| Heading | 18px | `text-lg` | Section headers (rare) |

| Weight | Value | Tailwind | Usage |
|--------|-------|----------|-------|
| Default | 500 | `font-medium` | **Dominant** — most text |
| Emphasis | 600 | `font-semibold` | Important text |

| Spacing | Size | Tailwind | Usage |
|---------|------|----------|-------|
| Tight | 4px | `gap-1` / `p-1` | Compact elements |
| Normal | 8px | `gap-2` / `p-2` | **Dominant** — standard spacing |
| Moderate | 12px | `gap-3` / `p-3` | Between groups |
| Section | 16px | `gap-4` / `p-4` | Between sections |

## Enforcement

The design system ships an ESLint plugin (`eslint-plugin-toolr-design`) that reads enforcement rules from `ai-manifest.json` at runtime:

- **prefer-design-components** — flags HTML elements that have design system replacements
- **no-deep-imports** — flags imports from paths other than the allowed sub-path exports
- **no-direct-icon-imports** — flags `lucide-react` imports (use `IconButton` with string names)
- **no-browser-dialogs** — flags `window.alert`, `window.confirm`, `window.prompt`

Some apps also run a PostToolUse hook that lints after every file edit, giving immediate feedback.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `<button>`, `<input>`, `<select>`, `<textarea>` | Use design system component (see manifest `replaces` field) |
| Deep import (`@toolr/ui-design/components/ui/input`) | Import from `@toolr/ui-design` |
| `import { X } from 'lucide-react'` | Use string name: `icon="x"` |
| Plain string tooltip (`tooltip="Save"`) | Object: `tooltip={{ description: 'Save' }}` |
| String-concat classes | Use `cn()` |
| `group-hover` tooltip pattern | Use `Tooltip` component (portal-based) |
| onChange expecting event | onChange receives value directly |
| Missing `@import "@toolr/ui-design/tokens"` | Components look unstyled without it |
| Missing `body { background-color }` | Portal backgrounds bleed through as gray |
| `window.alert()` or `window.confirm()` | Use `AlertModal` or `ConfirmModal` |
| Returning `[]` from Zustand selectors | Use module-level `EMPTY_*_ARRAY` constants |
| `transition-all` | Specify the property: `transition-colors`, `transition-transform` |
| `shadow-sm` / `shadow-md` | Only `shadow-xl` (dropdowns) or `shadow-2xl` (modals) |
| `text-xss` renders as 16px | Missing `@theme` type scale overrides — Tailwind shadows ui-design tokens |
