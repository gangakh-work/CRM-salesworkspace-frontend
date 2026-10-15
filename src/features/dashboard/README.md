# Dashboard Feature

Executive dashboard for Sales Workspace backed by live Dataverse APIs via `DashboardApi` and TanStack Query.

## Architecture

```
DashboardPage
├── useDashboardKpisQuery, useExecutiveDashboardQuery, …
├── DashboardApi → /api/v1/dashboard/*
└── useDashboardSettings → widget order & collapse (localStorage UI prefs only)
```

## Data sources

| Panel | Source |
|-------|--------|
| KPIs, charts, tables | `GET /dashboard/*` (Dataverse aggregation) |
| Lead funnel & disqualification | `GET /dashboard/reports/*` |
| Score distribution | Live leads via `LeadApi.fetchLeads()` |
| Recent activities | Derived from `GET /dashboard/recent-leads` |
| AI recommendations | Rule-based recommendations from live lead data |

## Settings

Persisted to `localStorage` (`sw:dashboard-settings`): widget visibility, order, and collapse state only — not CRM data.
