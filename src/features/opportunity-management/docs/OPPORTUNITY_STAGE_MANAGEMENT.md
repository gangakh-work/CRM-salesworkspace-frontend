# Opportunity Stage Management

End-to-end opportunity stage management using the repository pattern, service layer, and workflow engine — no Dataverse, Azure OpenAI, or MSAL.

## Architecture

```
UI (Opportunity 360, Quick Actions, Dashboard)
        ↓
OpportunityStageService / ForecastEngineService
        ↓
OpportunityRepository (localStorage / in-memory)
        ↓
Storage
```

## Business Stages

1. Prospect
2. Qualification
3. Discovery
4. Proposal Submitted
5. Commercial Review
6. Negotiation
7. Contract Review
8. Won
9. Lost

## Stage Rules

- Only valid transitions are allowed (next, previous, or lost from open stages).
- Won is normally allowed only from Contract Review; admins may skip mandatory stages.
- Closed stages (Won/Lost) cannot transition to any other stage.
- Forbidden: Won → Prospect, Lost → Qualification, Won ↔ Lost.
- Opportunities on hold cannot change stage until resumed.

## Stage Timeline

Every transition creates:

- Timeline event (`stage_changed`)
- Activity log entry (completed task)
- Audit record (`stage_transition`)
- `stageUpdatedAt` / `stageUpdatedBy` on the opportunity
- `previousStage` tracking

## Key Files

| Layer | Path |
|-------|------|
| Workflow engine | `lib/opportunity-workflow.ts` |
| Admin roles | `lib/auth-roles.ts` |
| DTOs / validation | `domain/stage.schema.ts`, `domain/stage.dto.ts` |
| Stage service | `services/opportunity-stage.service.ts` |
| Forecast engine | `services/forecast-engine.service.ts` |
| Hook | `hooks/useOpportunityStage.ts` |
| Provider | `context/OpportunityManagementProvider.tsx` |
| 360 UI | `components/workspace360/Opportunity360QuickToolbar.tsx` |
| Stage history | `components/detail/OpportunityStageHistoryPanel.tsx` |
| Dashboard | `features/dashboard/components/SalesPipelinePanel.tsx` |

## Quick Actions (Opportunity 360)

- **Next Stage** — `moveToNextStage()`
- **Move Back** — `moveToPreviousStage()`
- **On Hold / Resume** — `setOnHold()`
- **Assign Owner** — `assignOwner()`
- **Duplicate** — `duplicateOpportunity()`
- **Add Activity** — creates a task via provider
- **Update Stage** — dropdown with allowed targets (admin sees skip options)

## Forecast Engine (Mock)

`ForecastEngineService` calculates:

- Pipeline revenue (sum of open opportunity values)
- Weighted revenue (value × probability)
- Expected revenue
- Forecast category per stage
- Stage distribution for dashboard

## Dashboard Updates

After any stage mutation, `notifyOpportunityUpdated()` reloads the opportunity provider and React Query invalidates:

- `queryKeys.dashboard.all`
- `queryKeys.opportunities.all`

`SalesPipelinePanel` reads live stage distribution via `useStageDistributionQuery()`.

## Admin Privileges

Users with `Sales.Admin`, `System.Administrator`, or `System.Admin` roles can skip mandatory stages. Mock user includes `Sales.Admin` for demo.

## Tests

```bash
npm run test -- opportunity-stage
```

Covers schema validation, workflow rules, transitions, on-hold, owner assignment, duplication, and forbidden transitions.

## Usage Example

```typescript
import { opportunityStageService } from '@/features/opportunity-management/services/opportunity-stage.service'

await opportunityStageService.transitionStage({
  opportunityId: 'opp-001',
  targetStage: 'commercial_review',
  transitionedBy: 'Vinay Kumar',
  isAdmin: true,
})
```

Events propagate automatically to Opportunity 360 and the dashboard.
