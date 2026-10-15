# Sales Workspace — Frontend

Enterprise React SPA foundation for Sales Workspace.

## Prerequisites

- Node.js 22+
- npm 10+

## Installation

```bash
cd frontend
cp .env.example .env    # Windows: copy .env.example .env
npm install
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server at http://localhost:5173 |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check only |

## Application Shell Architecture

The frontend core delivers a production-ready **Application Shell** — navigation, layout, providers, and placeholder routes — without business module implementation.

### Folder Structure

```
src/
├── app/
│   ├── App.tsx                 # Root component
│   ├── providers/              # Theme, Query, Settings, Sidebar, Notifications
│   └── router/                 # React Router configuration
├── shell/                      # Application shell components
│   ├── AppShell.tsx            # Main layout orchestrator
│   ├── AppSidebar.tsx          # Responsive sidebar navigation
│   ├── TopNavigation.tsx       # Header with search, theme, notifications, profile
│   ├── CommandBar.tsx          # ⌘K command palette
│   ├── GlobalSearch.tsx        # Search trigger
│   ├── NotificationCenter.tsx  # Notification popover
│   ├── ProfileMenu.tsx         # User profile dropdown
│   ├── AppBreadcrumb.tsx       # Contextual breadcrumbs
│   ├── ThemeSwitcher.tsx       # Light/dark toggle
│   └── ShellFooter.tsx         # Application footer
├── config/
│   ├── constants.ts            # App constants and layout dimensions
│   ├── feature-registry.ts     # Central feature enable/disable registry
│   ├── navigation.ts           # Nav groups derived from registry
│   ├── routes.ts               # Route metadata and definitions
│   └── theme.ts                # Theme configuration
├── components/
│   ├── global/                 # LoadingOverlay, ProgressBar, ErrorBoundary, EmptyState
│   ├── ui/                     # shadcn/ui primitives
│   └── patterns/               # Design system patterns
├── pages/                      # Global pages (Coming Soon, 404, etc.)
├── hooks/                      # useTheme, useSidebar, useNavigation, etc.
├── design-system/              # Tokens, themes, catalog
└── features/                   # Business modules (future — not implemented)
```

### Component Structure

```
App
└── ErrorBoundary
    └── AppProviders
        ├── DesignSystemProvider (Theme + Toast)
        ├── QueryProvider (TanStack Query)
        ├── SettingsProvider
        ├── SidebarProvider
        └── NotificationProvider
            └── RouterProvider
                └── ShellLayout → AppShell
                    ├── AppSidebar (desktop + mobile sheet)
                    ├── TopNavigation
                    │   ├── GlobalSearch → CommandBar (⌘K)
                    │   ├── ThemeSwitcher
                    │   ├── NotificationCenter
                    │   └── ProfileMenu
                    ├── AppBreadcrumb
                    ├── Outlet (page content)
                    └── ShellFooter
```

### Route Structure

| Route | Page | Shell |
|-------|------|-------|
| `/` | Redirect → `/dashboard` | Yes |
| `/dashboard` | Coming Soon | Yes |
| `/leads` | Coming Soon | Yes |
| `/opportunities` | Coming Soon | Yes |
| `/activities` | Coming Soon | Yes |
| `/documents` | Coming Soon | Yes |
| `/reports` | Coming Soon | Yes |
| `/ai-assistant` | Coming Soon | Yes |
| `/settings` | Coming Soon | Yes |
| `/administration` | Coming Soon | Yes |
| `/design-system` | Design System Catalog (dev) | Yes |
| `/unauthorized` | Unauthorized | No |
| `/maintenance` | Maintenance | No |
| `*` | Not Found | Yes |

### Feature Registry

Modules are registered centrally in `config/feature-registry.ts`. Set `enabled: false` to disable a module (removes from nav and routes).

| Feature | Enabled | Nav |
|---------|---------|-----|
| Dashboard | ✅ | ✅ |
| Leads | ✅ | ✅ |
| Opportunities | ✅ | ✅ |
| Activities | ✅ | ✅ |
| Documents | ✅ | ✅ |
| Reports | ✅ | ✅ |
| AI Assistant | ✅ | ✅ |
| Settings | ✅ | ✅ |
| Administration | ✅ | ✅ |
| Proposal Evaluator | ❌ | ❌ |
| KM Portal | ❌ | ❌ |
| Commercial Checker | ❌ | ❌ |
| Commission Agent | ❌ | ❌ |

### Global Hooks

| Hook | Purpose |
|------|---------|
| `useTheme()` | Theme mode (light/dark/system) |
| `useSidebar()` | Sidebar collapsed/mobile state |
| `useNavigation()` | Nav items, active route, breadcrumbs |
| `useNotification()` | Notification list and read state |
| `useSettings()` | User preferences (breadcrumbs, animations) |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open command palette |

## Environment Variables

Copy `.env.example` to `.env`:

| Variable | Description |
|----------|-------------|
| `VITE_APP_NAME` | Application display name |
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_MSAL_CLIENT_ID` | Azure AD app client ID (future auth) |

## Technology Stack

- React 19, Vite, TypeScript
- Tailwind CSS v4, shadcn/ui
- Framer Motion, React Router, TanStack Query
- Lucide Icons, next-themes, Sonner

## Status

**Frontend Core complete.** Application shell, routing, providers, and placeholder pages are ready.

**Mock Authentication complete.** Premium login experience with localStorage session, protected routes, and user context on dashboard. No MSAL or backend integration.

**Executive Dashboard complete.** Premium dashboard with KPI cards, AI insights, pipeline funnel, activities, meetings, notifications, and floating AI widget. Mock data only.

**CRM Workspace complete.** Three-panel sales workspace with 7 tabs, 6 view modes, AI context panel, toolbar, and status bar. Mock data only.

**Lead Management complete.** Enterprise lead module with table/kanban/cards/timeline views, detail drawer, 5-step create wizard, and AI placeholders. Mock data only.

See feature READMEs in `src/features/`.
