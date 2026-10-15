import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { AsyncBoundary } from '@/components/patterns/AsyncBoundary'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Typography } from '@/components/ui/typography'
import {
  useAiRecommendationsTableQuery,
  useRecentLeadsTableQuery,
  useRecentOpportunitiesTableQuery,
  useUpcomingActivitiesTableQuery,
} from '@/features/dashboard/hooks/useDashboardQueries'
import { formatCurrency, formatRelativeTime } from '@/lib/formatters'

function TableCard({
  title,
  isLoading,
  isError,
  error,
  onRetry,
  children,
  emptyMessage,
  hasRows,
}: {
  title: string
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
  children: ReactNode
  emptyMessage: string
  hasRows: boolean
}) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="p-5">
        <Typography variant="heading-m" className="mb-4 text-base">
          {title}
        </Typography>
        <AsyncBoundary
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={onRetry}
          loadingFallback={
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          }
          errorTitle={`Unable to load ${title}`}
        >
          {!hasRows ? (
            <Typography variant="caption" tone="muted">
              {emptyMessage}
            </Typography>
          ) : (
            children
          )}
        </AsyncBoundary>
      </CardContent>
    </Card>
  )
}

function RecentLeadsTable() {
  const query = useRecentLeadsTableQuery()
  const rows = query.data?.data ?? []

  return (
    <TableCard
      title="Recent Leads"
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      emptyMessage="No recent leads found in Dataverse."
      hasRows={rows.length > 0}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link to={`/workspace/leads/${row.id}`} className="font-medium text-primary hover:underline">
                  {row.name}
                </Link>
              </TableCell>
              <TableCell>{row.company}</TableCell>
              <TableCell>
                <Badge variant="outline">{row.status}</Badge>
              </TableCell>
              <TableCell>{row.owner}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  )
}

function RecentOpportunitiesTable() {
  const query = useRecentOpportunitiesTableQuery()
  const rows = query.data?.data ?? []

  return (
    <TableCard
      title="Recent Opportunities"
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      emptyMessage="No recent opportunities found in Dataverse."
      hasRows={rows.length > 0}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Opportunity</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.stage}</TableCell>
              <TableCell>{formatCurrency(row.value)}</TableCell>
              <TableCell>
                <Badge variant={row.status === 'Won' ? 'success' : row.status === 'Lost' ? 'error' : 'info'}>
                  {row.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  )
}

function UpcomingActivitiesTable() {
  const query = useUpcomingActivitiesTableQuery()
  const rows = query.data?.data ?? []

  return (
    <TableCard
      title="Upcoming Activities"
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      emptyMessage="No upcoming activities scheduled in Dataverse."
      hasRows={rows.length > 0}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Regarding</TableHead>
            <TableHead>When</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.subject}</TableCell>
              <TableCell>{row.regarding}</TableCell>
              <TableCell>
                {row.scheduled_start ? formatRelativeTime(row.scheduled_start) : '—'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{row.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  )
}

function AiRecommendationsTable() {
  const query = useAiRecommendationsTableQuery()
  const rows = query.data?.data ?? []

  return (
    <TableCard
      title="Latest AI Recommendations"
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      emptyMessage="No AI recommendations available for current leads."
      hasRows={rows.length > 0}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recommendation</TableHead>
            <TableHead>Lead</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div>
                  <Typography variant="body" className="text-sm font-medium">
                    {row.title}
                  </Typography>
                  <Typography variant="caption" tone="muted" className="line-clamp-2">
                    {row.description}
                  </Typography>
                </div>
              </TableCell>
              <TableCell>{row.lead_name}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    row.priority === 'high' ? 'error' : row.priority === 'medium' ? 'warning' : 'neutral'
                  }
                >
                  {row.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Link
                  to={`/workspace/leads/${row.lead_id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {row.action_label}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  )
}

export function DashboardTablesGrid() {
  return (
    <div className="space-y-4">
      <Typography variant="heading-m">Activity & Recommendations</Typography>
      <div className="grid gap-4 xl:grid-cols-2">
        <RecentLeadsTable />
        <RecentOpportunitiesTable />
        <UpcomingActivitiesTable />
        <AiRecommendationsTable />
      </div>
    </div>
  )
}
