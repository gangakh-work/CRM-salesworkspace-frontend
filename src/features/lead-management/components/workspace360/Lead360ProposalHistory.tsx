import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { formatCurrency } from '@/lib/formatters'
import type { ProposalHistoryItem } from '@/features/lead-management/types/lead.types'

const STATUS_VARIANT = {
  draft: 'neutral' as const,
  sent: 'info' as const,
  viewed: 'warning' as const,
  accepted: 'success' as const,
  rejected: 'error' as const,
}

export function Lead360ProposalHistory({
  proposals,
  leadStatus,
}: {
  proposals: ProposalHistoryItem[]
  leadStatus: string
}) {
  const items =
    proposals.length > 0
      ? proposals
      : ['proposal_sent', 'negotiation', 'converted'].includes(leadStatus)
        ? []
        : []

  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center">
        <Typography variant="caption" tone="muted">
          No proposals sent yet. Use the Proposal quick action to send one.
        </Typography>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((prop) => (
        <div key={prop.id} className="rounded-xl border border-border/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Typography variant="body" className="text-sm font-semibold">{prop.title}</Typography>
              <Typography variant="caption" tone="muted">Version {prop.version} · Sent {prop.sentDate}</Typography>
            </div>
            <Badge variant={STATUS_VARIANT[prop.status]} className="capitalize">{prop.status}</Badge>
          </div>
          <Typography variant="body" className="mt-2 font-bold">{formatCurrency(prop.value)}</Typography>
        </div>
      ))}
    </div>
  )
}
