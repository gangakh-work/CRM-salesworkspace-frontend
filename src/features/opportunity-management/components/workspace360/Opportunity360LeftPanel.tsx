import { ArrowLeft, Building2, Calendar, DollarSign, ExternalLink, MapPin, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import {
  ForecastBadge,
  PriorityBadge,
  ProbabilityBadge,
  RiskBadge,
  StageBadge,
  StatusBadge,
} from '@/features/opportunity-management/components/OpportunityBadges'
import { formatPreviousStage } from '@/features/opportunity-management/components/detail/OpportunityStageHistoryPanel'
import { formatCurrency } from '@/lib/formatters'
import type { Opportunity } from '@/features/opportunity-management/types/opportunity.types'
import { queryKeys } from '@/infrastructure/api/query-keys'

function SourceLeadLink({ leadId }: { leadId: string }) {
  const { data } = useQuery({
    queryKey: queryKeys.leads.detail(leadId),
    queryFn: () =>
      import('@/features/lead-management/services/lead.service').then((m) =>
        m.leadService.getById(leadId),
      ),
    staleTime: 30_000,
  })

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <Typography variant="caption" tone="muted" className="mb-2 block uppercase tracking-wide">
        Source Lead
      </Typography>
      <Typography variant="body" className="text-sm font-medium">
        {data?.lead.name ?? 'Qualified Lead'}
      </Typography>
      <Typography variant="caption" tone="muted">
        {data?.lead.company ?? leadId}
      </Typography>
      <Button variant="ghost" size="sm" className="mt-2 h-7 gap-1 px-0 text-xs" asChild>
        <Link to={`/workspace/leads/${leadId}`}>
          View Lead 360 <ExternalLink className="size-3" />
        </Link>
      </Button>
    </div>
  )
}

export function Opportunity360BackLink() {
  return (
    <Link
      to="/workspace/opportunities"
      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
    >
      <ArrowLeft className="size-3.5" />
      Back to Opportunities
    </Link>
  )
}

export function Opportunity360LeftPanel({ opp }: { opp: Opportunity }) {
  return (
    <aside className="w-full border-b border-border/60 bg-card/40 xl:w-72 xl:border-b-0 xl:border-r">
      <div className="space-y-4 p-4 md:p-6">
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/10 to-violet-500/5 p-4">
          <Typography variant="heading-m">{opp.customer}</Typography>
          <Typography variant="caption" tone="muted">
            {opp.industry}
          </Typography>
          <div className="mt-3 flex flex-wrap gap-2">
            <StageBadge stage={opp.stage} />
            <StatusBadge status={opp.status} />
            {opp.onHold && <Badge variant="warning">On Hold</Badge>}
            {opp.locked && opp.status === 'won' && <Badge variant="neutral">Locked</Badge>}
            {opp.locked && opp.status === 'lost' && <Badge variant="neutral">Locked</Badge>}
          </div>
          {opp.previousStage && (
            <Typography variant="caption" tone="muted" className="mt-2 block">
              Previous: {formatPreviousStage(opp.previousStage)}
            </Typography>
          )}
          {opp.stageUpdatedAt && (
            <Typography variant="caption" tone="muted" className="mt-1 block">
              Updated {opp.stageUpdatedAt}
              {opp.stageUpdatedBy ? ` by ${opp.stageUpdatedBy}` : ''}
            </Typography>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="size-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{opp.primaryContact}</div>
              <div className="text-xs text-muted-foreground">{opp.contactEmail}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="size-4 text-muted-foreground" />
            <span>{opp.owner}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="size-4 text-muted-foreground" />
            <span>{opp.region}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="size-4 text-muted-foreground" />
            <span>Close {opp.closeDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="size-4 text-muted-foreground" />
            <span className="font-semibold">{formatCurrency(opp.expectedRevenue, opp.currency)}</span>
          </div>
        </div>

        {opp.leadId && <SourceLeadLink leadId={opp.leadId} />}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border/60 p-3 text-center">
            <ProbabilityBadge probability={opp.probability} />
            <Typography variant="caption" tone="muted" className="mt-1 block">
              Probability
            </Typography>
          </div>
          <div className="rounded-lg border border-border/60 p-3 text-center">
            <ForecastBadge category={opp.forecastCategory} />
            <Typography variant="caption" tone="muted" className="mt-1 block">
              Forecast
            </Typography>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <PriorityBadge priority={opp.priority} />
          <RiskBadge risk={opp.risk} />
          <Badge variant="secondary">{opp.currency}</Badge>
        </div>
      </div>
    </aside>
  )
}
