import { Clock, PenSquare, Star, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Typography } from '@/components/ui/typography'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { cn } from '@/lib/utils'

interface AiConversationHistoryProps {
  /** Called after a conversation is opened or a new one is started (closes overlays). */
  onSelected?: () => void
  /** Shows a close button (overlay usage). */
  onClose?: () => void
}

export function AiConversationHistory({ onSelected, onClose }: AiConversationHistoryProps = {}) {
  const {
    conversations,
    activeConversationId,
    loadConversation,
    newConversation,
    toggleFavorite,
    deleteConversation,
  } = useAiCopilot()

  // Only show the 50 most recent — no favorites section, no labels, clean like ChatGPT
  const recent = conversations.slice(0, 50)

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* Sidebar header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
        <Typography variant="body" className="text-sm font-semibold">
          {onClose ? 'Conversations' : 'Sales Assistant'}
        </Typography>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => { newConversation(); onSelected?.() }}
            aria-label="New conversation"
            title="New conversation"
          >
            <PenSquare className="size-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              aria-label="Close conversation history"
              title="Close"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Chat list */}
      <ScrollArea className="min-h-0 flex-1 px-2 py-2">
        {recent.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Typography variant="caption" tone="muted">
              No conversations yet
            </Typography>
          </div>
        ) : (
          <div className="space-y-0.5">
            {recent.map((conv) => (
              <HistoryItem
                key={conv.id}
                conv={conv}
                active={conv.id === activeConversationId}
                onSelect={() => { loadConversation(conv.id); onSelected?.() }}
                onFavorite={() => toggleFavorite(conv.id)}
                onDelete={() => deleteConversation(conv.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function HistoryItem({
  conv,
  active,
  onSelect,
  onFavorite,
  onDelete,
}: {
  conv: { id: string; title: string; updatedAt: string; isFavorite?: boolean }
  active: boolean
  onSelect: () => void
  onFavorite: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-1 rounded-lg px-2 py-2 transition-colors cursor-pointer',
        active
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-muted text-foreground',
      )}
    >
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect}>
        <p className="truncate text-sm font-medium leading-snug">{conv.title}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="size-2.5" />
          {new Date(conv.updatedAt).toLocaleDateString()}
        </p>
      </button>

      {/* Action buttons — only visible on row hover */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-6"
          onClick={(e) => { e.stopPropagation(); onFavorite() }}
          aria-label={conv.isFavorite ? 'Unfavourite' : 'Favourite'}
          title={conv.isFavorite ? 'Unfavourite' : 'Favourite'}
        >
          <Star className={cn('size-3', conv.isFavorite && 'fill-amber-400 text-amber-400')} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-6 hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          aria-label="Delete conversation"
          title="Delete"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  )
}
