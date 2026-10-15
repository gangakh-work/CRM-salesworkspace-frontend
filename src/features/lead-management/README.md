# Lead Management Module

Enterprise lead management with **full lifecycle workflow** and **Lead 360° Workspace**. Mock data and local state only — no Dataverse, backend, or Azure OpenAI.

## Routes

| Route | View |
|-------|------|
| `/workspace/leads` | Lead list (table, kanban, cards, timeline) |
| `/workspace/leads/:id` | **Lead 360° Workspace** — premium three-column detail page |

## Lead 360° Workspace

Single-screen view replacing multiple CRM screens.

### Layout
- **Left** — Customer profile, company, contact details, LinkedIn placeholder, lead score, health score, risk indicator, workflow stepper
- **Center** — Overview, Timeline, Activities, Meetings, Emails, Notes, Tasks, Attachments, Related Opportunities, Proposal History
- **Right** — AI Assistant (mock): suggested actions, risk analysis, follow-ups, meeting summary, quick commands

### Quick Actions
Call · Email · Meeting · Task · Proposal · Convert · Disqualify · Share

## Workflow

```
Create Lead → Draft → Assigned → Contacted → Qualified → Proposal Sent → Negotiation → Converted
                                                                                    ↘ Disqualified
```

## Folder Structure

```
features/lead-management/
├── pages/
│   ├── LeadsModule.tsx          Route wrapper + provider
│   ├── Lead360Page.tsx          360° workspace page
│   └── LeadManagementListPage.tsx
├── components/
│   ├── workspace360/            360° layout panels
│   ├── workflow/                Stepper, quick actions, confirm
│   └── detail/                  Reusable tab panels
├── data/
│   ├── mock-leads.ts
│   ├── mock-lead-extras.ts
│   └── mock-lead-360.ts         Profile, AI insights, opportunities
├── hooks/useNavigateToLead.ts
└── lib/lead-workflow.ts
```
