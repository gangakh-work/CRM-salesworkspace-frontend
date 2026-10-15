# AI Copilot

Global intelligent workspace assistant for Sales Workspace. **Mock AI Provider only** — no Azure, GPT, backend, or APIs.

## Features

- **Global panel** — docked, floating, or collapsed via FAB
- **Resizable** docked panel (320–560px)
- **Conversation UI** — message bubbles, streaming, typing animation, markdown, code blocks, tables, cards, action buttons
- **Context awareness** — current page, lead, opportunity (mock via route + `useRegisterAiContext`)
- **Prompt history** — recent conversations, favorites, pinned prompts (localStorage)
- **Keyboard shortcuts** — `Ctrl+I` open Copilot, `Ctrl+K` command palette (with Copilot section)

## Mock Capabilities

Ask AI · Generate Summary · Draft Email · Create Follow-up · Meeting Summary · Lead Summary · Customer Summary · Proposal Summary · Opportunity Insights · Pipeline Insights · Next Best Action · Risk Analysis · Task Suggestions

## Usage

```tsx
import { useAiCopilot, useRegisterAiContext } from '@/features/ai-copilot'

// Register entity context on detail pages
useRegisterAiContext({
  pageLabel: 'Lead 360°',
  entityType: 'lead',
  entityId: lead.id,
  entityName: lead.name,
})

// Open programmatically
const { open, sendMessage } = useAiCopilot()
open({ prompt: 'Summarize this lead' })
```

## Architecture

```
AppProviders → AiCopilotProvider
AppShell → GlobalAiCopilot (docked aside + floating + mobile sheet + FAB)
providers/mock-ai-provider.ts → deterministic mock responses
```

## Future Integrations (placeholder badges)

Azure OpenAI · AI Search · Power Automate · Dataverse · SharePoint · Teams
