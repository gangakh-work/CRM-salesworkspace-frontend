# SONATA CRM Sales Workspace — Frontend

This is the frontend-only package for the CRM Sales Workspace. It retains the existing React/Vite application, CRM API client, Microsoft Entra authentication, Microsoft Graph profile/photo retrieval, and the existing CRM pages.

## What changed in this update

- Reworked the Overview dashboard to match the supplied warm-brown glassmorphism reference.
- Central dashboard: Pipeline Value, Leads, Top Opportunities, Sales Activity, and Opportunity Wins.
- Right analytics rail: Leads count, Total Sales Pipeline value, and Opportunity Wins trend.
- Dashboard values are calculated from the existing CRM API responses where available; no fixed sample KPI values were introduced.
- Rebuilt the sign-in screen to match the same warm gold/brown glass theme.
- Removed all top navigation links/buttons from the login screen. The header contains only the SONATA brand.
- Kept Microsoft Entra sign-in and Microsoft Graph profile/photo retrieval.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- The existing FastAPI backend running separately

## Setup

1. Extract this folder.
2. Copy `.env.example` to `.env`.
3. Set the values for your environment:

   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   VITE_ENTRA_CLIENT_ID=your-application-client-id
   VITE_ENTRA_TENANT_ID=your-tenant-id
   VITE_ENTRA_REDIRECT_URI=http://localhost:5173
   ```

4. From this folder run:

   ```bash
   npm install
   npm run dev
   ```

5. Open `http://localhost:5173`.

## Build

```bash
npm run build
```

## Notes

- This package intentionally does not include `.env`, access tokens, client secrets, or the backend source.
- Email/password fields are included to match the supplied design. The current project authentication flow is Microsoft Entra; local email/password authentication is not configured in the existing backend. Submitting that form displays an explanatory message instead of pretending to authenticate.
- Microsoft sign-in requires a valid Entra app registration and the redirect URI above to be registered. Microsoft Graph photo/profile display requires the approved delegated `User.Read` scope and user consent/tenant approval.
- CRM records and dashboard data depend on the configured backend and Dataverse connection. If the backend is unavailable, the dashboard displays the API warning already present in the app.
