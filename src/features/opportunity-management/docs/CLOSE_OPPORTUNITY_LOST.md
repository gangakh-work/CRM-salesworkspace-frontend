# Close Opportunity as Lost

End-to-end workflow for closing opportunities as Lost using the repository pattern, service layer, and workflow engine.

## Architecture

```
CloseOpportunityLostWizard (UI)
        ↓
OpportunityLostService
        ↓
OpportunityRepository + LeadRepository (activity feed)
        ↓
Storage
```

## Business Rules

- Only **Commercial Review**, **Negotiation**, or **Contract Review** can be marked as Lost
- **Won** opportunities cannot be changed to Lost
- Lost opportunities are **locked** — non-admins cannot edit
- Direct stage transition to `lost` is blocked — use the Close as Lost wizard

## Lost Wizard (4 Steps)

| Step | Fields |
|------|--------|
| 1 — Reason | Dropdown (10 lost reasons) |
| 2 — Competitor Details | Competitor Name, Solution, Price Difference, Remarks |
| 3 — Future Opportunity | Will revisit? (Yes/No), Follow-up Date, Owner |
| 4 — Review | Summary + confirmation |

### Lost Reasons

- Price Too High
- Lost to Competitor
- Budget Cancelled
- Project Cancelled
- No Decision
- Customer Not Interested
- Technical Mismatch
- Timeline Changed
- Internal Decision
- Other

## After Confirmation

Updates opportunity:

- `status: lost`, `stage: lost`, `locked: true`
- `lostDate`, `lostReason`, competitor fields, remarks
- Follow-up fields when revisiting

Creates:

- Timeline: Opportunity Lost, Reason Recorded, Competitor Recorded (if applicable), Follow-up Created (if revisiting)
- Activity: Lost reason task + planned follow-up (if applicable)
- Audit record: `closed_lost`
- `lostAnalysis` on extras for analytics
- Dashboard activity feed entry

## Dashboard & Analytics

Live metrics via `OpportunityLostService.getLostAnalytics()`:

- Top Lost Reasons
- Competitor Analysis
- Industry Analysis
- Region Analysis
- Average Lost Deal Size
- Total Lost Revenue

Dashboard KPIs refresh automatically (win rate, pipeline, open opportunities) via query invalidation.

## Opportunity 360

When status is `lost`:

- **Lost Information** tab shows reason, competitor, remarks, follow-up
- Left panel shows **Locked** badge
- Quick actions disabled for locked records (non-admin)

## Key Files

| Layer | Path |
|-------|------|
| Schema / DTO | `domain/lost.schema.ts`, `domain/lost.dto.ts` |
| Form config | `config/lost-form.config.ts` |
| Service | `services/opportunity-lost.service.ts` |
| Hooks | `hooks/useCloseOpportunityLost.ts`, `hooks/useCloseOpportunityLostWizard.ts` |
| Wizard UI | `components/CloseOpportunityLostWizard.tsx` |
| 360 panel | `components/detail/OpportunityLostInfoPanel.tsx` |
| Workflow | `lib/opportunity-workflow.ts` (`canMarkAsLost`, `LOST_ELIGIBLE_STAGES`) |

## Entry Points

- **Opportunity 360** → **Mark Lost** (enabled in Commercial Review, Negotiation, or Contract Review)
- Opens `CloseOpportunityLostWizard` via `openLostWizard(oppId)`

## Tests

```bash
npm run test -- opportunity-lost
```

## Usage

```typescript
import { opportunityLostService } from '@/features/opportunity-management/services/opportunity-lost.service'

const eligibility = await opportunityLostService.canCloseAsLost('opp-001')
if (eligibility.allowed) {
  await opportunityLostService.closeAsLost('opp-001', input, 'Vinay Kumar')
}
```
