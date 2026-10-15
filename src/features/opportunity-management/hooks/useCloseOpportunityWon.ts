import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast as sonnerToast } from 'sonner'

import type { CloseAsWonInput } from '@/features/opportunity-management/domain/win.schema'
import { notifyOpportunityUpdated } from '@/features/opportunity-management/opportunity.events'
import {
  OpportunityWinError,
  opportunityWinService,
} from '@/features/opportunity-management/services/opportunity-win.service'
import { queryKeys } from '@/infrastructure/api/query-keys'

interface CloseWonOptions {
  showToast?: boolean
}

export function useCloseOpportunityWon(options: CloseWonOptions = {}) {
  const { showToast = true } = options
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      opportunityId,
      input,
      closedBy,
    }: {
      opportunityId: string
      input: CloseAsWonInput
      closedBy: string
    }) => opportunityWinService.closeAsWon(opportunityId, input, closedBy),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      notifyOpportunityUpdated()
      if (showToast) {
        sonnerToast.success('Opportunity closed as Won', {
          description: result.opportunity.name,
        })
      }
    },
    onError: (error: Error) => {
      if (showToast) {
        sonnerToast.error(
          error instanceof OpportunityWinError ? error.message : 'Failed to close as won',
        )
      }
    },
  })
}
