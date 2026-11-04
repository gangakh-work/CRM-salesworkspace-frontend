# Glassy CRM — integrated migration package

This package uses the Glassy Dashboard v8 UI as the visual base and includes the supplied FastAPI backend source under `backend/`.

## Decisions applied
- Preserve the Glassy dashboard layout.
- Replace Deals navigation with Opportunities.
- Keep the existing Contacts page.
- Add a dedicated AI Assistant page and backend chat request.
- Integrations page shows only Microsoft Teams and Outlook; both remain **Pending IT approval** rather than falsely showing as connected.
- Keep the existing Calendar page/design.
- Add Microsoft Entra sign-in shell and Microsoft Graph profile display/photo retrieval.
- Leads and Opportunities attempt to load live records from the supplied backend; if the API is unavailable they fall back to sample data and show a notice.
- Knowledge Base and standalone Sales Agent pages are not added.
- Existing Settings/Support remain but still need a feature-by-feature audit before declaring all old functionality migrated.

## Frontend setup
1. Install Node.js 20.19+ or 22.12+ (Vite 8 requirement).
2. Copy `.env.example` to `.env`.
3. Set `VITE_API_BASE_URL` to the backend API base, normally `http://localhost:8000/api/v1`.
4. Set `VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_TENANT_ID`, and `VITE_ENTRA_REDIRECT_URI` using the app registration supplied by your IT team.
5. Run:
   ```bash
   npm install
   npm run dev
   ```

## Backend setup
The backend source is under `backend/`. Use its `requirements-deploy.txt` and the existing backend README/configuration files to create a clean virtual environment. Copy `backend/.env.example` to `backend/.env` and populate it locally with your approved values. **Real `.env` secrets from the supplied archive were intentionally not copied.**

Start using the backend's documented startup command. The app's API router is mounted at `/api/v1`.

## API routes identified in supplied backend
- `GET/POST /api/v1/dataverse/leads`
- `GET/POST /api/v1/dataverse/opportunities`
- `PATCH /api/v1/dataverse/opportunities/{opportunity_id}`
- `POST /api/v1/dataverse/opportunities/{opportunity_id}/win`
- `POST /api/v1/dataverse/opportunities/{opportunity_id}/lose`
- `GET /api/v1/ai/status`
- `POST /api/v1/ai/chat`
- `GET /api/v1/dataverse/crm/accounts`
- `GET /api/v1/dataverse/crm/contacts`
- Dashboard APIs are available under `/api/v1/dashboard`.

The frontend helper is `src/lib/api.js`.

## Microsoft 365 integration readiness
The Teams/Outlook UI is deliberately marked pending while delegated permissions are being reviewed. Live message reading/sending, email association, calendar events/meeting creation, and Teams chat actions still require approved Graph scopes, app registration configuration, backend integration endpoints, and end-to-end testing. The frontend sign-in requests basic delegated scopes (`User.Read`, `email`, `profile`) and attempts to retrieve `/me` and `/me/photo/$value`. It cannot bypass missing tenant consent or permissions.

## Important verification status
This is an integration work package, not a claim that every workflow is already production-ready. The backend source includes protected endpoints and environment-specific dependencies; test with your actual tenant and Dataverse environment. The previous frontend has additional workflows (qualification/disqualification, conversion, stage management, won/lost, notes/activities, dashboard/report modules, etc.). This package has not yet completed the full old-frontend feature migration. The next implementation pass should wire each selected operation and form to its matching backend schema and add tests before replacing your current frontend.

## Security
Never commit `.env` files, tokens, client secrets, or production credentials. Use the `.env.example` templates and configure secrets locally.

## Dashboard update (CRM-connected)
- Replaced the messaging/campaign dashboard cards with CRM-oriented KPIs, Leads, Top Opportunities, Sales Activity, Start My Day, and Opportunity Wins.
- Dashboard reads leads, opportunities, and KPI data from the existing FastAPI endpoints through `VITE_API_BASE_URL`.
- Microsoft Graph profile name, email, and profile photo are now exposed through the auth context and used in the dashboard/sidebar. The floating top-right account/sign-out pill is removed; Sign out is in the left sidebar account area.
- The right glass panel now contains sales-focused quick information and navigation rather than Contacts/Credits/Text widgets.
- Keep your existing `.env` file. Do not replace it with `.env.example`; confirm `VITE_API_BASE_URL`, `VITE_ENTRA_CLIENT_ID`, and `VITE_ENTRA_TENANT_ID` are set correctly.

Run from `Glassy_CRM_Integrated`:
```bash
npm install
npm run dev
```
The dashboard requires the FastAPI backend to be running. It displays an API warning if all dashboard data requests fail.
