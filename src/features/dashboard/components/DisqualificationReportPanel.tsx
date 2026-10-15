import { AsyncBoundary } from '@/components/patterns/AsyncBoundary'
import { Typography } from '@/components/ui/typography'
import { useDisqualificationReportQuery } from '@/features/dashboard/hooks/useDashboardQueries'

function AnalysisList({
  title,
  items,
  emptyLabel,
}: {
  title: string
  items: { name: string; count: number }[]
  emptyLabel: string
}) {
  return (
    <div className="rounded-lg border p-3">
      <Typography variant="heading-m" className="mb-2 text-xs font-semibold uppercase tracking-wide">
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="caption" tone="muted">
          {emptyLabel}
        </Typography>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{item.name}</span>
              <span className="shrink-0 font-medium tabular-nums">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DisqualificationReportPanel() {
  const query = useDisqualificationReportQuery()

  return (
    <AsyncBoundary
      isLoading={query.isLoading || !query.data}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      loadingFallback={<Typography variant="caption" tone="muted">Loading report...</Typography>}
      errorTitle="Unable to load disqualification report"
    >
      {(() => {
        const report = query.data ?? {
          totalDisqualified: 0,
          topReasons: [],
          competitorAnalysis: [],
          industryAnalysis: [],
          sourceAnalysis: [],
        }

        return (
          <div className="space-y-4">
            <Typography variant="body" className="text-sm">
              Total disqualified leads:{' '}
              <span className="font-semibold tabular-nums">{report.totalDisqualified}</span>
            </Typography>
            <div className="grid gap-3 sm:grid-cols-2">
              <AnalysisList
                title="Top Reasons"
                items={report.topReasons.map((r) => ({ name: r.label, count: r.count }))}
                emptyLabel="No disqualification reasons recorded."
              />
              <AnalysisList
                title="By Industry"
                items={report.industryAnalysis}
                emptyLabel="No industry breakdown available."
              />
              <AnalysisList
                title="By Source"
                items={report.sourceAnalysis}
                emptyLabel="No source breakdown available."
              />
              <AnalysisList
                title="Competitors"
                items={report.competitorAnalysis}
                emptyLabel="No competitor data recorded."
              />
            </div>
          </div>
        )
      })()}
    </AsyncBoundary>
  )
}
