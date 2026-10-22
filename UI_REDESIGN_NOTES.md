# Sales Workspace UI refresh

## What changed
- Added `public/logo.png` using the Sonata wordmark/piano-key logo from the supplied visual reference.
- Updated the login hero to use the Sonata brand asset, a more restrained navy/teal visual treatment, more balanced headline sizing, and compact feature cards.
- Updated the sign-in card styling while preserving the existing Microsoft SSO and mock-auth handlers.
- Updated the sidebar brand area to show the logo and application name.
- Reduced the dashboard greeting scale and vertical spacing so the greeting no longer dominates the page.
- Reworked the dashboard's Sales Intelligence panel into a compact, static premium panel.
- Refined dark-mode colors from near-black to a more legible navy/slate palette.
- Added shared UI polish and reduced-motion support in `src/styles/globals.css`.

## Run locally
1. Extract the archive.
2. Open `frontend` in a terminal.
3. Run `npm ci`.
4. Run `npm run dev`.

## Validation
The source changes were reviewed, but a full TypeScript/Vite build could not be completed in this environment because dependency installation did not finish. Run `npm ci` and `npm run build` locally to verify against your environment.

## Security
The local `.env` file is intentionally excluded from this archive. Keep your existing environment variables in your local project and never share production secrets.
