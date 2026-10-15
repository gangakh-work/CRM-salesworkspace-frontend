import {
  ChevronDown,
  ChevronUp,
  Pin,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'

export function AiSuggestedPrompts() {
  const {
    suggestedPrompts,
    pinnedPrompts,
    sendMessage,
    isGenerating,
  } = useAiCopilot()

  const [expanded, setExpanded] =
    useState(false)

  if (
    pinnedPrompts.length === 0 &&
    suggestedPrompts.length === 0
  ) {
    return null
  }

  return (
    <div className="shrink-0 border-t border-border/60 bg-background">
      {/* Header */}
      <div className="flex h-9 items-center justify-between px-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" />

          <span className="text-[11px] font-semibold text-muted-foreground">
            Quick actions
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-7"
          onClick={() =>
            setExpanded((value) => !value)
          }
          aria-label={
            expanded
              ? 'Minimize quick actions'
              : 'Expand quick actions'
          }
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronUp className="size-4" />
          )}
        </Button>
      </div>

      {/* PINNED */}
      {pinnedPrompts.length > 0 && (
        <div className="border-t border-border/40 px-3 py-2">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Pin className="size-3 text-muted-foreground" />

            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Pinned
            </span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto">
            {pinnedPrompts.map((p) => (
              <Button
                key={p.id}
                type="button"
                variant="outline"
                size="sm"
                className="
                  h-7
                  shrink-0
                  rounded-full
                  px-2.5
                  text-[11px]
                  whitespace-nowrap
                "
                disabled={isGenerating}
                onClick={() =>
                  void sendMessage(
                    p.prompt,
                    p.capability,
                  )
                }
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* SUGGESTED */}
      {expanded &&
        suggestedPrompts.length > 0 && (
          <div className="border-t border-border/40 px-3 py-2">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Sparkles className="size-3 text-muted-foreground" />

              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Suggested
              </span>
            </div>

            <div className="max-h-20 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isGenerating}
                    onClick={() =>
                      void sendMessage(p.prompt)
                    }
                    className="
                      rounded-full
                      border
                      border-border
                      bg-background
                      px-2.5
                      py-1
                      text-[11px]
                      transition-colors
                      hover:border-primary/40
                      hover:bg-primary/5
                      disabled:pointer-events-none
                      disabled:opacity-50
                    "
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export function AiContextBadge() {
  const { pageContext } = useAiCopilot()

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5 px-3 py-2">
      <Badge
        variant="secondary"
        className="text-[10px]"
      >
        {pageContext.pageLabel}
      </Badge>

      {pageContext.entityName && (
        <Badge
          variant="info"
          className="text-[10px] capitalize"
        >
          {pageContext.entityType}:{' '}
          {pageContext.entityName.replace(
            /-/g,
            ' ',
          )}
        </Badge>
      )}
    </div>
  )
}