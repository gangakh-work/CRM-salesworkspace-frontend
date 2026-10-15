import type { CreateLeadInput } from '@/features/lead-management/domain/lead.schema'
import type { CreateLeadResultDto } from '@/features/lead-management/domain/lead.dto'
import { LeadApi } from '@/features/lead-management/api/LeadApi'
import type { Lead, LeadExtras } from '@/features/lead-management/types/lead.types'
import { queryKeys } from '@/infrastructure/api/query-keys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast as sonnerToast } from 'sonner'

export type LeadsListCache = { leads: Lead[]; leadExtras: Record<string, LeadExtras> }

/** Prepend a newly created lead into the React Query list cache (deduped by id). */
export function mergeLeadIntoListCache(
  cache: LeadsListCache | undefined,
  lead: Lead,
  extras: LeadExtras,
): LeadsListCache {
  if (!cache) return { leads: [lead], leadExtras: { [lead.id]: extras } }
  if (cache.leads.some((item) => item.id === lead.id)) return cache
  return {
    leads: [lead, ...cache.leads],
    leadExtras: { ...cache.leadExtras, [lead.id]: extras },
  }
}

/** Update an existing lead in the React Query list cache. */
export function updateLeadInListCache(
  cache: LeadsListCache | undefined,
  lead: Lead,
  extras: LeadExtras,
): LeadsListCache {
  if (!cache) return { leads: [lead], leadExtras: { [lead.id]: extras } }
  const exists = cache.leads.some((item) => item.id === lead.id)
  return {
    leads: exists
      ? cache.leads.map((item) => (item.id === lead.id ? lead : item))
      : [lead, ...cache.leads],
    leadExtras: { ...cache.leadExtras, [lead.id]: extras },
  }
}

/** Keep optimistically added leads when a server refetch has not caught up yet. */
export function mergeLeadsWithServer(local: Lead[], server: Lead[]): Lead[] {
  const serverIds = new Set(server.map((item) => item.id))
  const pendingLocal = local.filter((item) => !serverIds.has(item.id))
  return [...pendingLocal, ...server]
}

export function syncLeadDetailCache(
  queryClient: ReturnType<typeof useQueryClient>,
  lead: Lead,
  extras: LeadExtras,
) {
  queryClient.setQueryData(queryKeys.leads.detail(lead.id), { lead, extras })
  queryClient.setQueryData(queryKeys.leads.list(), (current: LeadsListCache | undefined) =>
    updateLeadInListCache(current, lead, extras),
  )
}

interface UseCreateLeadOptions {
  showToast?: boolean
}

function invalidateLiveCrmQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.crm.all }),
  ])
}

export function useLeadsQuery() {
  return useQuery({
    queryKey: queryKeys.leads.list(),
    queryFn: () => LeadApi.fetchLeads(),
    staleTime: 60_000,
    gcTime: 300_000,
  })
}

export function useLeadDetailQuery(leadId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.leads.detail(leadId ?? ''),
    queryFn: () => LeadApi.fetchLeadById(leadId!),
    enabled: Boolean(leadId),
    staleTime: 60_000,
    gcTime: 300_000,
  })
}

export function useCreateLead(options: UseCreateLeadOptions = {}) {
  const { showToast = true } = options
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      input,
      owner,
      ownerEmail,
    }: {
      input: CreateLeadInput
      owner: string
      ownerEmail?: string
    }) => {
      const result = await LeadApi.createLead(input, owner, ownerEmail)
      return {
        lead: result.lead,
        extras: result.extras,
        crmUrl: result.crmUrl,
        activity: {
          id: `activity-${result.lead.id}`,
          title: 'Lead Created',
          description: `${result.lead.name} — ${result.lead.company}`,
          timestamp: 'Just now',
          isoTimestamp: new Date().toISOString(),
          type: 'lead' as const,
          entityId: result.lead.id,
          entityType: 'lead' as const,
        },
      } satisfies CreateLeadResultDto
    },
    onSuccess: async (result) => {
      syncLeadDetailCache(queryClient, result.lead, result.extras)
      await invalidateLiveCrmQueries(queryClient)
      if (showToast) {
        sonnerToast.success('Lead created successfully', {
          description: `${result.lead.name} has been saved in Dynamics 365.`,
          action: result.crmUrl
            ? {
                label: 'Open in CRM',
                onClick: () => window.open(result.crmUrl, '_blank', 'noopener,noreferrer'),
              }
            : undefined,
        })
      }
    },
    onError: (error: Error) => {
      if (showToast) {
        sonnerToast.error('Failed to create lead', { description: error.message })
      }
    },
  })
}

export function useUpdateLead(options: { showToast?: boolean } = {}) {
  const { showToast = false } = options
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (lead: Lead) => LeadApi.updateLeadFromModel(lead),
    onSuccess: async (lead) => {
      queryClient.setQueryData(queryKeys.leads.detail(lead.id), (current: { lead: Lead; extras: LeadExtras } | undefined) =>
        current ? { ...current, lead } : current,
      )
      queryClient.setQueryData(queryKeys.leads.list(), (current: LeadsListCache | undefined) =>
        current
          ? {
              ...current,
              leads: current.leads.map((item) => (item.id === lead.id ? lead : item)),
            }
          : current,
      )
      await invalidateLiveCrmQueries(queryClient)
      if (showToast) {
        sonnerToast.success('Lead updated', { description: `${lead.name} saved to Dataverse.` })
      }
    },
    onError: (error: Error) => {
      if (showToast) {
        sonnerToast.error('Failed to update lead', { description: error.message })
      }
    },
  })
}
