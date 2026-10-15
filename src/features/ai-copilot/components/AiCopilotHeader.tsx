import {
  ArrowLeft,
  History,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PenSquare,
  PanelLeft,
  Sparkles,
  X,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import type { AiCopilotMode } from '@/features/ai-copilot/types/copilot.types'

interface AiCopilotHeaderProps {
  showHistory?: boolean
  onToggleHistory?: () => void
}

export function AiCopilotHeader({ showHistory, onToggleHistory }: AiCopilotHeaderProps) {
  const { close, setMode, mode, newConversation, clearConversation, pageContext } = useAiCopilot()

  const navigate = useNavigate()
  const location = useLocation()

  const setLayout = (layout: AiCopilotMode) => setMode(layout)

  const handleBackToCrm = () => {
    close()
    if (location.pathname.startsWith('/workspace')) return
    const crmPage =
      pageContext.page?.startsWith('/workspace') ? pageContext.page : '/workspace/leads'
    navigate(crmPage)
  }

  const isFullscreen = mode === 'fullscreen'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-background px-3">

      {/* ── Left side ── */}
      <div className="flex items-center gap-1">
        {/* Back to CRM — fullscreen only */}
        {isFullscreen && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleBackToCrm}
            aria-label="Back to CRM"
            title="Back to CRM"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}

        {/* Sidebar toggle — fullscreen only (toggles the history sidebar) */}
        {isFullscreen && onToggleHistory !== undefined && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleHistory}
            aria-label={showHistory ? 'Hide history' : 'Show history'}
            title={showHistory ? 'Hide history' : 'Show history'}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <PanelLeft className="size-4" />
          </Button>
        )}

        {/* Branding — compact modes only (no back button) */}
        {!isFullscreen && (
          <div className="flex items-center gap-2 px-1">
            <div className="relative flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-4 text-primary" />
              <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background bg-emerald-500" />
            </div>
            <span className="text-sm font-semibold">Sales Assistant</span>
          </div>
        )}
      </div>

      {/* ── Right side ── */}
      <div className="flex items-center gap-0.5">

        {/* Conversation history — docked / floating */}
        {!isFullscreen && onToggleHistory !== undefined && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleHistory}
            aria-label={showHistory ? 'Hide conversation history' : 'Show conversation history'}
            aria-pressed={showHistory}
            title="Conversation history"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <History className="size-4" />
          </Button>
        )}

        {/* New conversation — always */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={newConversation}
          aria-label="New conversation"
          title="New conversation"
          className="size-8 text-muted-foreground hover:text-foreground"
        >
          <PenSquare className="size-4" />
        </Button>

        {/* Maximize — docked / floating → goes fullscreen */}
        {!isFullscreen && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setLayout('fullscreen')}
            aria-label="Open full screen"
            title="Open full screen"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <Maximize2 className="size-4" />
          </Button>
        )}

        {/* Minimize — fullscreen → goes back to docked */}
        {isFullscreen && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setLayout('docked')}
            aria-label="Exit full screen"
            title="Exit full screen"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <Minimize2 className="size-4" />
          </Button>
        )}

        {/* More options (...) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="More options"
              title="More options"
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => setLayout('docked')}>
              Docked panel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLayout('floating')}>
              Floating panel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLayout('fullscreen')}>
              Full screen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={newConversation}>New conversation</DropdownMenuItem>
            <DropdownMenuItem onClick={clearConversation}>Clear chat</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Close */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={close}
          aria-label="Close"
          title="Close"
          className="size-8 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </Button>
      </div>
    </header>
  )
}
