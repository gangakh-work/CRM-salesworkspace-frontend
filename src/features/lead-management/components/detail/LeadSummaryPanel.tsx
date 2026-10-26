import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'

import { AsyncBoundary } from '@/components/patterns/AsyncBoundary'
import { Typography } from '@/components/ui/typography'
import { SalesAssistantApi } from '@/features/ai-copilot/api/SalesAssistantApi'
import { queryKeys } from '@/infrastructure/api/query-keys'

export function LeadSummaryPanel({ leadId }: { leadId: string }) {
  const summaryQuery = useQuery({
    queryKey: queryKeys.ai.leadSummary(leadId),
    queryFn: () => SalesAssistantApi.fetchLeadAiSummary(leadId),
    staleTime: 60_000,
  })

  return (
    <section className="space-y-3" aria-labelledby="lead-summary-title">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-muted-foreground" aria-hidden />
        <Typography id="lead-summary-title" variant="body" className="font-semibold">
          Lead summary
        </Typography>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <AsyncBoundary
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
          error={summaryQuery.error}
          onRetry={() => void summaryQuery.refetch()}
          loadingFallback={<Typography variant="caption" tone="muted">Loading the lead summary…</Typography>}
          errorTitle="Unable to load lead summary"
        >
          {summaryQuery.data?.summary ? (
            <Typography variant="body" className="text-sm leading-6">
              {summaryQuery.data.summary}
            </Typography>
          ) : (
            <Typography variant="body" tone="muted" className="text-sm leading-6">
              No summary is available for this lead yet.
            </Typography>
          )}
        </AsyncBoundary>
      </div>
    </section>
  )
}
