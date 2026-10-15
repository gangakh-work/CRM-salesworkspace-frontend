import { motion } from 'framer-motion'
import { useState } from 'react'
import { Bot, Copy, RotateCcw, User } from 'lucide-react'
import { toast as sonnerToast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MarkdownContent } from '@/features/ai-copilot/components/MarkdownContent'
import { AiTypingIndicator } from '@/features/ai-copilot/components/AiTypingIndicator'
import type { AiMessage } from '@/features/ai-copilot/types/copilot.types'
import { RecordGallery, type RecordCardAction, type RecordCardData } from '@/components/patterns/RecordGallery'
import { AiChatForm } from '@/features/ai-copilot/components/AiChatForm'
import { cn } from '@/lib/utils'

interface AiMessageBubbleProps {
  message: AiMessage
  onRetry?: () => void
  onAction?: (actionId: string, message: AiMessage) => void
  onFormSubmit?: (messageId: string, formId: string, values: Record<string, string>) => void | Promise<void>
  onFormCancel?: (messageId: string) => void
  /** Disable action buttons while a CRM operation is in progress. */
  actionsDisabled?: boolean
  onOpenCard?: (card: RecordCardData) => void
  cardAction?: (card: RecordCardData) => RecordCardAction | undefined
}

const TABLE_PREVIEW_ROWS = 8

export function AiMessageBubble({
  message,
  onRetry,
  onAction,
  onFormSubmit,
  onFormCancel,
  actionsDisabled,
  onOpenCard,
  cardAction,
}: AiMessageBubbleProps) {
  const hasCards = Boolean(message.cards?.length)
  const isUser = message.role === 'user'
  const [showAllRows, setShowAllRows] = useState(false)
  const tableRows = message.table?.rows ?? []
  const visibleRows = showAllRows ? tableRows : tableRows.slice(0, TABLE_PREVIEW_ROWS)
  const isStreaming = message.isStreaming && !message.content

  const copyContent = () => {
    navigator.clipboard?.writeText(message.content)
    sonnerToast.success('Copied to clipboard')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-primary/15 to-violet-500/15',
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4 text-primary" />}
      </div>

      <div className={cn('min-w-0 max-w-[90%] space-y-2', isUser && 'items-end', message.form?.steps?.length && 'flex-1 max-w-xl', hasCards && 'flex-1 max-w-3xl')}>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
            isUser
              ? 'rounded-tr-md bg-primary text-primary-foreground'
              : 'rounded-tl-md border border-border/60 bg-card/90',
          )}
        >
          {isStreaming ? (
            <AiTypingIndicator />
          ) : isUser ? (
            <p className="leading-relaxed">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}

          {message.form && !isUser && onFormSubmit && (
            <AiChatForm
              form={message.form}
              onSubmit={(values) => onFormSubmit(message.id, message.form!.id, values)}
              onCancel={onFormCancel ? () => onFormCancel(message.id) : undefined}
              disabled={message.isStreaming}
            />
          )}

          {message.card && !isUser && (
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{message.card.title}</p>
                {message.card.badge && <Badge variant="info">{message.card.badge}</Badge>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{message.card.description}</p>
              {message.card.metadata && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(message.card.metadata).map(([k, v]) => (
                    <span key={k} className="text-xs text-muted-foreground">{k}: <strong>{v}</strong></span>
                  ))}
                </div>
              )}
            </div>
          )}

          {hasCards && !isUser && (
            <div className="mt-3">
              <RecordGallery
                cards={message.cards!}
                compact
                onOpen={onOpenCard}
                primaryAction={cardAction}
                filters={message.cards!.length > 3}
                initialLimit={6}
              />
            </div>
          )}

          {message.table && !isUser && !hasCards && (
            <div className="mt-3 overflow-x-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {message.table.headers.map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1.5">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {tableRows.length > TABLE_PREVIEW_ROWS && (
                <button
                  type="button"
                  onClick={() => setShowAllRows((v) => !v)}
                  className="w-full border-t px-2 py-1.5 text-left text-xs font-medium text-primary hover:bg-muted/40"
                  aria-expanded={showAllRows}
                >
                  {showAllRows ? 'Show fewer' : `Show all ${tableRows.length}`}
                </button>
              )}
            </div>
          )}
        </div>

        {!isUser && !message.isStreaming && (
          <div className="flex flex-wrap items-center gap-1 px-1">
            {message.actions?.map((action) => (
              <Button
                key={action.id}
                variant={action.variant === 'primary' ? 'primary' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                disabled={actionsDisabled && action.id !== 'copy'}
                onClick={() => {
                  if (action.id === 'copy') copyContent()
                  else if (action.id === 'retry') onRetry?.()
                  else onAction?.(action.id, message)
                }}
              >
                {action.label}
              </Button>
            ))}
            <Button variant="ghost" size="icon-sm" className="size-7" onClick={copyContent} aria-label="Copy">
              <Copy className="size-3.5" />
            </Button>
            {onRetry && (
              <Button variant="ghost" size="icon-sm" className="size-7" onClick={onRetry} aria-label="Retry">
                <RotateCcw className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
