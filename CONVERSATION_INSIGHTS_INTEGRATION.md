# Conversation Insights integration

The frontend Conversation Insights page now uses the Conversation Intelligence endpoints already present in the supplied backend (`backend/app/api/v1/conversation_intelligence.py`).

## Connected endpoints

All requests use the existing authenticated API client / Microsoft Entra backend token.

- `POST /api/v1/conversation-intelligence/analyze-transcript` — upload and analyze PDF, DOCX or text transcripts.
- `POST /api/v1/conversation-intelligence/teams/transcript` — list available Teams transcripts when `transcript_id` is omitted; analyze the selected transcript when it is supplied.
- `GET /api/v1/conversation-intelligence/tracking/events?campaign_id=...` — retrieve recorded email open/click events.

The supplied backend's `app/api/router.py` already imports and registers `conversation_intelligence_router`; no additional router registration is required for that backend package.

## Microsoft Teams requirements

The Teams transcript flow depends on the backend Graph integration (`GraphDelivery`) being configured and having the required Microsoft Graph transcript permissions. The UI does not simulate meetings or fabricate transcript data. If the backend returns a permission/configuration error, it is shown in the page.

## Review and CRM writes

Transcript extraction is review-only. The backend explicitly returns `review_required: true` and does not create leads or opportunities automatically. The frontend displays the extracted summary, customer needs, pain points, objections, commitments, next steps, proposed lead/opportunity fields, missing fields and evidence for review.

## Supported transcript formats

The backend supplied in `backend(2).zip` extracts PDF and DOCX, and treats other supported text-based uploads (including TXT/VTT) as UTF-8 text. Maximum upload size is 5 MB. XLSX is not advertised by this frontend because the supplied backend route does not currently parse spreadsheet uploads.
