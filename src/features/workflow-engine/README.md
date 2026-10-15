# Sales Workspace Workflow Engine

Reusable workflow engine powering enterprise sales processes. Workflow **templates** are defined in-app; instances start empty until a Dataverse workflow API is integrated.

## Routes

| Route | Description |
|-------|-------------|
| `/workspace/workflows` | Workflow dashboard and instance list |
| `/workspace/workflows/:id` | Workflow execution detail + builder |

## Business Workflows (10 Templates)

1. Lead Creation
2. Lead Qualification
3. Opportunity Creation
4. Proposal Review
5. Proposal Approval
6. Commercial Review
7. Won Process
8. Lost Process
9. Customer Follow-up
10. Meeting Preparation

## Capabilities

Every workflow instance supports:

- **Steps** — Sequential and branching step execution
- **Status** — draft, active, paused, completed, cancelled
- **Owner** — Per-step and workflow-level ownership
- **Progress** — Computed progress bar (0–100%)
- **Approvals** — Multi-approver with approve/reject + comments
- **Comments** — Threaded workflow comments
- **Timeline** — Audit history trail
- **Notifications** — In-app notification feed
- **Undo** — Toast-based undo for key actions
- **Audit History** — Immutable action log

## Reusable Components

```tsx
import {
  WorkflowCard,
  WorkflowStepper,
  WorkflowTimeline,
  WorkflowActivityFeed,
  ApprovalCard,
  WorkflowComments,
  WorkflowChecklist,
  ProgressIndicator,
  WorkflowBuilder,
  useWorkflowEngine,
} from '@/features/workflow-engine'
```

## Workflow Builder

Visual template designer with:

- Step type indicators (action, approval, decision, notification, checklist)
- Decision nodes with conditional branches
- Condition badges
- Reusable action mapping
- Progress bar preview

## Future Integrations (Placeholder)

Power Automate · Dataverse · Azure OpenAI · Teams · Outlook

## Architecture

```
workflow-engine/
├── types/           # Core type definitions
├── lib/             # Engine logic + 10 workflow templates
├── data/            # Mock workflow instances
├── context/         # WorkflowEngineProvider
├── components/      # Reusable UI components
├── pages/           # Module, list, detail
└── hooks/           # Navigation helpers
```

## Usage in Other Modules

The engine is designed to power leads, opportunities, and proposals. Import components and `useWorkflowEngine` to embed workflow UI in entity 360° pages when integration is requested.
