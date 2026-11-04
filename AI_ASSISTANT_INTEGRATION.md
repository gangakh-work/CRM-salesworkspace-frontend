# Glassy AI Assistant integration

This frontend update connects the existing Glassy AI Assistant page to the Sales Agent endpoints already present in the backend. No backend source files are changed.

## What is connected

- Natural-language CRM commands: `POST /ai/agent/command`
- Dynamic in-chat forms: `POST /ai/agent/form`
- Confirm/cancel pending CRM actions: `POST /ai/agent/confirm/{token}` and `POST /ai/agent/cancel/{token}`
- In-chat document extraction: `POST /ai/agent/upload`
- General AI fallback: `POST /ai/chat`
- AI capabilities: `POST /ai/capabilities/{capability}`
- Conversation list/detail/delete: `GET /ai/conversations`, `GET /ai/conversations/{id}`, `DELETE /ai/conversations/{id}`
- Generated document download: `GET /ai/agent/documents/{id}/download`

The agent requests send both the Microsoft backend bearer token and `X-Sales-User-Email`, as expected by the existing Sales Agent API.

## Conversational actions

The page renders backend-provided forms, wizard steps, validation, review rows, confirmation checkboxes, action buttons and result tables/cards. It supports natural-language commands for lead creation, lookup, update, qualification, disqualification and conversion; opportunity creation, lookup, update, Won and Lost; and task, email, meeting and sales-intelligence workflows implemented by the backend.

Successful CRM actions dispatch `crm:assistant-data-changed` so existing pages can refresh their CRM queries.

## Uploads

The assistant sends PDF, DOCX, TXT, MD, CSV, XLSX and XLS files to `/ai/agent/upload` and appends extracted text to the user's prompt. The backend enforces its 10 MB upload limit. The original file is not permanently stored by that endpoint.

## Configuration

Keep the existing local `.env` file. Ensure `VITE_API_BASE_URL` points to the backend API root (normally `http://localhost:8000/api/v1`) and the existing Entra settings (`VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_TENANT_ID`, `VITE_MSAL_API_SCOPE`) are configured. Restart Vite after changing environment variables.

## Changed files

- `src/pages/Assistant.jsx`
- `src/lib/api.js`
- `src/styles/assistant.css` (new)

No other CRM page or backend file is modified by this assistant update.
