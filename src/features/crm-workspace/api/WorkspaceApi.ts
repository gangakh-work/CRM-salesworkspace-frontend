import type { WorkspaceRecord, WorkspaceTabId } from '@/features/crm-workspace/types/workspace.types'
import { LeadApi } from '@/features/lead-management/api/LeadApi'
import { OpportunityApi } from '@/features/opportunity-management/api/OpportunityApi'
import { apiClient } from '@/infrastructure/api/client'

const CRM_BASE = '/dataverse/crm'

interface WorkspaceRecordApiRow {
  id: string
  title: string
  subtitle: string
  status: string
  value?: number | null
  owner: string
  date: string
  due_date?: string | null
  priority?: string | null
  tags?: string[]
  kanban_column?: string | null
  email?: string | null
  phone?: string | null
  company?: string | null
}

interface WorkspaceRecordsApiResponse {
  data: WorkspaceRecordApiRow[]
  total: number
}

export interface CrmFilterOptions {
  owners: string[]
  regions: string[]
  industries: string[]
  sources: string[]
  countries: string[]
}

function mapApiRow(row: WorkspaceRecordApiRow): WorkspaceRecord {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    status: row.status,
    value: row.value ?? undefined,
    owner: row.owner,
    date: row.date,
    dueDate: row.due_date ?? undefined,
    priority: (row.priority as WorkspaceRecord['priority']) ?? undefined,
    tags: row.tags,
    kanbanColumn: row.kanban_column ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    company: row.company ?? undefined,
  }
}

function mapLeadToWorkspaceRecord(lead: Awaited<ReturnType<typeof LeadApi.fetchLeads>>['leads'][number]): WorkspaceRecord {
  return {
    id: lead.id,
    title: lead.name,
    subtitle: lead.company,
    status: lead.status,
    value: lead.expectedRevenue,
    owner: lead.owner,
    date: lead.lastActivity,
    priority: lead.priority,
    tags: [lead.source, lead.industry].filter(Boolean),
    kanbanColumn: lead.kanbanColumn,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
  }
}

function mapOpportunityToWorkspaceRecord(
  opp: Awaited<ReturnType<typeof OpportunityApi.fetchOpportunities>>['opportunities'][number],
): WorkspaceRecord {
  return {
    id: opp.id,
    title: opp.name,
    subtitle: opp.customer,
    status: opp.status,
    value: opp.expectedRevenue,
    owner: opp.owner,
    date: opp.lastActivity,
    priority: opp.priority,
    tags: [opp.region, opp.industry].filter(Boolean),
    kanbanColumn: opp.kanbanColumn,
    company: opp.customer,
    email: opp.contactEmail,
  }
}

async function fetchTabRecords(tab: WorkspaceTabId): Promise<WorkspaceRecord[]> {
  switch (tab) {
    case 'leads': {
      const { leads } = await LeadApi.fetchLeads()
      return leads.map(mapLeadToWorkspaceRecord)
    }
    case 'opportunities': {
      const { opportunities } = await OpportunityApi.fetchOpportunities()
      return opportunities.map(mapOpportunityToWorkspaceRecord)
    }
    case 'customers': {
      const { data } = await apiClient.get<WorkspaceRecordsApiResponse>(`${CRM_BASE}/accounts`)
      return (data.data ?? []).map(mapApiRow)
    }
    case 'activities': {
      const { data } = await apiClient.get<WorkspaceRecordsApiResponse>(`${CRM_BASE}/activities`)
      return (data.data ?? []).map(mapApiRow)
    }
    case 'documents': {
      const { data } = await apiClient.get<WorkspaceRecordsApiResponse>(`${CRM_BASE}/documents`)
      return (data.data ?? []).map(mapApiRow)
    }
    case 'tasks': {
      const { data } = await apiClient.get<WorkspaceRecordsApiResponse>(`${CRM_BASE}/tasks`)
      return (data.data ?? []).map(mapApiRow)
    }
    case 'workflows':
    case 'proposals':
      return []
    default:
      return []
  }
}

function normalizeApiError(error: unknown): Error {
  const axiosError = error as {
    response?: { data?: { error?: { message?: string }; message?: string } }
    message?: string
  }
  const message =
    axiosError.response?.data?.error?.message ??
    axiosError.response?.data?.message ??
    axiosError.message ??
    'CRM workspace request failed'
  return new Error(message)
}

export const WorkspaceApi = {
  async fetchTabRecords(tab: WorkspaceTabId): Promise<WorkspaceRecord[]> {
    try {
      return await fetchTabRecords(tab)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async fetchFilterOptions(): Promise<CrmFilterOptions> {
    try {
      const { data } = await apiClient.get<{ data: CrmFilterOptions }>(`${CRM_BASE}/filter-options`)
      return data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
