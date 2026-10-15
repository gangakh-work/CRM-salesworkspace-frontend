import {
  DEFAULT_OPPORTUNITY_FILTERS,
  type Opportunity,
  type SavedOpportunityView,
} from '@/features/opportunity-management/types/opportunity.types'
import { forecastEngineService } from '@/features/opportunity-management/services/forecast-engine.service'

/** Saved opportunity views — filter presets (no embedded record data). */
export const SAVED_VIEWS: SavedOpportunityView[] = [
  {
    id: 'all',
    name: 'All Opportunities',
    filters: DEFAULT_OPPORTUNITY_FILTERS,
    groupBy: 'none',
    sortColumn: 'expectedRevenue',
    sortDirection: 'desc',
  },
  {
    id: 'my-commit',
    name: 'My Commit Forecast',
    filters: { ...DEFAULT_OPPORTUNITY_FILTERS, forecastCategory: ['commit'] },
    groupBy: 'stage',
    sortColumn: 'closeDate',
    sortDirection: 'asc',
  },
  {
    id: 'closing-soon',
    name: 'Closing This Month',
    filters: DEFAULT_OPPORTUNITY_FILTERS,
    groupBy: 'owner',
    sortColumn: 'closeDate',
    sortDirection: 'asc',
  },
  {
    id: 'high-risk',
    name: 'High Risk Deals',
    filters: { ...DEFAULT_OPPORTUNITY_FILTERS, risk: ['high'] },
    groupBy: 'stage',
    sortColumn: 'expectedRevenue',
    sortDirection: 'desc',
  },
]

export function computeForecastMetrics(opportunities: Opportunity[]) {
  return forecastEngineService.computeForecastMetrics(opportunities)
}
