# Glassy CRM – UI refinements

## Changes
- Restored **Download template** on the Opportunities page. It downloads a CSV template with opportunity name, customer, expected revenue, expected close date, owner, description and stage columns.
- Opportunity list avatars now show initials derived from the opportunity name instead of a generic briefcase icon.
- Updated Won/Lost actions to rounded glass pills and the open-details action to a circular glass control.
- Updated the opportunity stage selector with a translucent glass surface, focus treatment and dark option list.
- Wrapped the Contacts table in a bounded horizontal-scroll container and enabled long email/company/job-title values to wrap rather than overflow the workspace.
- Restored Settings from the previous Glassy frontend version. No settings functionality was removed.

## Validation
- ESLint: passed.
- Vite production build: attempted, but the available environment's Rolldown optional native binding is missing (`@rolldown/binding-linux-x64-gnu`). This is an environment dependency issue; the production build could not be confirmed here.

## Run locally
From the frontend folder:
1. `npm install`
2. `npm run dev`
3. `npm run build` to verify the production bundle on the development machine.

No `.env` file is included in this package.
