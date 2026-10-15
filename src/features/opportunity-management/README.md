# Opportunity Management Module

Enterprise Opportunity Management workspace for sales executives. Mock data only — no backend, Dataverse, or Azure OpenAI.

## Routes

| Route | Description |
|-------|-------------|
| `/workspace/opportunities` | List workspace with 6 views |
| `/workspace/opportunities/:id` | Opportunity 360° detail workspace |

## Views

- **Table** — Full column set with sorting, grouping, pagination, bulk actions
- **Kanban** — Pipeline stages as columns
- **Pipeline** — Funnel visualization with stage totals
- **Timeline** — Close-date timeline grouped by month
- **Calendar** — Monthly close-date calendar
- **Forecast** — Quarter revenue, pipeline, weighted revenue, accuracy dashboard

## Opportunity 360° Tabs

Overview · Contacts · Timeline · Activities · Meetings · Emails · Documents · Notes · Commercials · Proposal · Forecast · AI Insights

## Quick Actions

Generate Proposal · Schedule Meeting · Create Task · Send Email · Update Stage · Mark Won · Mark Lost · Duplicate

## Pipeline Stages

Prospect → Qualification → Discovery → Proposal → Negotiation → Legal Review → Won | Lost

## Architecture

```
opportunity-management/
├── components/
│   ├── views/          # Kanban, Pipeline, Timeline, Calendar, Forecast
│   ├── workspace360/   # 360 layout panels
│   ├── workflow/       # Stepper, confirm dialog
│   └── detail/         # Timeline, notes
├── context/            # OpportunityManagementProvider
├── data/               # Mock opportunities + extras
├── lib/                # Stage workflow helpers
├── pages/              # Module, list, 360
└── types/              # TypeScript definitions
```

## Usage

The module is mounted via `OpportunitiesModule` in `CrmWorkspaceLayout` at `opportunities/*`.

```tsx
import { OpportunitiesModule, useOpportunityManagement } from '@/features/opportunity-management'
```
