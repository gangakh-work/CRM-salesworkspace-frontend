# Lead Creation — End-to-End Architecture

Lead Creation is the first complete CRM automation: a multi-step wizard that validates input, persists through the service layer, and updates the lead list, dashboard KPIs, timeline, and activity feed.

## Architecture

```
CreateLeadWizard (UI)
        ↓
useCreateLeadWizard + useCreateLead (hooks)
        ↓
LeadManagementProvider.syncCreatedLead()
        ↓
LeadService.createLead()
        ↓
ILeadRepository
        ├── ApiLeadRepository      → SQLite via REST API (preferred)
        ├── LocalStorageLeadRepository → browser localStorage (default fallback)
        └── InMemoryLeadRepository     → non-persistent (tests)
```

## Storage Configuration

Set in `.env`:

| Value | Storage | Persistence |
|-------|---------|-------------|
| `local` (default) | localStorage | Survives refresh |
| `api` | Backend SQLite | Survives refresh, shared across clients |
| `memory` | In-memory | Lost on refresh (tests) |

```
VITE_LEAD_STORAGE=local
# VITE_LEAD_STORAGE=api     # Requires backend at VITE_API_BASE_URL
# VITE_LEAD_STORAGE=memory  # Non-persistent
```

When `api` is set but the backend is unreachable, the repository factory falls back to `local` automatically.

## User Flow

1. Click **New Lead** in the Lead Management toolbar
2. Complete 5 wizard steps: Customer → Company → Opportunity → Additional → Review
3. **Cancel** closes the wizard and clears the form
4. **Reset** clears all fields without closing
5. **Create Lead** validates, saves, and navigates to Lead 360°

## What Happens on Create

1. Form validated with Zod (`domain/lead.schema.ts`)
2. `LeadService` maps input → `Lead` entity with computed score (`config/lead-scoring.config.ts`)
3. Timeline event `lead_created` added to lead extras
4. Initial follow-up task and optional note created
5. Lead + extras saved via repository
6. Activity recorded for Dashboard Recent Activities
7. Lead list updated via `syncCreatedLead`
8. Dashboard KPI "Active Leads" updates via TanStack Query invalidation
9. Success toast displayed
10. User navigated to Lead 360° workspace

## Key Files

| Layer | Path |
|-------|------|
| DTO | `domain/lead.dto.ts` |
| Validation | `domain/lead.schema.ts` |
| Form config | `config/lead-form.config.ts` |
| Scoring config | `config/lead-scoring.config.ts` |
| Repository interface | `repositories/lead.repository.types.ts` |
| Local storage repo | `repositories/local-storage-lead.repository.ts` |
| API / SQLite repo | `repositories/api-lead.repository.ts` |
| Service | `services/lead.service.ts` |
| Hooks | `hooks/useCreateLeadWizard.ts`, `hooks/useLeadQueries.ts` |
| UI | `components/CreateLeadWizard.tsx` |
| State | `context/LeadManagementProvider.tsx` |
| Backend API | `backend/app/api/v1/leads.py` |
| Backend SQLite model | `backend/app/models/lead.py` |

## Tests

```bash
# Frontend unit tests
cd frontend && npm test

# Backend lead tests
cd backend && pytest tests/test_leads.py
```

## API Endpoints (SQLite mode)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/leads/snapshot` | Load full lead store |
| POST | `/api/v1/leads/entries` | Save lead + extras |
| POST | `/api/v1/leads/activities` | Record activity |
| GET | `/api/v1/leads/stats/active-count` | Active lead KPI |
| GET | `/api/v1/leads/activities?limit=10` | Recent activities |
