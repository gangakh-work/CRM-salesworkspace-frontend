import { AiCopilotPanel } from '@/features/ai-copilot/components/AiCopilotPanel'

/** Direct /ai-assistant visits show usable content instead of an empty route. */
export function AiAssistantPage() {
  return (
    <section className="flex h-[calc(100dvh-8rem)] min-h-[420px] w-full overflow-hidden rounded-xl border border-border bg-background" aria-label="AI Assistant">
      <AiCopilotPanel resizable={false} chatGptLayout className="h-full w-full" />
    </section>
  )
}
