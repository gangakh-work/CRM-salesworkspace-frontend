import { Bot, FileText, Mail, Sparkles, Target } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { AsyncBoundary } from '@/components/patterns/AsyncBoundary'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { SalesAssistantApi } from '@/features/ai-copilot/api/SalesAssistantApi'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import type { Lead } from '@/features/lead-management/types/lead.types'
import { queryKeys } from '@/infrastructure/api/query-keys'

const AI_ACTIONS = [
  { id: 'summary', label: 'Generate Summary', icon: Sparkles },
  { id: 'followup', label: 'Suggest Follow-up', icon: Target },
  { id: 'score', label: 'Predict Score', icon: Bot },
  { id: 'email', label: 'Draft Email', icon: Mail },
]

export function LeadAiPanel({ lead }: { lead: Lead }) {
  const { open } = useAiCopilot()
  const summaryQuery = useQuery({
    queryKey: queryKeys.ai.leadSummary(lead.id),
    queryFn: () => SalesAssistantApi.fetchLeadAiSummary(lead.id),
    staleTime: 60_000,
  })

  return (
    <div className="space-y-4">
      <Typography variant="caption" tone="muted">
        AI insights powered by Sales Assistant and live Dataverse lead data.
      </Typography>
      <div className="grid gap-3 sm:grid-cols-2">
        {AI_ACTIONS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="outline"
            className="h-auto justify-start gap-3 p-4"
            onClick={() => open({ prompt: `${label} for ${lead.name} at ${lead.company}` })}
          >
            <Icon className="size-5 text-primary" />
            <span>{label}</span>
          </Button>
        ))}
      </div>
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <Typography variant="body" className="text-sm font-medium">AI Summary</Typography>
        </div>
        <AsyncBoundary
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
          error={summaryQuery.error}
          onRetry={() => void summaryQuery.refetch()}
          loadingFallback={
            <Typography variant="caption" tone="muted" className="mt-2">
              Loading summary from Sales Assistant…
            </Typography>
          }
          errorTitle="Unable to load AI summary"
        >
          <Typography variant="caption" tone="muted" className="mt-2 leading-relaxed">
            {summaryQuery.data?.summary}
          </Typography>
        </AsyncBoundary>
      </div>
    </div>
  )
}
