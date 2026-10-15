import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { ArrowUpRight } from 'lucide-react'
import type { RecordCardData } from '@/components/patterns/RecordGallery'

import { ScrollArea } from '@/components/ui/scroll-area'
import { AiEntityInsights } from '@/features/ai-copilot/components/AiEntityInsights'
import { AiMessageBubble } from '@/features/ai-copilot/components/AiMessageBubble'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'

/** Quick-start suggestion cards shown in the empty state — like ChatGPT */
const STARTER_PROMPTS = [
  { id: 's1', label: 'Give me my sales brief for today' },
  { id: 's2', label: 'Show my overdue tasks' },
  { id: 's3', label: 'Which opportunities need attention?' },
  { id: 's4', label: 'Create an opportunity' },
]

const LEAD_PROMPTS = [
  { id: 'l1', label: 'What should I do next?' },
  { id: 'l2', label: 'Qualify this lead' },
  { id: 'l3', label: 'Convert this lead' },
  { id: 'l4', label: 'Disqualify this lead' },
]

const OPPORTUNITY_PROMPTS = [
  { id: 'o1', label: 'What should I do next?' },
  { id: 'o2', label: "What's missing in this opportunity?" },
  { id: 'o3', label: 'Draft an email' },
  { id: 'o4', label: 'Schedule a meeting' },
]

export function AiCopilotMessages() {
  const {
    messages,
    retryLast,
    pageContext,
    handleMessageAction,
    handleFormSubmit,
    handleFormCancel,
    sendMessage,
    isGenerating,
    mode,
    setMode,
  } = useAiCopilot()
  const navigate = useNavigate()

  const openCard = useCallback((card: RecordCardData) => {
    if (!card.href) return
    navigate(card.href)
    // In full screen the record would be hidden behind the assistant.
    if (mode === 'fullscreen') setMode('docked')
  }, [mode, navigate, setMode])

  const cardAction = useCallback((card: RecordCardData) => {
    if (card.kind === 'opportunity' && !['won', 'lost'].includes(card.status ?? '')) {
      return { label: 'Next step', onClick: () => void sendMessage(`What should I do next for ${card.title}?`) }
    }
    if (card.kind === 'lead' && card.status === 'qualified') {
      return { label: 'Convert', onClick: () => void handleMessageAction(`convert:${card.id}`) }
    }
    if (card.kind === 'lead' && card.badge !== 'Disqualified') {
      return { label: 'Qualify', onClick: () => void sendMessage(`Qualify ${card.id}`) }
    }
    return undefined
  }, [handleMessageAction, sendMessage])

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* ── Empty state ── */
  if (!messages.length) {
    const hasEntity = Boolean(pageContext.entityType && pageContext.entityName)

    return (
      <ScrollArea className="h-full min-h-0">
        <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">

          {/* Heading */}
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {hasEntity
              ? `Ask about ${pageContext.entityName}`
              : 'What can I help with?'}
          </h2>

          {/* Prompt list — editorial rows */}
          <ol className="w-full max-w-xl border-b border-foreground/15">
            {(pageContext.entityType === 'lead'
              ? LEAD_PROMPTS
              : pageContext.entityType === 'opportunity'
                ? OPPORTUNITY_PROMPTS
                : STARTER_PROMPTS
            ).map((p, i) => (
              <li key={p.id} className="border-t border-foreground/15 first:border-foreground">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => void sendMessage(p.label)}
                  className="group grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 px-2 py-3.5 text-left transition-colors duration-300 hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="font-mono text-[11px] tabular-nums opacity-60">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-semibold">{p.label}</span>
                  <ArrowUpRight className="size-4 opacity-40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                </button>
              </li>
            ))}
          </ol>

          {/* Entity insights (if a CRM record is in context) */}
          {hasEntity && (
            <div className="mt-8 w-full max-w-xl">
              <AiEntityInsights />
            </div>
          )}
        </div>
      </ScrollArea>
    )
  }

  /* ── Message list ── */
  return (
    <ScrollArea className="h-full min-h-0">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {messages.map((msg) => (
          <AiMessageBubble
            key={msg.id}
            message={msg}
            onRetry={msg.role === 'assistant' ? retryLast : undefined}
            onAction={(id) => { void handleMessageAction(id, msg.id) }}
            actionsDisabled={isGenerating}
            onOpenCard={openCard}
            cardAction={cardAction}
            onFormSubmit={(messageId, formId, values) => handleFormSubmit(messageId, formId, values)}
            onFormCancel={(messageId) => { void handleFormCancel(messageId) }}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
