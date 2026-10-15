import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { Fragment, useCallback, useRef, type MouseEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Typography } from '@/components/ui/typography'
import {
  ForecastBadge,
  PriorityBadge,
  ProbabilityBadge,
  RiskBadge,
  StageBadge,
  StatusBadge,
} from '@/features/opportunity-management/components/OpportunityBadges'
import { formatCurrency } from '@/lib/formatters'
import { useNavigateToOpportunity } from '@/features/opportunity-management/hooks/useNavigateToOpportunity'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import { formatStage } from '@/features/opportunity-management/lib/opportunity-workflow'
import { OPPORTUNITY_COLUMNS } from '@/features/opportunity-management/types/opportunity.types'
import type { Opportunity } from '@/features/opportunity-management/types/opportunity.types'
import { cn } from '@/lib/utils'

function getCellValue(opp: Opportunity, columnId: string): string {
  switch (columnId) {
    case 'name': return opp.name
    case 'customer': return opp.customer
    case 'primaryContact': return opp.primaryContact
    case 'owner': return opp.owner
    case 'stage': return formatStage(opp.stage)
    case 'probability': return `${opp.probability}%`
    case 'expectedRevenue': return formatCurrency(opp.expectedRevenue, opp.currency)
    case 'forecastCategory': return opp.forecastCategory
    case 'closeDate': return opp.closeDate
    case 'region': return opp.region
    case 'industry': return opp.industry
    case 'priority': return opp.priority
    case 'risk': return opp.risk
    case 'status': return opp.status
    case 'lastActivity': return opp.lastActivity
    default: return ''
  }
}

function ResizableHeader({
  columnId,
  label,
  width,
  sortable,
  sortColumn,
  sortDirection,
  onSort,
  onResize,
}: {
  columnId: string
  label: string
  width: number
  sortable?: boolean
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  onSort: () => void
  onResize: (width: number) => void
}) {
  const startX = useRef(0)
  const startWidth = useRef(width)

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      startX.current = e.clientX
      startWidth.current = width

      const onMove = (ev: globalThis.MouseEvent) => {
        onResize(Math.max(80, startWidth.current + (ev.clientX - startX.current)))
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [width, onResize],
  )

  return (
    <th
      className="relative sticky top-0 z-10 border-b bg-muted/80 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider backdrop-blur-sm"
      style={{ width, minWidth: width }}
    >
      <div className="flex items-center gap-1">
        {sortable ? (
          <button type="button" className="flex items-center gap-1 hover:text-primary" onClick={onSort}>
            {label}
            {sortColumn === columnId &&
              (sortDirection === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
          </button>
        ) : (
          label
        )}
      </div>
      <div
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
        onMouseDown={onMouseDown}
        role="separator"
        aria-orientation="vertical"
      />
    </th>
  )
}

export function OpportunityTable() {
  const {
    paginatedOpportunities,
    filteredOpportunities,
    visibleColumns,
    columnWidths,
    setColumnWidth,
    sortColumn,
    sortDirection,
    toggleSort,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    groupBy,
  } = useOpportunityManagement()
  const navigateToOpportunity = useNavigateToOpportunity()

  const dataColumns = OPPORTUNITY_COLUMNS.filter(
    (c) => c.id !== 'select' && visibleColumns.includes(c.id),
  )
  const pageIds = paginatedOpportunities.map((o) => o.id)
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))

  const renderRow = (opp: Opportunity) => (
    <tr
      key={opp.id}
      className={cn(
        'cursor-pointer border-b transition-colors hover:bg-muted/50',
        selectedIds.has(opp.id) && 'bg-primary/5',
      )}
      onClick={() => navigateToOpportunity(opp)}
    >
      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selectedIds.has(opp.id)}
          onCheckedChange={() => toggleSelect(opp.id)}
          aria-label={`Select ${opp.name}`}
        />
      </td>
      {dataColumns.map((col) => (
        <td key={col.id} className="px-3 py-2 text-sm" style={{ minWidth: columnWidths[col.id] ?? col.minWidth }}>
          {col.id === 'name' && <span className="font-medium">{opp.name}</span>}
          {col.id === 'stage' && <StageBadge stage={opp.stage} />}
          {col.id === 'probability' && <ProbabilityBadge probability={opp.probability} />}
          {col.id === 'forecastCategory' && <ForecastBadge category={opp.forecastCategory} />}
          {col.id === 'priority' && <PriorityBadge priority={opp.priority} />}
          {col.id === 'risk' && <RiskBadge risk={opp.risk} />}
          {col.id === 'status' && <StatusBadge status={opp.status} />}
          {!['name', 'stage', 'probability', 'forecastCategory', 'priority', 'risk', 'status'].includes(col.id) &&
            getCellValue(opp, col.id)}
        </td>
      ))}
    </tr>
  )

  const grouped =
    groupBy !== 'none'
      ? paginatedOpportunities.reduce<Record<string, Opportunity[]>>((acc, opp) => {
          const key =
            groupBy === 'stage'
              ? formatStage(opp.stage)
              : String(opp[groupBy as keyof Opportunity] ?? 'Other')
          acc[key] = acc[key] ?? []
          acc[key].push(opp)
          return acc
        }, {})
      : null

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="max-h-[calc(100vh-22rem)] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 z-10 w-12 border-b bg-muted/80 px-3 py-2 backdrop-blur-sm">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => (allSelected ? clearSelection() : selectAll(pageIds))}
                  aria-label="Select all"
                />
              </th>
              {dataColumns.map((col) => (
                <ResizableHeader
                  key={col.id}
                  columnId={col.id}
                  label={col.label}
                  width={columnWidths[col.id] ?? col.minWidth}
                  sortable={col.sortable}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => toggleSort(col.id)}
                  onResize={(w) => setColumnWidth(col.id, w)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped
              ? Object.entries(grouped).map(([group, rows]) => (
                  <Fragment key={group}>
                    <tr className="bg-muted/30">
                      <td colSpan={dataColumns.length + 1} className="px-3 py-2">
                        <Typography variant="caption" className="font-semibold uppercase">
                          {group} ({rows.length})
                        </Typography>
                      </td>
                    </tr>
                    {rows.map(renderRow)}
                  </Fragment>
                ))
              : paginatedOpportunities.map(renderRow)}
            {paginatedOpportunities.length === 0 && (
              <tr>
                <td colSpan={dataColumns.length + 1} className="py-16 text-center text-muted-foreground">
                  No opportunities match your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2">
        <Typography variant="caption" tone="muted">
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredOpportunities.length)} of{' '}
          {filteredOpportunities.length}
        </Typography>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Typography variant="caption">
            {page} / {totalPages}
          </Typography>
          <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
