import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { formatCurrency } from '@/lib/formatters'
import type { RelatedOpportunity } from '@/features/lead-management/types/lead.types'

export function Lead360RelatedOpportunities({ opportunities }: { opportunities: RelatedOpportunity[] }) {
  if (!opportunities.length) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center">
        <Typography variant="caption" tone="muted">
          No related opportunities yet. Convert this lead to create one.
        </Typography>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {opportunities.map((opp) => (
        <div
          key={opp.id}
          className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-4 transition-colors hover:border-primary/30"
        >
          <div>
            <Typography variant="body" className="text-sm font-semibold">{opp.name}</Typography>
            <Typography variant="caption" tone="muted">{opp.id}</Typography>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="info">{opp.stage}</Badge>
              <Badge variant="secondary">{opp.probability}% probability</Badge>
            </div>
          </div>
          <div className="text-right">
            <Typography variant="body" className="font-bold">{formatCurrency(opp.value)}</Typography>
            <Typography variant="caption" tone="muted">Close {opp.closeDate}</Typography>
            <Button variant="ghost" size="sm" className="mt-2 h-7 gap-1 text-xs" asChild>
              <Link to={`/workspace/opportunities/${opp.id}`}>
                View <ExternalLink className="size-3" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
