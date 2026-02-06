---
paths:
  - apps/web/src/**/*.tsx
  - apps/web/src/**/*.ts
---

# Web App Patterns

## Route Structure

Routes live in `src/routes/`:

| Route | Path | Purpose |
|-------|------|---------|
| Home | `/` | Landing page with featured items |
| Browse | `/browse` | Search and filter all items |
| Detail | `/item/:type/:name` | Individual item details |

## Component Organization

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── index.ts     # Barrel export
│   ├── Header.tsx       # App-specific components
│   └── ItemCard.tsx
├── routes/              # Page components
└── lib/                 # Utilities and types
```

## UI Components

Use components from `@/components/ui`:

```typescript
import { Button, Card, Badge } from '@/components/ui'

// Consistent styling via variants
<Button variant="primary">Install</Button>
<Badge variant="success">Claude</Badge>
```

## Registry Integration

```typescript
import { fetchManifest, fetchItemContent } from '@/lib/registry'

// In route component
const manifest = await fetchManifest()
const skills = manifest.skills
```

## Tailwind Styling

- Use Tailwind classes directly
- Custom colors in `tailwind.config.ts`
- Keep component-specific styles in component files

## React Router

```typescript
import { useParams, Link } from 'react-router-dom'

// Get route params
const { type, name } = useParams()

// Navigation
<Link to={`/item/skills/${skill.name}`}>View</Link>
```

## Anti-Patterns

| Anti-Pattern | Fix |
|--------------|-----|
| Inline styles | Use Tailwind classes |
| Fetch in render | Use loader or useEffect |
| Prop drilling | Keep state close to usage |
| Giant components | Extract to smaller components |
