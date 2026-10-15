# Close Opportunity as Won

End-to-end workflow for closing opportunities as Won using the repository pattern, service layer, and workflow engine.

## Architecture

```
CloseOpportunityWonWizard (UI)
        ↓
OpportunityWinService
        ↓
OpportunityRepository + LeadRepository (activity feed)
        ↓
Storage
```

## Business Rules

- Only opportunities in **Negotiation** or **Contract Review** can be marked as Won
- Won opportunities are **locked** — non-admins cannot edit stage, owner, or duplicate
- Administrators (`Sales.Admin`, etc.) may edit locked won records
- Direct stage transition to `won` is blocked — use the Close as Won wizard

## Winning Wizard (4 Steps)

| Step | Fields |
|------|--------|
| 1 — Final Revenue | Final Revenue, Currency, Contract Value, Margin, Discount |
| 2 — Customer Information | Decision Maker, Contract Start/End Date |
| 3 — Implementation | Expected Kickoff, Delivery Owner, Business Unit |
| 4 — Review | Summary + confirmation checkbox |

## After Winning

Updates opportunity:

- `status: won`, `stage: won`, `locked: true`
- `closedDate`, `finalRevenue`, `finalMargin`, `contractValue`
- Customer & implementation fields persisted on opportunity record

Creates:

- Timeline: Opportunity Won, Revenue Finalized, Owner Updated, Contract Created
- Activity: **Win Recorded**
- Audit record: `closed_won`
- Dashboard activity feed entry
- Signed contract document stub

## Dashboard Analytics (Live)

After close, invalidates dashboard queries. Live KPIs:

- **Win Rate** — `won / (won + lost)`
- **Revenue** — total won revenue (`finalRevenue` sum)
- **Pipeline** — open pipeline value decreases
- **Opportunities** — open count decreases

Also available: `getAverageDealSize()`, `getWonRevenue()`, `getForecastMetrics()`

## Key Files

| Layer | Path |
|-------|------|
| Schema / DTO | `domain/win.schema.ts`, `domain/win.dto.ts` |
| Form config | `config/win-form.config.ts` |
| Service | `services/opportunity-win.service.ts` |
| Hooks | `hooks/useCloseOpportunityWon.ts`, `hooks/useCloseOpportunityWonWizard.ts` |
| Wizard UI | `components/CloseOpportunityWonWizard.tsx` |
| Provider | `context/OpportunityManagementProvider.tsx` |
| Workflow rules | `lib/opportunity-workflow.ts` (`canMarkAsWon`, `isOpportunityLocked`) |

## Entry Points

- **Opportunity 360** → **Mark Won** button (enabled in Negotiation or Contract Review)
- Opens `CloseOpportunityWonWizard` via `openWinWizard(oppId)`

## Tests

```bash
npm run test -- opportunity-win
```

## Usage

```typescript
import { opportunityWinService } from '@/features/opportunity-management/services/opportunity-win.service'

const eligibility = await opportunityWinService.canCloseAsWon('opp-001')
if (eligibility.allowed) {
  await opportunityWinService.closeAsWon('opp-001', input, 'Vinay Kumar')
}
```
