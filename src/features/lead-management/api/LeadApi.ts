import type { CreateLeadInput } from '@/features/lead-management/domain/lead.schema'
import { workflowToKanban } from '@/features/lead-management/lib/lead-workflow'
import type {
  Lead,
  LeadExtras,
  LeadTimelineEvent,
  LeadWorkflowStatus,
} from '@/features/lead-management/types/lead.types'
import { apiClient } from '@/infrastructure/api/client'

const LEADS_BASE = '/dataverse/leads'

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface CreateLeadResultData {
  lead_id: string
  subject: string
  fullname: string
  company: string
  status: string
  crm_url: string
}

export interface DataverseLeadRecord {
  leadid: string
  fullname?: string
  subject?: string
  companyname?: string
  statuscode?: number
  statecode?: number
  emailaddress1?: string
  telephone1?: string
  mobilephone?: string
  firstname?: string
  lastname?: string
  jobtitle?: string
  description?: string
  createdon?: string
  modifiedon?: string
  _ownerid_value?: string

  [key: string]: unknown
}

interface DataverseLeadCollectionResponse {
  value?: DataverseLeadRecord[]

  [key: string]: unknown
}

export interface UpdateLeadPayload {
  subject?: string
  firstname?: string
  lastname?: string
  companyname?: string
  emailaddress1?: string
  telephone1?: string
  mobilephone?: string
  description?: string
  jobtitle?: string
  statuscode?: number
  owner_name?: string
}

export interface CreateLeadPayload {
  subject: string
  firstname: string
  lastname: string
  companyname: string
  emailaddress1: string
  telephone1: string
  description: string
  jobtitle: string
  estimated_amount: number
  owner_name?: string
  owner_email?: string
}

/** Map app workflow status to Dataverse open-lead statuscode. */
export function workflowStatusToStatusCode(
  status: LeadWorkflowStatus,
): number | null {
  const map: Partial<Record<LeadWorkflowStatus, number>> = {
    draft: 1,
    assigned: 1,
    contacted: 2,
    qualified: 3,
    proposal_sent: 3,
    negotiation: 3,
  }

  return map[status] ?? null
}

function formattedValue(
  record: DataverseLeadRecord,
  field: string,
): string | undefined {
  const key = `${field}@OData.Community.Display.V1.FormattedValue`
  const value = record[key]

  return typeof value === 'string' ? value : undefined
}

function mapStatus(
  statecode?: number,
  statuscode?: number,
): LeadWorkflowStatus {
  if (statecode === 1) return 'qualified'
  if (statecode === 2) return 'disqualified'
  if (statuscode === 2) return 'contacted'
  if (statuscode === 3) return 'qualified'

  return 'assigned'
}

export function mapDataverseLeadToLead(
  record: DataverseLeadRecord,
): Lead {
  const name =
    record.fullname?.trim() ||
    [record.firstname, record.lastname]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    'Unknown Lead'

  const status = mapStatus(
    record.statecode,
    record.statuscode,
  )

  const created =
    record.createdon?.slice(0, 10) ??
    new Date().toISOString().slice(0, 10)

  const modified =
    record.modifiedon?.slice(0, 10) ?? created

  return {
    id: record.leadid,
    name,
    company: record.companyname?.trim() || '—',
    industry: 'General',
    country: '—',
    owner:
      formattedValue(record, '_ownerid_value') ??
      'Unassigned',
    source: 'Dataverse',
    priority: 'medium',
    score: 50,
    status,
    createdDate: created,
    lastActivity: modified,
    nextFollowUp: modified,
    email: record.emailaddress1?.trim() || '',
    phone:
      record.telephone1?.trim() ||
      record.mobilephone?.trim() ||
      '',
    title: record.jobtitle?.trim() || '',
    description:
      record.description?.trim() || undefined,
    opportunityName:
      record.subject?.trim() || undefined,
    kanbanColumn: workflowToKanban(status),
  }
}

function buildExtrasForLead(
  lead: Lead,
): LeadExtras {
  const timeline: LeadTimelineEvent[] = [
    {
      id: `evt-${lead.id}`,
      type: 'lead_created',
      title: 'Lead in Dataverse',
      description: `${lead.name} synced from Microsoft Dataverse.`,
      timestamp: new Date().toISOString(),
      actor: lead.owner,
    },
  ]

  return {
    timeline,
    activities: [],
    notes: [],
    attachments: [],
    meetings: [],
    emails: [],
  }
}

function mapCreateInputToPayload(
  input: CreateLeadInput,
  owner?: string,
  ownerEmail?: string,
): CreateLeadPayload {
  const description =
    input.description?.trim() ||
    input.notes?.trim() ||
    input.opportunityName?.trim() ||
    `${input.firstName} ${input.lastName}`.trim()

  return {
    subject:
      input.opportunityName?.trim() ||
      `${input.firstName} ${input.lastName}`.trim(),

    firstname: input.firstName.trim(),
    lastname: input.lastName.trim(),
    companyname: input.companyName.trim(),
    emailaddress1: input.email.trim(),
    telephone1: input.phone.trim(),
    description,
    jobtitle: input.title.trim(),

    estimated_amount: Number(input.expectedRevenue) || 0,

    owner_name:
      owner?.trim() || undefined,

    owner_email:
      ownerEmail?.trim() || undefined,
  }
}

function mapLeadToUpdatePayload(
  lead: Lead,
): UpdateLeadPayload {
  const [
    firstName = '',
    ...rest
  ] = lead.name.split(' ')

  const lastName = rest.join(' ')

  return {
    subject:
      lead.opportunityName ??
      lead.description ??
      lead.name,

    firstname: firstName,
    lastname: lastName,
    companyname: lead.company,
    emailaddress1:
      lead.email || undefined,
    telephone1:
      lead.phone || undefined,
    description: lead.description,
    jobtitle:
      lead.title || undefined,
  }
}

function normalizeApiError(
  error: unknown,
): Error {
  const axiosError = error as {
    response?: {
      data?: {
        error?: {
          message?: string
          code?: string
          detail?: string
        }
        message?: string
        detail?: string
      }
      status?: number
    }
    message?: string
  }

  const responseData =
    axiosError.response?.data

  const message =
    responseData?.error?.message ??
    responseData?.message ??
    responseData?.detail ??
    axiosError.message ??
    'Dataverse request failed'

  return new Error(message)
}

export interface LeadDocumentExtractionResult {
  extracted: Record<string, unknown>
  source_document: string
  document_type: string
  message?: string
}

export const LeadApi = {
  async extractLeadDocument(
    file: File,
  ): Promise<LeadDocumentExtractionResult> {
    try {
      const formData = new FormData()

      formData.append('file', file)

      const { data } =
        await apiClient.post<LeadDocumentExtractionResult>(
          `${LEADS_BASE}/extract-document`,
          formData,
          {
            headers: {
              'Content-Type':
                'multipart/form-data',
            },
          },
        )

      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async fetchLeads(): Promise<{
    leads: Lead[]
    leadExtras: Record<string, LeadExtras>
  }> {
    try {
      const { data } =
        await apiClient.get<DataverseLeadCollectionResponse>(
          LEADS_BASE,
        )

      const records = data.value ?? []

      const leads =
        records.map(mapDataverseLeadToLead)

      const leadExtras =
        Object.fromEntries(
          leads.map((lead) => [
            lead.id,
            buildExtrasForLead(lead),
          ]),
        )

      return {
        leads,
        leadExtras,
      }
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async fetchLeadById(
    id: string,
  ): Promise<{
    lead: Lead
    extras: LeadExtras
  }> {
    try {
      const { data } =
        await apiClient.get<DataverseLeadRecord>(
          `${LEADS_BASE}/${id}`,
        )

      const lead =
        mapDataverseLeadToLead(data)

      return {
        lead,
        extras: buildExtrasForLead(lead),
      }
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async createLead(
    input: CreateLeadInput,
    owner: string,
    ownerEmail?: string,
  ): Promise<{
    lead: Lead
    extras: LeadExtras
    crmUrl: string
  }> {
    try {
      const { data } =
        await apiClient.post<
          ApiResponse<CreateLeadResultData>
        >(
          LEADS_BASE,
          mapCreateInputToPayload(
            input,
            owner,
            ownerEmail,
          ),
        )

      const created = data.data

      const today =
        new Date()
          .toISOString()
          .slice(0, 10)

      const lead: Lead = {
        id: created.lead_id,
        name:
          created.fullname ||
          `${input.firstName} ${input.lastName}`.trim(),

        company:
          created.company ||
          input.companyName ||
          '—',

        industry: input.industry,
        country: input.country,
        owner,
        source: input.source,
        priority: input.priority,
        score: 50,
        status: 'assigned',
        createdDate: today,
        lastActivity: today,
        nextFollowUp: today,
        email: input.email.trim(),
        phone: input.phone.trim(),
        title: input.title.trim(),

        description:
          input.description?.trim() ||
          input.notes?.trim() ||
          undefined,

        opportunityName:
          created.subject ||
          input.opportunityName?.trim() ||
          undefined,

        kanbanColumn:
          workflowToKanban('assigned'),
      }

      return {
        lead,
        extras: buildExtrasForLead(lead),
        crmUrl: created.crm_url,
      }
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async deleteLead(id: string): Promise<void> {
    try {
      await apiClient.delete(`${LEADS_BASE}/${id}`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async updateLead(
    id: string,
    payload: UpdateLeadPayload,
  ): Promise<Lead> {
    try {
      const body = Object.fromEntries(
        Object.entries(payload).filter(
          ([, value]) =>
            value !== undefined &&
            value !== '',
        ),
      )

      const { data } =
        await apiClient.patch<DataverseLeadRecord>(
          `${LEADS_BASE}/${id}`,
          body,
        )

      return mapDataverseLeadToLead(data)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async updateLeadFromModel(
    lead: Lead,
  ): Promise<Lead> {
    return LeadApi.updateLead(
      lead.id,
      mapLeadToUpdatePayload(lead),
    )
  },

  async updateLeadStatus(
    id: string,
    status: LeadWorkflowStatus,
  ): Promise<Lead> {
    const statuscode =
      workflowStatusToStatusCode(status)

    if (!statuscode) {
      throw new Error(
        `Status "${status}" must use qualify, disqualify, or convert workflow actions`,
      )
    }

    return LeadApi.updateLead(
      id,
      { statuscode },
    )
  },

  async assignLeadOwner(
    id: string,
    ownerName: string,
  ): Promise<Lead> {
    return LeadApi.updateLead(
      id,
      {
        owner_name: ownerName,
      },
    )
  },

  async qualifyLead(
    id: string,
    options?: {
      createAccount?: boolean
      createContact?: boolean
      createOpportunity?: boolean
    },
  ): Promise<{
    leadId: string
    opportunity?: Record<string, unknown>
  }> {
    try {
      const { data } =
        await apiClient.post<{
          lead_id: string
          opportunity?: Record<string, unknown>
        }>(
          `${LEADS_BASE}/${id}/qualify`,
          {
            create_account:
              options?.createAccount ?? true,

            create_contact:
              options?.createContact ?? true,

            create_opportunity:
              options?.createOpportunity ?? true,
          },
        )

      return {
        leadId: data.lead_id,
        opportunity:
          data.opportunity,
      }
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async disqualifyLead(
    id: string,
    reason:
      | 'duplicate'
      | 'lost'
      | 'no_interest'
      | 'cannot_contact'
      | 'canceled',
    comment?: string,
  ): Promise<{
    leadId: string
  }> {
    try {
      const { data } =
        await apiClient.post<{
          lead_id: string
        }>(
          `${LEADS_BASE}/${id}/disqualify`,
          {
            reason,
            comment:
              comment?.trim() ||
              undefined,
          },
        )

      return {
        leadId: data.lead_id,
      }
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}

export type {
  UpdateLeadPayload as LeadUpdatePayload,
}