import { Sparkles } from 'lucide-react'

import { Typography } from '@/components/ui/typography'
import { OpportunityAiPanel } from '@/features/opportunity-management/components/workspace360/Opportunity360Panels'
import type { Opportunity } from '@/features/opportunity-management/types/opportunity.types'

export function Opportunity360RightPanel({ opp }: { opp: Opportunity }) {
  return (
    <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-border/60 bg-gradient-to-b from-violet-500/5 to-background xl:flex">
      <div className="border-b border-border/60 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <Typography variant="heading-m">AI Copilot</Typography>
        </div>
        <Typography variant="caption" tone="muted">Context-aware deal intelligence</Typography>
      </div>
      <div className="p-4">
        <OpportunityAiPanel opp={opp} />
      </div>
    </aside>
  )
}

export function Opportunity360AiMobileSheet({
  opp,
  open,
  onOpenChange,
}: {
  opp: Opportunity
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-background p-4">
        <OpportunityAiPanel opp={opp} />
      </div>
    </div>
  )
}
