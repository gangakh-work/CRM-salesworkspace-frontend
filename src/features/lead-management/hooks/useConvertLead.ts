import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ConvertLeadInput } from '@/features/lead-management/domain/conversion.schema'
import { leadConversionService } from '@/features/lead-management/services/lead-conversion.service'
import { notifyOpportunityUpdated } from '@/features/opportunity-management/opportunity.events'
import { queryKeys } from '@/infrastructure/api/query-keys'

interface UseConvertLeadOptions {
  showToast?: boolean
}

export function useConvertLead(options: UseConvertLeadOptions = {}) {
  const { showToast = true } = options
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      leadId,
      input,
      convertedBy,
    }: {
      leadId: string
      input: ConvertLeadInput
      convertedBy: string
    }) => leadConversionService.convertLead(leadId, input, convertedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all })
      notifyOpportunityUpdated()
    },
    onError: (error: Error) => {
      if (showToast) {
        void import('sonner').then(({ toast }) =>
          toast.error('Failed to convert lead', { description: error.message }),
        )
      }
    },
  })
}
