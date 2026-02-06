# Component Reference

Detailed component implementations for the Toolr UI design system.

## Table of Contents
- [IconButton](#iconbutton)
- [Input](#input)
- [Toggle](#toggle)
- [Checkbox](#checkbox)
- [Label/Badge](#labelbadge)
- [ScopeBadge](#scopebadge)
- [Tooltip](#tooltip)
- [Card Patterns](#card-patterns)
- [SourcesCard](#sourcescard)

---

## IconButton

Full implementation with all variants and sizes.

```tsx
interface IconButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  size?: 'xss' | 'xs' | 'sm' | 'lg';
  variant?: 'default' | 'ghost' | 'success' | 'danger' | 'primary';
  active?: boolean;
  disabled?: boolean;
  badge?: number | string;
  badgeColor?: 'red' | 'blue' | 'green' | 'orange';
  tooltip?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xss: 'w-[18px] h-[18px]',
  xs: 'w-6 h-6',
  sm: 'w-7 h-7',
  lg: 'w-9 h-9',
};

const iconSizeClasses = {
  xss: 'w-2.5 h-2.5',
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

const variantClasses = {
  default: `bg-gray-800 border-[#45475a] text-[#a6adc8]
    hover:bg-[#313244] hover:border-[#6c7086] hover:text-[#cdd6f4]`,
  ghost: `bg-transparent border-transparent text-[#a6adc8]
    hover:bg-[#313244] hover:text-[#cdd6f4]`,
  success: `bg-green-500/10 border-green-500/30 text-green-400
    hover:bg-green-500/20 hover:border-green-500/50`,
  danger: `bg-red-500/10 border-red-500/30 text-red-400
    hover:bg-red-500/20 hover:border-red-500/50`,
  primary: `bg-blue-500/10 border-blue-500/30 text-blue-400
    hover:bg-blue-500/20 hover:border-blue-500/50`,
};

// Base classes
const baseClasses = `
  inline-flex items-center justify-center rounded-md border
  transition-colors disabled:opacity-50 disabled:cursor-not-allowed
`;
```

---

## Input

```tsx
interface InputProps {
  size?: 'sm' | 'md';
  error?: string;
  monospace?: boolean;
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
};

// Implementation
<input
  className={`
    h-[26px] rounded-lg bg-[#313244] border text-[#cdd6f4]
    placeholder-[#6c7086] focus:outline-none focus:border-blue-500
    ${error ? 'border-red-500' : 'border-[#45475a]'}
    ${monospace ? 'font-mono' : ''}
    ${sizeClasses[size]}
  `}
/>
{error && <span className="text-xs text-red-400 mt-1">{error}</span>}
```

---

## Toggle

```tsx
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

<button
  role="switch"
  aria-checked={checked}
  disabled={disabled}
  onClick={() => onChange(!checked)}
  className={`
    relative w-11 h-6 rounded-full transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    ${checked ? 'bg-blue-600' : 'bg-[#45475a]'}
  `}
>
  <span
    className={`
      absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
      transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}
    `}
  />
</button>
```

---

## Checkbox

```tsx
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

<button
  role="checkbox"
  aria-checked={checked}
  disabled={disabled}
  onClick={() => onChange(!checked)}
  className={`
    w-5 h-5 rounded border transition-colors
    flex items-center justify-center
    disabled:opacity-50 disabled:cursor-not-allowed
    ${checked
      ? 'bg-blue-600 border-blue-600'
      : 'border-[#45475a] hover:bg-[#313244] hover:border-[#6c7086]'}
  `}
>
  {checked && <CheckIcon className="w-3 h-3 text-white" />}
</button>
```

---

## Label/Badge

```tsx
type BadgeColor = 'gray' | 'green' | 'red' | 'blue' | 'yellow' | 'orange' | 'purple' | 'pink' | 'cyan' | 'emerald' | 'amber' | 'teal' | 'indigo';

interface BadgeProps {
  color?: BadgeColor;
  size?: 'sm' | 'md';
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const colorClasses: Record<BadgeColor, string> = {
  gray: 'bg-gray-500/20 text-gray-300',
  green: 'bg-green-500/20 text-green-300',
  red: 'bg-red-500/20 text-red-300',
  blue: 'bg-blue-500/20 text-blue-300',
  yellow: 'bg-yellow-500/20 text-yellow-300',
  orange: 'bg-orange-500/20 text-orange-300',
  purple: 'bg-purple-500/20 text-purple-300',
  pink: 'bg-pink-500/20 text-pink-300',
  cyan: 'bg-cyan-500/20 text-cyan-300',
  emerald: 'bg-emerald-500/20 text-emerald-300',
  amber: 'bg-amber-500/20 text-amber-300',
  teal: 'bg-teal-500/20 text-teal-300',
  indigo: 'bg-indigo-500/20 text-indigo-300',
};

const sizeClasses = {
  sm: 'h-[18px] px-1.5 text-xs',
  md: 'h-[20px] px-2 text-xs',
};

const iconSizeClasses = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
};

<span className={`
  inline-flex items-center gap-1 rounded font-bold leading-none
  ${colorClasses[color]} ${sizeClasses[size]}
`}>
  {Icon && <Icon className={iconSizeClasses[size]} />}
  {children}
</span>
```

---

## ScopeBadge

For indicating scope levels (user, project, local).

```tsx
type Scope = 'user' | 'project' | 'local' | 'readonly';

const scopeConfig = {
  user: { color: 'emerald', icon: UserIcon, label: 'User' },
  project: { color: 'blue', icon: FolderIcon, label: 'Project' },
  local: { color: 'pink', icon: ComputerIcon, label: 'Local' },
  readonly: { color: 'amber', icon: LockIcon, label: 'Read-only' },
};

<span className={`
  inline-flex items-center gap-1 h-[18px] px-1.5 rounded
  text-xs font-medium leading-none
  bg-${config.color}-500/20 text-${config.color}-300
`}>
  <Icon className="w-2.5 h-2.5" />
  {config.label}
</span>
```

---

## Tooltip

Portal-based tooltip with positioning.

```tsx
interface TooltipProps {
  title: string;
  description?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

// Tooltip content (rendered in portal)
<div className="
  absolute px-3 py-2 bg-[#1e1e2e] border border-[#45475a]
  rounded-lg shadow-xl z-[9999] pointer-events-none
">
  <div className="text-sm text-[#cdd6f4] font-medium">{title}</div>
  {description && (
    <div className="text-xs text-[#a6adc8] mt-0.5">{description}</div>
  )}
  {/* Arrow */}
  <div className="
    absolute w-3 h-3 bg-[#1e1e2e] border-l border-t border-[#45475a]
    rotate-45
  " />
</div>
```

---

## Card Patterns

### Basic Card
```tsx
<div className="p-3 rounded-lg border border-[#45475a] bg-[#181825]">
  {children}
</div>
```

### Card with Type Indicator
```tsx
<div className="rounded-lg border border-[#45475a] bg-[#181825] overflow-hidden">
  <div className="border-l-4 border-l-pink-400 p-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#cdd6f4]">{title}</span>
        <Badge color="pink" size="sm">skill</Badge>
      </div>
      <IconButton icon={MoreIcon} size="xs" variant="ghost" />
    </div>
    <p className="text-xs text-[#a6adc8] mt-1 line-clamp-2">{description}</p>
  </div>
</div>
```

### Interactive Card
```tsx
<div className="
  p-3 rounded-lg border border-[#45475a] bg-[#181825]
  hover:bg-gray-800 cursor-pointer transition-colors
">
  {children}
</div>
```

### Card Group Header
```tsx
<div className="bg-pink-500/5 border border-pink-500/20 rounded-t-lg px-4 py-3">
  <h3 className="text-sm font-medium text-[#cdd6f4]">{title}</h3>
</div>
```

---

## SourcesCard

For displaying grouped source items with accent colors.

```tsx
type AccentColor = 'emerald' | 'blue' | 'purple' | 'yellow';

interface SourcesCardProps {
  title: string;
  accent: AccentColor;
  sources: Source[];
}

<div className="rounded-xl overflow-hidden border border-[#45475a]">
  {/* Header */}
  <div className={`
    px-4 py-3 border-b
    bg-${accent}-500/5 border-${accent}-500/20
  `}>
    <h3 className="text-sm font-medium text-[#cdd6f4]">{title}</h3>
  </div>

  {/* Content */}
  <div className="bg-[#181825] p-3 space-y-2">
    {sources.map(source => (
      <div className="
        p-3 rounded-lg border border-[#45475a]
        hover:bg-gray-800 transition-colors
      ">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#a6adc8]" />
          <span className="text-sm text-[#cdd6f4]">{source.name}</span>
        </div>
        {source.path && (
          <span className="text-xs text-[#6c7086] font-mono ml-6">
            {source.path}
          </span>
        )}
      </div>
    ))}
  </div>
</div>
```

---

## Extension Type Color Mapping

Use these colors for extension type indicators (matching configr):

```tsx
// Badge color mapping
const typeToBadgeColor: Record<string, BadgeColor> = {
  skill: 'pink',
  command: 'amber',
  hook: 'purple',
  agent: 'blue',
  mcp: 'teal',
  settings: 'orange',
  plugin: 'indigo',
  instruction: 'slate',
  prompt: 'cyan',
  config: 'gray',
  extension: 'emerald',
};

// Border colors for cards (using -500 variant)
const typeBorderColors: Record<string, string> = {
  skill: 'border-l-pink-500',
  command: 'border-l-amber-500',
  hook: 'border-l-purple-500',
  agent: 'border-l-blue-500',
  mcp: 'border-l-teal-500',
  settings: 'border-l-orange-500',
  plugin: 'border-l-indigo-500',
  instruction: 'border-l-slate-400',
  prompt: 'border-l-cyan-500',
  config: 'border-l-gray-500',
  extension: 'border-l-emerald-500',
};

// Icon/text colors for items
const typeTextColors: Record<string, string> = {
  skill: 'text-pink-500',
  command: 'text-amber-500',
  hook: 'text-purple-500',
  agent: 'text-blue-500',
  mcp: 'text-teal-500',
  settings: 'text-orange-500',
  plugin: 'text-indigo-500',
  instruction: 'text-slate-400',
  prompt: 'text-cyan-500',
  config: 'text-gray-500',
  extension: 'text-emerald-500',
};

// Usage for card with type indicator
<Card typeIndicator={item.type}>
  <TypeBadge type={item.type} />
  {/* content */}
</Card>

// Usage for standalone badge
<Badge color={typeToBadgeColor[type]}>{type}</Badge>

// Usage for icon color
<Icon className={typeTextColors[type]} />
```
