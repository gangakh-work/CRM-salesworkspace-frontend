import { Typography } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { getLostReasonLabel } from '@/features/opportunity-management/config/lost-form.config'
import { formatCurrency } from '@/lib/formatters'
import type { Opportunity, OpportunityExtras } from '@/features/opportunity-management/types/opportunity.types'

export function OpportunityLostInfoPanel({
  opp,
  extras,
}: {
  opp: Opportunity
  extras: OpportunityExtras
}) {
  const analysis = extras.lostAnalysis
  const reason = opp.lostReason ?? analysis?.reason
  const reasonLabel = reason ? getLostReasonLabel(reason) : '—'

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <Typography variant="heading-m" className="text-destructive">Lost Opportunity</Typography>
        <Typography variant="caption" tone="muted" className="mt-1 block">
          Closed {opp.lostDate ?? opp.closeDate}
          {opp.lostBy ? ` by ${opp.lostBy}` : ''}
        </Typography>
        {opp.locked && (
          <Badge variant="neutral" className="mt-2">Locked</Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard label="Lost Reason" value={reasonLabel} />
        <InfoCard
          label="Lost Revenue"
          value={formatCurrency(
            analysis?.lostRevenue ?? opp.expectedRevenue,
            opp.currency,
          )}
        />
        <InfoCard label="Competitor" value={opp.competitorName ?? analysis?.competitorName ?? '—'} />
        <InfoCard label="Competitor Solution" value={opp.competitorSolution ?? analysis?.competitorSolution ?? '—'} />
        <InfoCard label="Price Difference" value={opp.priceDifference ?? analysis?.priceDifference ?? '—'} />
        <InfoCard label="Industry" value={opp.industry} />
        <InfoCard label="Region" value={opp.region} />
      </div>

      {(opp.lostRemarks ?? analysis?.remarks) && (
        <div className="rounded-xl border border-border/60 p-4">
          <Typography variant="caption" tone="muted">Remarks</Typography>
          <Typography variant="body" className="mt-1 text-sm">
            {opp.lostRemarks ?? analysis?.remarks}
          </Typography>
        </div>
      )}

      <div className="rounded-xl border border-border/60 p-4">
        <Typography variant="caption" tone="muted">Future Follow-up</Typography>
        {opp.willRevisit ?? analysis?.willRevisit ? (
          <div className="mt-2 space-y-1">
            <Typography variant="body" className="text-sm font-medium">Revisit planned</Typography>
            <Typography variant="caption" tone="muted">
              {opp.followUpDate ?? analysis?.followUpDate} · {opp.followUpOwner ?? analysis?.followUpOwner}
            </Typography>
          </div>
        ) : (
          <Typography variant="body" className="mt-1 text-sm">No follow-up planned</Typography>
        )}
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <Typography variant="caption" tone="muted">{label}</Typography>
      <Typography variant="body" className="mt-1 text-sm font-medium">{value}</Typography>
    </div>
  )
}
