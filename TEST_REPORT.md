# Test report — Glassy CRM refinements

## Completed checks
- Parsed all 43 frontend JavaScript/JSX source files with Babel parser: no syntax errors.
- Verified the Conversation Insights frontend calls the supplied backend endpoints:
  - `POST /api/v1/conversation-intelligence/analyze-transcript`
  - `POST /api/v1/conversation-intelligence/teams/transcript`
  - `GET /api/v1/conversation-intelligence/tracking/events`
- Verified the supplied backend package (`backend(2).zip`) already imports and registers `conversation_intelligence_router` in `backend/app/api/router.py`.
- Confirmed the Teams transcript endpoint and transcript-analysis endpoint are present in the supplied backend.
- Confirmed the Settings page is no longer exposed as an application route or sidebar item.
- Confirmed the app environment and login background CSS no longer reference the photographic background.

## Not completed in this environment
- A Vite production build could not be run. Dependency installation timed out, and the pre-existing Linux environment's Vite/Rolldown install is missing its platform-native binding.
- ESLint could not be run because the available dependency tree is incomplete (`@eslint/js` is missing).
- Entra, Dataverse and Microsoft Graph end-to-end tests require the user's tenant, running backend, secrets and Graph permissions.

## Local verification
From the `frontend_git` directory on the development machine:

```bash
npm ci
npm run build
npm run lint
npm run dev
```

## Conversation Insights requirements
- Transcript upload supports PDF, DOCX, TXT and VTT text files (maximum 5 MB, per the supplied backend route).
- Microsoft Teams transcript retrieval requires the backend Graph integration to be configured and the appropriate Microsoft Graph transcript permissions to be granted.
- Transcript extraction is review-only. It does not create lead or opportunity records automatically.
- Email engagement events are available only for campaign IDs that have previously been registered/tracked by the backend.
