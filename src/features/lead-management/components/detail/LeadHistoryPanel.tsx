import { LeadTimelinePanel } from '@/features/lead-management/components/detail/LeadTimelinePanel'
import type { LeadTimelineEvent } from '@/features/lead-management/types/lead.types'

const HISTORY_TYPES = new Set([
  'status_changed',
  'owner_changed',
  'converted',
  'disqualified',
  'lead_created',
])

export function LeadHistoryPanel({ events }: { events: LeadTimelineEvent[] }) {
  const history = events.filter((e) => HISTORY_TYPES.has(e.type))
  return <LeadTimelinePanel events={history} />
}
