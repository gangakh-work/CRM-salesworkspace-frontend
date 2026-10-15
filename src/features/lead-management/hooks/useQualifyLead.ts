import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { QualifyLeadInput } from '@/features/lead-management/domain/qualification.schema'
import { leadQualificationService } from '@/features/lead-management/services/lead-qualification.service'
import { queryKeys } from '@/infrastructure/api/query-keys'

interface UseQualifyLeadOptions {
  showToast?: boolean
}

export function useQualifyLead(options: UseQualifyLeadOptions = {}) {
  const { showToast = true } = options
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      leadId,
      input,
      qualifiedBy,
    }: {
      leadId: string
      input: QualifyLeadInput
      qualifiedBy: string
    }) => leadQualificationService.qualifyLead(leadId, input, qualifiedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.all })
    },
    onError: (error: Error) => {
      if (showToast) {
        void import('sonner').then(({ toast }) =>
          toast.error('Failed to qualify lead', { description: error.message }),
        )
      }
    },
  })
}
