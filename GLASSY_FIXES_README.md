# Glassy CRM – latest UI/data fixes

- Lead and opportunity detail records now normalise Dataverse formatted-value annotations and lookup display values before rendering summaries.
- Lead details include a Notes tab with create/list wiring to:
  - GET /api/v1/dataverse/leads/{lead_id}/notes
  - POST /api/v1/dataverse/leads/{lead_id}/notes
- Removed Import Excel from the Leads page.
- Opportunity detail fields normalise customer, owner, territory, industry and forecast labels.
- Replaced legacy brown/gold opportunity palette with the charcoal Glassy theme.
- Added shared glass input/select/textarea styling so forms use the same field treatment across the app.

## Validation
- ESLint: passed with no errors or warnings.
- Vite production build: not verifiable in this runtime because the installed Rolldown optional native binding is missing. On the Windows development machine, run `npm install` then `npm run build`.

## Backend note
The frontend expects the lead-note GET/POST routes listed above. The currently available frontend source confirms the opportunity-note routes, but the complete current backend source was not available in this editing workspace to verify whether the lead-note routes are already registered. If they are not, add equivalent Dataverse annotation endpoints before relying on lead-note persistence.
