import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import type { TopOpportunityRow, TopSalespersonRow } from '@/features/dashboard/api/DashboardApi'
import { formatKpiValue } from '@/features/dashboard/lib/dashboard-formatters'

interface ExecutiveLeaderboardProps {
  salespeople: TopSalespersonRow[]
}

export function ExecutiveLeaderboard({ salespeople }: ExecutiveLeaderboardProps) {
  if (!salespeople.length) {
    return (
      <Typography variant="caption" tone="muted">
        No salesperson data available.
      </Typography>
    )
  }

  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader className="border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" />
          <Typography variant="heading-m" className="text-sm font-semibold uppercase tracking-wide">
            Top Salespeople
          </Typography>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium text-right">Revenue</th>
                <th className="px-4 py-2.5 font-medium text-right">Pipeline</th>
                <th className="px-4 py-2.5 font-medium text-right">Won</th>
                <th className="px-4 py-2.5 font-medium text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {salespeople.map((person) => (
                <tr key={person.rank} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">{person.rank}</td>
                  <td className="px-3 py-2 font-medium">{person.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatKpiValue(person.revenue, 'currency')}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatKpiValue(person.pipeline, 'currency')}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{person.deals_won}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatKpiValue(person.win_rate, 'percent')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

interface ExecutiveTopOpportunitiesProps {
  opportunities: TopOpportunityRow[]
}

export function ExecutiveTopOpportunities({ opportunities }: ExecutiveTopOpportunitiesProps) {
  if (!opportunities.length) {
    return (
      <Typography variant="caption" tone="muted">
        No open opportunities found.
      </Typography>
    )
  }

  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader className="border-b border-border/50 pb-3">
        <Typography variant="heading-m" className="text-sm font-semibold uppercase tracking-wide">
          Top Opportunities
        </Typography>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Deal</th>
                <th className="px-4 py-2.5 font-medium">Stage</th>
                <th className="px-4 py-2.5 font-medium text-right">Value</th>
                <th className="px-4 py-2.5 font-medium text-right">Prob.</th>
                <th className="px-4 py-2.5 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">{opp.rank}</td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/workspace/opportunities/${opp.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {opp.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{opp.stage}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    {formatKpiValue(opp.value, 'currency')}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatKpiValue(opp.probability, 'percent')}</td>
                  <td className="px-3 py-2 text-muted-foreground">{opp.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
