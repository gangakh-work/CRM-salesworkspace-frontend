import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { DisqualifyLeadInput } from '@/features/lead-management/domain/disqualification.schema'
import { leadDisqualificationService } from '@/features/lead-management/services/lead-disqualification.service'
import { queryKeys } from '@/infrastructure/api/query-keys'

interface UseDisqualifyLeadOptions {
  showToast?: boolean
}

export function useDisqualifyLead(options: UseDisqualifyLeadOptions = {}) {
  const { showToast = true } = options
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      leadId,
      input,
      disqualifiedBy,
    }: {
      leadId: string
      input: DisqualifyLeadInput
      disqualifiedBy: string
    }) => leadDisqualificationService.disqualifyLead(leadId, input, disqualifiedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.all })
    },
    onError: (error: Error) => {
      if (showToast) {
        void import('sonner').then(({ toast }) =>
          toast.error('Failed to disqualify lead', { description: error.message }),
        )
      }
    },
  })
}
