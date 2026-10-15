import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast as sonnerToast } from 'sonner'

import type { CloseAsLostInput } from '@/features/opportunity-management/domain/lost.schema'
import { notifyOpportunityUpdated } from '@/features/opportunity-management/opportunity.events'
import {
  OpportunityLostError,
  opportunityLostService,
} from '@/features/opportunity-management/services/opportunity-lost.service'
import { queryKeys } from '@/infrastructure/api/query-keys'

interface CloseLostOptions {
  showToast?: boolean
}

export function useCloseOpportunityLost(options: CloseLostOptions = {}) {
  const { showToast = true } = options
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      opportunityId,
      input,
      lostBy,
    }: {
      opportunityId: string
      input: CloseAsLostInput
      lostBy: string
    }) => opportunityLostService.closeAsLost(opportunityId, input, lostBy),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      notifyOpportunityUpdated()
      if (showToast) {
        sonnerToast.success('Opportunity closed as Lost', {
          description: result.opportunity.name,
        })
      }
    },
    onError: (error: Error) => {
      if (showToast) {
        sonnerToast.error(
          error instanceof OpportunityLostError ? error.message : 'Failed to close as lost',
        )
      }
    },
  })
}
