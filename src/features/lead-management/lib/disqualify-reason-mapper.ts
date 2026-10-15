import type { DisqualificationReason } from '@/features/lead-management/types/lead.types'

type DataverseDisqualifyReason = 'duplicate' | 'lost' | 'no_interest' | 'cannot_contact' | 'canceled'

export function mapToDataverseDisqualifyReason(reason: DisqualificationReason): DataverseDisqualifyReason {
  switch (reason) {
    case 'duplicate_lead':
      return 'duplicate'
    case 'lost_to_competitor':
      return 'lost'
    case 'invalid_contact':
      return 'cannot_contact'
    case 'project_cancelled':
    case 'other':
      return 'canceled'
    default:
      return 'no_interest'
  }
}
