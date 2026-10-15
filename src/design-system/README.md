# Enterprise Design System

Sales Workspace design system — reusable tokens, themes, and components.

## Structure

```
design-system/
├── tokens/           # CSS design tokens
├── themes/           # Light/dark via CSS variables
├── animations/       # Framer Motion presets
├── provider/         # ThemeProvider + Toaster
├── catalog/          # Component showcase (dev only)
└── types/            # Token TypeScript types

components/
├── ui/               # Primitives (Button, Input, Dialog...)
├── layout/           # App shell (Sidebar, Header, PageHeader...)
└── patterns/         # Composites (StatsCard, EmptyState, Timeline...)
```

## Usage

```tsx
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/patterns/data-display'
import { DesignSystemProvider } from '@/design-system/provider'
```

## Adding Components

```bash
npx shadcn@latest add dialog
```

Place shadcn additions in `components/ui/` and export from `components/ui/index.ts`.

## Tokens

All visual properties are driven by CSS custom properties in `design-system/tokens/`.
Components reference semantic tokens — never hardcode colors or spacing.

See `documentation/design-system.md` for full architecture reference.
