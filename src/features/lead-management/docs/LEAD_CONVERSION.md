# Lead Conversion (Qualified → Opportunity)

End-to-end client-side workflow for converting a **qualified** lead into a persisted opportunity.

## Architecture

```
ConvertLeadWizard (UI)
  ↓
useConvertLeadWizard + useConvertLead (hooks)
  ↓
LeadManagementProvider.syncConvertedLead()
  ↓
LeadConversionService.convertLead()
  ↓
ILeadRepository + IOpportunityRepository → localStorage
  ↓
notifyOpportunityUpdated() → OpportunityManagementProvider reload
```

## Business Rules

| Rule | Enforcement |
|------|-------------|
| Only **Qualified** leads can convert | `CONVERT_ELIGIBLE_STATUSES`, `canConvertLead()` |
| Lead can convert **once** | Blocks `converted` status / existing `convertedOpportunityId` |
| Disqualified leads cannot convert | Explicit guard in `canConvert()` |

## Wizard Steps

1. **Opportunity Basics** — name, customer, contact, expected revenue, close date
2. **Opportunity Details** — stage, forecast, probability, region, business unit, industry
3. **Commercial Details** — currency, estimated revenue, margin, priority
4. **Review** — summary + confirmation checkbox

## After Conversion

- Creates `Opportunity` with `leadId` link
- Locks lead: `status = converted`, sets `convertedOpportunityId`
- Lead timeline: `converted`, `opportunity_created`, `owner_assigned`
- Opportunity timeline: `converted_from_lead`, `created`, `owner_assigned`
- Activity on lead + opportunity; dashboard activity feed entry
- Invalidates `leads`, `dashboard`, and `opportunities` query keys

## Key Files

| Layer | Path |
|-------|------|
| Schema | `domain/conversion.schema.ts` |
| DTO | `domain/conversion.dto.ts` |
| Config | `config/conversion-form.config.ts` |
| Lib | `lib/conversion-record.ts` |
| Service | `services/lead-conversion.service.ts` |
| Hooks | `hooks/useConvertLead.ts`, `hooks/useConvertLeadWizard.ts` |
| UI | `components/ConvertLeadWizard.tsx` |
| Tests | `services/lead-conversion.service.test.ts` |

## Entry Points

- `LeadQuickActions` — Convert button when `canConvertLead(status)`
- `Lead360QuickToolbar` — Convert action
- Wizard mounted in `LeadsModule.tsx`

## Dashboard KPIs (live)

- **Open Opportunities** — `opportunityService.getOpenOpportunityCount()`
- **Pipeline Value** — `opportunityService.getPipelineValue()`
- **Expected Revenue** — open opportunity revenue sum
- **Lead Conversion Rate** — converted vs disqualified leads

## 360 Views

- **Lead 360** — Opportunities tab loads linked opps via `opportunityService.getByLeadId()`
- **Opportunity 360** — Source Lead panel when `opportunity.leadId` is set
