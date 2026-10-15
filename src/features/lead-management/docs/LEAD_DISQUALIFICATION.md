# Lead Disqualification

Four-step wizard workflow to disqualify leads with reason tracking, optional competitor details, future follow-up scheduling, and live dashboard analytics.

## Architecture

```
DisqualifyLeadWizard (UI)
        ↓
useDisqualifyLeadWizard + useDisqualifyLead (hooks)
        ↓
LeadManagementProvider.syncDisqualifiedLead()
        ↓
LeadDisqualificationService.disqualifyLead()
        ↓
ILeadRepository.saveLead() + addActivity()
```

## Business Rules

- Only leads with status **New** (`draft`), **Contacted**, or **Qualified** can be disqualified
- Leads linked to **won or lost** opportunities cannot be disqualified
- On confirm: status → `disqualified`, reason and metadata stored on lead + extras
- Optional follow-up creates a planned task and timeline event
- Dashboard KPIs, funnel analytics, and disqualification report refresh automatically

## Wizard Steps

1. **Reason** — Budget Constraints, No Business Need, Lost to Competitor, Duplicate Lead, Invalid Contact, No Response, Project Cancelled, Other
2. **Competitor** — Optional competitor name and remarks
3. **Future Follow-up** — Optional revisit schedule (30/60/90/180 days) with assigned owner
4. **Review** — Summary and confirmation

## Timeline Events

| Event | Type |
|-------|------|
| Lead Disqualified | `disqualified` |
| Reason Recorded | `disqualification_reason` |
| Future Follow-up Created | `follow_up_scheduled` |

## Key Files

| Layer | Path |
|-------|------|
| Schema | `domain/disqualification.schema.ts` |
| DTO | `domain/disqualification.dto.ts` |
| Config | `config/disqualification-form.config.ts` |
| Record builder | `lib/disqualification-record.ts` |
| Service | `services/lead-disqualification.service.ts` |
| Hooks | `hooks/useDisqualifyLead.ts`, `hooks/useDisqualifyLeadWizard.ts` |
| UI | `components/DisqualifyLeadWizard.tsx` |
| Analytics | `dashboard/components/DisqualificationReportPanel.tsx` |
| Report page | `reports/pages/DisqualificationReportPage.tsx` |

## Tests

```bash
cd frontend && npm test -- lead-disqualification
```

## Usage

1. Open a lead in **New**, **Contacted**, or **Qualified** status
2. Click **Disqualify** from Lead 360 toolbar or quick actions
3. Complete the 4-step wizard and confirm
4. Lead list, Lead 360 timeline, activities feed, and dashboard analytics update immediately

## Extending

- Add reasons in `DISQUALIFICATION_REASON_OPTIONS` and `disqualificationReasonSchema`
- Adjust eligibility in `DISQUALIFY_ELIGIBLE_STATUSES`
- Analytics aggregate from `leadExtras.disqualification` via `leadService.getDisqualificationAnalytics()`
