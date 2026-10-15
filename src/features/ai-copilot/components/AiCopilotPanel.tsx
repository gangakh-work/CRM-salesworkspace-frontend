import { useCallback, useRef, useState } from 'react'

import { AiSuggestedPrompts, AiContextBadge } from '@/features/ai-copilot/components/AiSuggestedPrompts'
import { AiConversationHistory } from '@/features/ai-copilot/components/AiConversationHistory'
import { AiCopilotHeader } from '@/features/ai-copilot/components/AiCopilotHeader'
import { AiCopilotInput } from '@/features/ai-copilot/components/AiCopilotInput'
import { AiCopilotMessages } from '@/features/ai-copilot/components/AiCopilotMessages'
import {
  AI_PANEL_MAX_WIDTH,
  AI_PANEL_MIN_WIDTH,
  useAiCopilot,
} from '@/features/ai-copilot/context/AiCopilotProvider'
import { cn } from '@/lib/utils'
import type { MouseEvent } from 'react'

interface AiCopilotPanelProps {
  className?: string
  resizable?: boolean
  /** When true, renders the fullscreen ChatGPT-style layout */
  chatGptLayout?: boolean
}

export function AiCopilotPanel({
  className,
  resizable = true,
  chatGptLayout = false,
}: AiCopilotPanelProps) {
  const { panelWidth, setPanelWidth } = useAiCopilot()
  // Full screen: history sidebar open by default on wide screens.
  // Narrow screens and docked/floating: opened on demand as an overlay.
  const [isWide] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true,
  )
  const [showHistory, setShowHistory] = useState(chatGptLayout && isWide)

  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const onResizeStart = useCallback(
    (e: MouseEvent) => {
      if (!resizable) return
      e.preventDefault()
      dragRef.current = { startX: e.clientX, startWidth: panelWidth }

      const onMove = (ev: globalThis.MouseEvent) => {
        if (!dragRef.current) return
        const delta = dragRef.current.startX - ev.clientX
        setPanelWidth(dragRef.current.startWidth + delta)
      }

      const onUp = () => {
        dragRef.current = null
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [panelWidth, setPanelWidth, resizable],
  )

  /* ----------------------------------------------------------------
     ChatGPT fullscreen layout:

     ┌──────────────────┬────────────────────────────────────────┐
     │  Chat history    │  Header: ← | □ | ✏ | ⤡ | … | ✕        │
     │  sidebar         ├────────────────────────────────────────┤
     │  260px           │  Messages (flex-1, scrollable)         │
     │  (togglable)     │                                        │
     │                  ├────────────────────────────────────────┤
     │                  │  Input  (centered, max-w-3xl)          │
     └──────────────────┴────────────────────────────────────────┘
  ---------------------------------------------------------------- */
  if (chatGptLayout) {
    return (
      <div className={cn('relative flex h-full min-h-0 w-full overflow-hidden bg-background', className)}>

        {/* Left: conversation history — inline sidebar on wide screens,
            slide-over on narrow screens (previously it was simply hidden). */}
        {showHistory && (
          <>
            <div className="hidden w-[260px] shrink-0 border-r border-border/40 lg:flex lg:flex-col">
              <AiConversationHistory />
            </div>
            <div className="absolute inset-0 z-40 flex lg:hidden">
              <div className="flex w-[min(300px,85vw)] flex-col border-r border-border/40 bg-background shadow-elevation-4">
                <AiConversationHistory
                  onSelected={() => setShowHistory(false)}
                  onClose={() => setShowHistory(false)}
                />
              </div>
              <button
                type="button"
                aria-label="Close conversation history"
                className="flex-1 bg-black/30"
                onClick={() => setShowHistory(false)}
              />
            </div>
          </>
        )}

        {/* Right: main chat column */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0">
            <AiCopilotHeader
              showHistory={showHistory}
              onToggleHistory={() => setShowHistory((v) => !v)}
            />
          </div>

          {/* Messages — takes all space */}
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <AiCopilotMessages />
          </div>

          {/* Input pinned to bottom, centered */}
          <div className="shrink-0 bg-background pb-6 pt-2">
            <AiCopilotInput />
          </div>
        </div>
      </div>
    )
  }

  /* ----------------------------------------------------------------
     Compact layout — docked / floating
  ---------------------------------------------------------------- */
  return (
    <div
      className={cn(
        'relative flex h-full min-h-0 flex-col overflow-hidden bg-background/95 backdrop-blur-xl',
        className,
      )}
      style={resizable ? { width: panelWidth } : undefined}
    >
      {resizable && (
        <button
          type="button"
          aria-label="Resize panel"
          className="absolute left-0 top-0 z-30 h-full w-1 cursor-col-resize hover:bg-primary/30"
          onMouseDown={onResizeStart}
        />
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
          <AiCopilotHeader
            showHistory={showHistory}
            onToggleHistory={() => setShowHistory((v) => !v)}
          />
        </div>
        {showHistory ? (
          // Docked / floating: history replaces the chat until a conversation is picked.
          <div className="min-h-0 flex-1 overflow-hidden">
            <AiConversationHistory
              onSelected={() => setShowHistory(false)}
              onClose={() => setShowHistory(false)}
            />
          </div>
        ) : (
          <>
            <div className="shrink-0">
              <AiContextBadge />
            </div>
            <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
              <AiCopilotMessages />
            </div>
            <div className="shrink-0">
              <AiSuggestedPrompts />
            </div>
            <div className="relative z-20 shrink-0 pb-3 pt-1">
              <AiCopilotInput />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export { AI_PANEL_MIN_WIDTH, AI_PANEL_MAX_WIDTH }
