---
name: ui-consumer
description: |
  How to correctly use @toolr/ui-design components, tokens, and patterns in consuming applications.
  Use this skill whenever working on files that import from `@toolr/ui-design`, building UI features
  in apps like configr/reviewr/seedr/toolr, or when the user mentions using design system components,
  form controls, icons, modals, tooltips, or any @toolr/ui-design exports. Also trigger when setting
  up a new app to use the design system, or when debugging styling issues that might relate to missing
  tokens or incorrect imports.
---

# Using @toolr/ui-design in Applications

This skill covers how to correctly import and use the `@toolr/ui-design` package in consuming apps. It is not about building the design system itself — that's the `ui-playground` skill.

## Setup

A consuming app needs three things:

```jsonc
// package.json — path is relative to the app
{ "@toolr/ui-design": "file:../../shared/ui-design" }
```

```css
/* app CSS entry point — loads semantic tokens and keyframes */
@import "@toolr/ui-design/tokens";
```

```ts
// tailwind.config.ts — adds Inter font and extended breakpoints
import { toolrPreset } from '@toolr/ui-design/preset'
export default { presets: [toolrPreset] }
```

Peer dependencies: `react` ^18 || ^19, `react-dom` ^18 || ^19.

## Imports

Always import from the barrel export — the package ships raw TypeScript and all public API goes through `index.ts`:

```tsx
import { IconButton, Input, Select, cn, type FormColor } from '@toolr/ui-design'
```

Never use deep paths like `@toolr/ui-design/components/ui/input`. The only sub-path exports are:

| Path | Use |
|------|-----|
| `@toolr/ui-design/tokens` | CSS import for design tokens |
| `@toolr/ui-design/preset` | Tailwind preset (`toolrPreset`) |
| `@toolr/ui-design/content` | Info panel primitives |
| `@toolr/ui-design/diagrams` | Diagram utilities |

## FormColor — Unified Accent System

Most form controls accept a `color` prop typed as `FormColor`:

```ts
type FormColor = 'blue' | 'green' | 'red' | 'orange' | 'cyan' | 'yellow'
  | 'purple' | 'indigo' | 'emerald' | 'amber' | 'violet' | 'gray' | 'sky'
```

Each color provides a consistent set of border/hover/focus/selected/accent classes through `FORM_COLORS`:

```ts
import { FORM_COLORS, type FormColor } from '@toolr/ui-design'

const config = FORM_COLORS['blue']
// config.border    → 'border-blue-500/30'
// config.hover     → 'hover:bg-blue-500/20 hover:border-blue-500/40'
// config.focus     → 'focus:border-blue-500'
// config.selectedBg → 'bg-blue-600/20'
// config.accent    → 'text-blue-400'
```

Use `FORM_COLORS` when building custom UI that needs to match the design system's accent treatment. For standard components, just pass the `color` prop.

## cn() — Class Composition

Always use `cn()` for combining Tailwind classes. It uses `clsx` + `tailwind-merge` so conflicting classes resolve correctly:

```tsx
import { cn } from '@toolr/ui-design'

<div className={cn('p-4 bg-surface', isActive && 'bg-blue-500/20', className)} />
```

Never string-concatenate classes — `tailwind-merge` handles conflicts like `'bg-red-500 bg-blue-500'` correctly.

## Component Prop Conventions

Components follow consistent patterns:

| Prop | Type | Purpose |
|------|------|---------|
| `size` | `'xss' \| 'xs' \| 'sm' \| 'md' \| 'lg'` | Sizing (not all sizes on every component) |
| `color` | `FormColor` | Accent color for form controls |
| `variant` | `'filled' \| 'outline'` | Visual style |
| `disabled` | `boolean` | Disables interaction |
| `className` | `string` | Extend styling via `cn()` |
| `testId` | `string` | E2E test selector (kebab-case) |

`onChange` handlers receive the **new value directly**, never a React event:

```tsx
<Input value={name} onChange={(val) => setName(val)} />
<Select value={color} onChange={(val) => setColor(val)} options={options} />
<Checkbox checked={agreed} onChange={(val) => setAgreed(val)} />
```

## Icons

Icons are accessed by string name via `IconName`, not by importing lucide-react directly:

```tsx
<IconButton icon="search" tooltip={{ description: 'Search items' }} onClick={handleSearch} />
<IconButton icon="trash" color="red" tooltip={{ description: 'Delete' }} onClick={handleDelete} />
```

`IconButton` has these additional features:
- **status**: `'loading' | 'success' | 'warning' | 'error'` — overrides the icon with an animated indicator
- **badge**: `number` — shows a count badge (displays "99+" for values > 99)
- **href**: `string` — renders as an external link (opens new tab)
- **strikethrough**: `boolean` — visual disabled/off state
- **tooltip**: `TooltipContent` — portal-based tooltip (see below)

For custom icons (not in iconMap), pass a `ReactNode` as the `icon` prop.

## Tooltips

Tooltip content is always an object, never a plain string:

```tsx
interface TooltipContent {
  title?: string                    // bold heading line
  description: string | ReactNode  // main content (required)
  extra?: string                   // additional info line
}
```

```tsx
// Standalone tooltip wrapper
<Tooltip content={{ description: 'Saves the current document' }}>
  <button>Save</button>
</Tooltip>

// On IconButton (most common usage)
<IconButton icon="save" tooltip={{ title: 'Save', description: 'Save current changes' }} />
```

Tooltips render in a portal — they escape overflow:hidden containers automatically. Never use inline `group-hover` patterns as a substitute.

## Modals

Three modal variants for different needs:

```tsx
// Action confirmation with confirm/cancel
<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete item"
  kind="warning"           // 'info' | 'warning' | 'error' | 'success'
  size="md"                // 'sm' | 'md' | 'lg' | 'xl'
  confirmLabel="Delete"
  loading={isDeleting}
>
  This action cannot be undone.
</ConfirmModal>

// Dismiss-only alert
<AlertModal isOpen={showAlert} onClose={() => setShowAlert(false)} title="Done" kind="success">
  Operation completed.
</AlertModal>
```

Modals render via `createPortal` to `document.body` — don't expect parent `overflow:hidden` or `z-index` to affect them.

## Select (Portal Dropdown)

Select renders its dropdown in a portal, so it works inside panels and modals without clipping:

```tsx
<Select
  value={selectedTool}
  onChange={setSelectedTool}
  options={[
    { value: 'claude', label: 'Claude' },
    { value: 'gemini', label: 'Gemini', icon: <GeminiIcon /> },
  ]}
  color="blue"
  size="sm"
  align="left"  // 'left' | 'right' — dropdown alignment
/>
```

Options use `SelectOption<T>` with `value`, `label`, and optional `icon`.

## Section Components

Sections are feature-complete panels that handle their own complex state. They pair with companion hooks:

```tsx
import { TabbedPromptEditor, usePromptEditor } from '@toolr/ui-design'

// Hook manages state: active tab, dirty detection, save, variable search
const editor = usePromptEditor({
  prompts: savedPrompts,
  onPromptChange: handleSave,
  tools: toolTabs,
  variables: templateVars,
})

// Component renders the full editor UI
<TabbedPromptEditor {...editor} standalone className="h-[600px]" />
```

Hook pattern:
- `UseXxxOptions` — configuration input
- `UseXxxReturn` — state + methods (spread directly onto the component)
- `standalone` prop — adds border and rounding for independent use
- `className` — for layout sizing

Available sections: `TabbedPromptEditor`, `RegistryBrowser`, `RegistryDetail`, `GoldenSyncPanel`, `SnapshotBrowserPanel`, `SnippetsEditor`, `ReportBugForm`, `ToolsPathsPanel`, `CapturedIssuesPanel`.

## AccentColor (Sections)

Some section components use `AccentColor` instead of `FormColor` — it's a separate type with different values for visual variety in complex panels:

```ts
type AccentColor = 'blue' | 'purple' | 'orange' | 'green' | 'pink' | 'amber' | 'emerald' | 'teal' | 'sky'
```

Used by `FileStructureSection` and other section-level components for icons, selected states, and decorative accents.

## Design Tokens

The token system uses CSS custom properties with semantic naming. These are available after importing `@toolr/ui-design/tokens`:

| Token | Purpose |
|-------|---------|
| `--background`, `--foreground` | Page-level |
| `--surface`, `--surface-secondary`, `--surface-overlay` | Cards, panels, popups |
| `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-emphasis` | Text hierarchy |
| `--border`, `--border-subtle` | Borders |
| `--primary`, `--destructive` | Interactive colors |
| `--muted`, `--muted-foreground` | Disabled/subdued |
| `--ring` | Focus indicator |

Use semantic tokens for layout and chrome. Accent colors (blue-500, red-400, etc.) stay as Tailwind classes — the token system handles the neutral palette, not accents.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Deep imports (`@toolr/ui-design/components/ui/input`) | Import from `@toolr/ui-design` |
| Missing token import (components look unstyled) | Add `@import "@toolr/ui-design/tokens"` to app CSS |
| Plain string tooltip (`tooltip="Save"`) | Use object: `tooltip={{ description: 'Save' }}` |
| Raw lucide-react imports for IconButton | Use string name: `icon="save"` |
| String-concatenating classes | Use `cn()` from `@toolr/ui-design` |
| Wrapping Select/Modal in overflow:hidden | They use portals — clipping doesn't apply |
| Missing tailwind preset | Breakpoints (3xl, 4xl) and Inter font won't work |
| Passing event to onChange | onChange receives the value directly, not an event |
