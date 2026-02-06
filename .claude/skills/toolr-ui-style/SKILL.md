---
name: toolr-ui-style
description: |
  Toolr Suite UI design system for React + Tailwind CSS applications. Use when building or styling UI components for seedr, configr, or other toolr-suite apps. Triggers on: "style this", "match toolr design", "use our design system", "add tooltip", "create button", "style card", "fix colors", or when working on toolr-suite frontend components.
---

# Toolr UI Style Guide

Dark theme design system (Catppuccin Mocha inspired) for React + Tailwind CSS.

## Typography

```
Font: Inter, system-ui, sans-serif
Mono: font-mono (for code/paths)

Sizes:
- text-xs (12px): labels, badges, hints
- text-sm (14px): card titles, settings, UI text
- text-base: body text

Weights:
- font-medium (500): labels, titles
- font-bold (700): badge text
```

## Colors

### Backgrounds (dark to light)
```
#030712  - App background (darkest)
#11111b  - Secondary
#181825  - Tertiary (card content)
#1e1e2e  - Active/hover states
#313244  - Inputs, controls
#45475a  - Borders, separators
#585b70  - Lighter borders
```

### Text
```
#cdd6f4  - Primary text
#a6adc8  - Secondary text
#6c7086  - Tertiary/placeholder
#ffffff  - Emphasized
```

### Semantic (Tailwind)
```
Primary:  blue-400/500/600
Success:  green-300/400/500
Danger:   red-300/400/500
Warning:  orange-400/500, yellow-400
Info:     cyan-400/500
```

### Extension Type Colors (matching configr)
```
Skill:       pink-500      (border-l-pink-500, text-pink-500, bg-pink-500/20)
Command:     amber-500     (border-l-amber-500, text-amber-500, bg-amber-500/20)
Hook:        purple-500    (border-l-purple-500, text-purple-500, bg-purple-500/20)
Agent:       blue-500      (border-l-blue-500, text-blue-500, bg-blue-500/20)
MCP:         teal-500      (border-l-teal-500, text-teal-500, bg-teal-500/20)
Settings:    orange-500    (border-l-orange-500, text-orange-500, bg-orange-500/20)
Plugin:      indigo-500    (border-l-indigo-500, text-indigo-500, bg-indigo-500/20)
Instruction: slate-400     (border-l-slate-400, text-slate-400, bg-slate-500/20)
Prompt:      cyan-500      (border-l-cyan-500, text-cyan-500, bg-cyan-500/20)
Config:      gray-500      (border-l-gray-500, text-gray-500, bg-gray-500/20)
Extension:   emerald-500   (border-l-emerald-500, text-emerald-500, bg-emerald-500/20)
```

## Components

### IconButton
```tsx
// Sizes: xss (18px), xs (24px), sm (28px), lg (36px)
// Variants: default, ghost, success, danger, primary, + colors

<button className="w-7 h-7 rounded-md border border-[#45475a] bg-gray-800
  hover:bg-[#313244] hover:border-[#6c7086] hover:text-[#cdd6f4]
  disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
  <Icon className="w-3.5 h-3.5" />
</button>
```

### Input
```tsx
// Use bg-gray-900 border-gray-700 to match filter dropdowns
<input className="h-[26px] px-3 py-1.5 text-sm rounded-lg
  bg-gray-900 border border-gray-700 text-[#cdd6f4]
  placeholder-[#6c7086] focus:outline-none focus:border-blue-500" />
```

### Toggle
```tsx
<button className={`w-11 h-6 rounded-full transition-colors
  ${checked ? 'bg-blue-600' : 'bg-[#45475a]'}`}>
  <span className={`block w-5 h-5 bg-white rounded-full
    transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
</button>
```

### Checkbox
```tsx
<button className={`w-5 h-5 rounded border transition-colors
  ${checked ? 'bg-blue-600 border-blue-600' : 'border-[#45475a] hover:bg-[#313244]'}`}>
  {checked && <CheckIcon className="w-3 h-3 text-white" />}
</button>
```

### Label/Badge
```tsx
// Colors: gray, green, red, blue, yellow, orange, purple
// Sizes: sm (h-[18px] px-1.5), md (h-[20px] px-2)

<span className="inline-flex items-center h-[18px] px-1.5 text-xs font-bold
  rounded bg-blue-500/20 text-blue-300">
  Label
</span>
```

### Tooltip
```tsx
// Portal-based, positions: top, bottom, left, right
<div className="px-3 py-2 bg-[#1e1e2e] border border-[#45475a]
  rounded-lg shadow-xl z-[9999]">
  <div className="text-sm text-[#cdd6f4] font-medium">Title</div>
  <div className="text-xs text-[#a6adc8]">Description</div>
</div>
```

### Card
```tsx
<div className="p-3 rounded-lg border border-[#45475a] bg-[#181825]
  hover:bg-gray-800 transition-colors">
  {/* Type indicator via left border */}
  <div className="border-l-4 border-l-pink-400 pl-3">
    Content
  </div>
</div>
```

## Spacing

```
Heights:
- Inputs/buttons: 26px
- Toggles: 24px
- Labels sm: 18px, md: 20px
- Sidebar: 40px wide
- Header: 45px

Gaps: gap-0.5, gap-1, gap-1.5, gap-2, gap-3
Padding: p-3 (cards), px-3 py-2 (inputs), px-1.5 (badges)
```

## Borders & Radius

```
Radius: rounded-md (buttons), rounded-lg (cards/inputs), rounded-xl (groups), rounded-full (toggles)
Borders: border-[#45475a] default, border-[#6c7086] hover
Type borders: border-l-4 border-l-{color}-400
```

## States

```tsx
// Hover
hover:bg-[#313244] hover:border-[#6c7086] hover:text-[#cdd6f4]

// Active
bg-[#313244] text-[#cdd6f4] border-[#6c7086]

// Disabled
disabled:opacity-50 disabled:cursor-not-allowed

// Focus
focus:outline-none focus:border-blue-500
```

## Layout Patterns

```tsx
// Settings row
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-[#a6adc8]" />
    <span className="text-sm text-[#cdd6f4]">Label</span>
  </div>
  <Toggle />
</div>

// Card with type indicator
<div className="border-l-4 border-l-pink-400 p-3 rounded-lg bg-[#181825]">
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium text-[#cdd6f4]">Title</span>
    <Badge color="pink">skill</Badge>
  </div>
  <p className="text-xs text-[#a6adc8] mt-1">Description</p>
</div>
```

## Filter Bar Pattern

Standard filter bar with search and dropdown filters (see `references/filters.md` for full implementation).

```tsx
// Filter bar layout
<div className="flex flex-wrap items-center gap-2">
  {/* Search input */}
  <div className="relative">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
    <input
      type="search"
      placeholder="Search..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="h-[26px] pl-7 pr-3 w-36 text-xs rounded-lg bg-gray-900 border border-gray-700
        text-[#cdd6f4] placeholder-gray-500 focus:outline-none focus:border-blue-500"
    />
  </div>
  <div className="flex-1" />  {/* Pushes filters right */}

  {/* Filter dropdowns */}
  <FilterDropdown value={statusFilter} onChange={setStatusFilter} placeholder="Status" options={statusOptions} />
  <FilterDropdown value={typeFilter} onChange={setTypeFilter} placeholder="Type" options={typeOptions} />

  {/* Reset when active */}
  {hasActiveFilters && <IconButton icon={X} variant="danger" size="sm" onClick={resetFilters} />}
</div>
```

### Filter Dropdown States

| State | Button Style | Clear Button |
|-------|--------------|--------------|
| Unfiltered | `rounded-lg`, gray text | Hidden |
| Filtered | `rounded-l-lg border-r-0`, white text, blue Filter icon | Visible `rounded-r-lg` |

```tsx
// Unfiltered button
<button className="px-3 py-1 bg-gray-900 border border-gray-700 text-xs rounded-lg ...">
  <Filter className="w-3 h-3 text-gray-500" />
  <span className="text-gray-500">Status</span>
  <ChevronDown className="w-3.5 h-3.5" />
</button>

// Filtered button + clear button compound
<button className="... rounded-l-lg border-r-0">
  <Filter className="w-3 h-3 text-blue-400 fill-blue-400" />
  <span className="text-white">Active</span>
</button>
<button className="w-[22px] h-[26px] rounded-r-lg border border-gray-700
  hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/50">
  <X className="w-3 h-3" />
</button>
```
