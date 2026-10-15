# Lead Qualification — Architecture

Lead Qualification is a 4-step wizard that validates BANT criteria, calculates a mock qualification score, and persists the qualified lead through the repository layer.

## Architecture

```
QualifyLeadWizard (UI)
        ↓
useQualifyLeadWizard + useQualifyLead (hooks)
        ↓
LeadManagementProvider.syncQualifiedLead()
        ↓
LeadQualificationService.qualifyLead()
        ↓
ILeadRepository (localStorage | memory)
```

## Business Rules

- Only leads with status **New** (`draft`) or **Contacted** (`contacted`) can be qualified
- On qualify:
  - Status → `qualified`
  - `qualifiedDate`, `qualifiedBy`, `qualificationScore`, `qualificationRating` populated
  - Timeline event `lead_qualified` created
  - Activity log entry added
  - Dashboard KPIs invalidated (Qualified Leads, Pipeline Value, Score Distribution)

## Wizard Steps

1. **Customer Interest** — Products, Expected Revenue, Priority
2. **Budget** — Budget Range, Buying Timeline, Decision Maker, Competitors
3. **Qualification Questions** — BANT (Need, Budget, Authority, Timeline), Pain Points
4. **Review** — Summary with live score preview (Hot / Warm / Cold)

## Scoring Engine (Mock)

Factors: budget range, buying timeline, priority, industry, BANT confirmations, expected revenue.

| Rating | Score |
|--------|-------|
| Hot | ≥ 75 |
| Warm | ≥ 50 |
| Cold | < 50 |

## Key Files

| Layer | Path |
|-------|------|
| Schema | `domain/qualification.schema.ts` |
| DTO | `domain/qualification.dto.ts` |
| Form config | `config/qualification-form.config.ts` |
| Scoring config | `config/qualification-scoring.config.ts` |
| Scoring logic | `lib/qualification-scoring.ts` |
| Service | `services/lead-qualification.service.ts` |
| Hooks | `hooks/useQualifyLeadWizard.ts`, `hooks/useQualifyLead.ts` |
| UI | `components/QualifyLeadWizard.tsx` |
| Entry points | `Lead360QuickToolbar`, `LeadQuickActions` |

## Tests

```bash
cd frontend && npm test -- lead-qualification
```

## Usage

1. Open a lead with status **Draft** or **Contacted** in Lead 360°
2. Click **Qualify** in the toolbar or quick actions
3. Complete all wizard steps and click **Qualify Lead**
4. Lead 360°, timeline, dashboard, and activity feed update immediately
