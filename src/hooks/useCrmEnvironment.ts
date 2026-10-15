import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/infrastructure/api/client'

interface StatusResponse {
  data?: {
    components?: Record<string, string>
  }
}

function orgHost(url: string): string {
  try {
    return new URL(url).hostname.replace('.crm5.dynamics.com', '').replace('.crm.dynamics.com', '')
  } catch {
    return url
  }
}

export function useCrmEnvironment() {
  return useQuery({
    queryKey: ['system', 'status'],
    queryFn: async () => {
      const { data } = await apiClient.get<StatusResponse>('/status')
      const dataverseUrl = data.data?.components?.dataverse_url?.trim() || ''
      const configured = Boolean(dataverseUrl) && dataverseUrl !== 'not_configured'
      return {
        dataverseUrl: configured ? dataverseUrl : '',
        orgLabel: configured ? orgHost(dataverseUrl) : 'Not configured',
        dataverseStatus: data.data?.components?.dataverse ?? 'unknown',
      }
    },
    staleTime: 5 * 60_000,
  })
}
