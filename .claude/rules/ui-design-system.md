---
paths:
  - apps/web/src/**/*.tsx
  - apps/web/src/**/*.ts
  - apps/web/src/**/*.css
---

# @toolr/ui-design Rules

## Setup

- `body { background-color: var(--background); }` is required — portals render at document.body; without it, white bleeds through
- `@import "@toolr/ui-design/tokens"` in app CSS — all semantic tokens are undefined without it
- Import from barrel only (`@toolr/ui-design`), never deep paths

## Typography

- Minimum font size is 11px (`text-xss`), never go below
- `text-neutral-300` is primary text, NOT white — white is for emphasis only
- `font-medium` (500) is the default weight, not semibold or normal

## Components

- Every `IconButton` must have `tooltip` prop as object: `tooltip={{ description: "..." }}`, not a plain string
- `onChange` delivers the value directly, never a React event: `onChange={setName}` not `onChange={(e) => setName(e.target.value)}`
- Icons are string names: `icon="search"`, not Lucide components
- `FilterDropdown` for filtering, `SortDropdown` for sorting — separate components
- `ConfirmModal` for actions (confirm/cancel), `AlertModal` for info (dismiss only)
- Use `cn()` for class composition, never string concatenation

## Styling

- Use semantic tokens for structure, Tailwind utilities for accent colors
- Never hardcode hex values for accents
- Never use `transition-all` — specify property (`transition-colors`, `transition-transform`)
- Only `shadow-xl` for dropdowns/tooltips, `shadow-2xl` for modals — never `shadow-sm`/`shadow-md`
- Never use `rounded-full` except for toggle knobs, checkmarks, avatars
- Never use CSS `group-hover` for tooltips — use portal-based Tooltip component

## Portals

- `Select`, `Tooltip`, `Modal` render via `createPortal` to document.body — parent overflow and z-index don't affect them
- Popover background is `rgba(0,0,0,0.8)` — semi-transparent by design
- Never wrap portal components in `overflow:hidden` expecting to clip them

## State

- Zustand empty array selectors: use module-level constant `const EMPTY: T[] = []`, never inline `[]`
- Immutable store updates: always spread nested state
- Read directly from stores — never prop drill store data
- Never comment out code — delete it entirely
- Features only import from core, never other features — cross-feature data goes through core stores
