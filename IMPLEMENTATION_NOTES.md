# Glassy CRM frontend updates

## Included
- Calendar meeting modal restyled to match the Glassy charcoal/glass theme, with full-width aligned fields and end-time validation.
- Lead detail page redesigned as a focused 360 view. Removed the raw Dataverse property dump and kept key sales/contact information only.
- Qualification wizard restyled with the same Glassy backdrop, glass panel, rounded controls and blue primary action.
- Opportunity detail page redesigned in the same theme. Added stage update control, Won/Lost actions, and Dataverse-backed Notes tab.
- Opportunities landing page changed from stage-based Kanban lanes to a flat opportunity list. Removed Import Excel and Download template controls, and removed stage labels from the list.

## Backend integration
The supplied backend already exposes:
- `GET /api/v1/dataverse/opportunities/{opportunity_id}/notes`
- `POST /api/v1/dataverse/opportunities/{opportunity_id}/notes`
The frontend uses these existing routes. Note payload fields are `subject` and `content`.

## Validation
- ESLint completed successfully with 0 errors and 0 warnings.
- A production Vite build could not be completed in this environment because the supplied dependency tree is missing the platform-specific Rolldown native binding (`@rolldown/binding-linux-x64-gnu`). This is an environment/dependency installation issue, not a reported JSX or ESLint failure.
- Reinstall frontend dependencies in your local Windows environment (`npm install`) and run `npm run build` before deployment.
