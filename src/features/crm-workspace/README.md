# CRM Workspace

Primary sales workspace for daily CRM operations. **Mock data only** — no Dataverse, backend, or Azure OpenAI.

## Layout

Three-panel design inspired by Copilot, Notion, Linear, and HubSpot:

```
┌──────────────┬─────────────────────────────┬──────────────┐
│  Left Nav    │  Middle Workspace           │  AI Context  │
│  (tabs)      │  (toolbar + views)          │  (always on) │
├──────────────┴─────────────────────────────┴──────────────┤
│  Status Bar — Connection · Environment · Mock · Theme     │
└───────────────────────────────────────────────────────────┘
```

## Workspace Tabs

| Tab | Route |
|-----|-------|
| Leads | `/workspace/leads` |
| Opportunities | `/workspace/opportunities` |
| Activities | `/workspace/activities` |
| Customers | `/workspace/customers` |
| Proposals | `/workspace/proposals` |
| Documents | `/workspace/documents` |
| Tasks | `/workspace/tasks` |

## View Modes

Cards · List · Kanban · Table · Calendar · Timeline

View preference persisted to `localStorage` (`sw:workspace-view-mode`).

## Toolbar

- Global search (filters mock records)
- Quick filters (All, My records, Due today, High priority, Recent)
- New menu (quick actions)
- AI, Export, Refresh, Notifications

## AI Context Panel (Right)

Always visible on desktop (`xl+`). Sheet on mobile/tablet.

- Ask AI input
- Suggested actions
- Follow-ups
- Meeting summary
- Next best action
- Risk alerts
- Recent activity

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Mobile | Bottom tab nav, AI panel in sheet |
| Tablet | Left nav hidden, bottom tabs |
| Desktop | Full 3-panel layout |

## Folder Structure

```
features/crm-workspace/
├── components/
│   ├── layout/          # 3-panel shell, toolbar, status bar
│   ├── views/           # 6 view modes
│   ├── RecordCard.tsx
│   └── ViewModeSwitcher.tsx
├── context/             # WorkspaceProvider
├── data/                # mock-workspace-data.ts
├── hooks/               # (via useWorkspace)
├── types/
└── pages/
```

## Future Integration

Replace `MOCK_RECORDS` with TanStack Query hooks when Dataverse APIs are approved. Layout and view components remain unchanged.
