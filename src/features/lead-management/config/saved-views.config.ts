import { DEFAULT_LEAD_FILTERS, type SavedView } from '@/features/lead-management/types/lead.types'

/** Saved lead views — filter presets (no embedded record data). */
export const SAVED_VIEWS: SavedView[] = [
  {
    id: 'all-leads',
    name: 'All Leads',
    filters: DEFAULT_LEAD_FILTERS,
    groupBy: 'none',
    sortColumn: 'createdDate',
    sortDirection: 'desc',
  },
  {
    id: 'my-high-priority',
    name: 'My High Priority',
    filters: { ...DEFAULT_LEAD_FILTERS, priority: ['high'] },
    groupBy: 'status',
    sortColumn: 'score',
    sortDirection: 'desc',
  },
  {
    id: 'qualified-pipeline',
    name: 'Qualified Pipeline',
    filters: { ...DEFAULT_LEAD_FILTERS, status: ['qualified'] },
    groupBy: 'owner',
    sortColumn: 'expectedRevenue',
    sortDirection: 'desc',
  },
  {
    id: 'needs-follow-up',
    name: 'Needs Follow-up Today',
    filters: DEFAULT_LEAD_FILTERS,
    groupBy: 'none',
    sortColumn: 'nextFollowUp',
    sortDirection: 'asc',
  },
]
