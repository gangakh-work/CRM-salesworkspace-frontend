import type { CloseAsLostInput } from '@/features/opportunity-management/domain/lost.schema'
import type { CloseAsWonInput } from '@/features/opportunity-management/domain/win.schema'
import type { TransitionStageInput } from '@/features/opportunity-management/domain/stage.schema'
import {
  STAGE_LABELS,
  STAGE_PROBABILITY,
  stageToKanban,
} from '@/features/opportunity-management/lib/opportunity-workflow'
import type {
  ForecastCategory,
  Opportunity,
  OpportunityActivity,
  OpportunityExtras,
  OpportunityPriority,
  OpportunityRisk,
  OpportunityStage,
  OpportunityStatus,
  OpportunityTimelineEvent,
} from '@/features/opportunity-management/types/opportunity.types'
import { apiClient } from '@/infrastructure/api/client'

const OPPORTUNITIES_BASE = '/dataverse/opportunities'

export interface DataverseOpportunityRecord {
  opportunityid: string
  name?: string
  estimatedvalue?: number
  actualvalue?: number
  closeprobability?: number
  estimatedclosedate?: string
  statecode?: number
  statuscode?: number
  stepname?: string
  description?: string
  createdon?: string
  modifiedon?: string
  actualclosedate?: string
  _ownerid_value?: string
  _customerid_value?: string
  _parentcontactid_value?: string
  _originatingleadid_value?: string
  [key: string]: unknown
}

interface DataverseOpportunityCollectionResponse {
  value?: DataverseOpportunityRecord[]
  [key: string]: unknown
}

export interface CreateOpportunityPayload {
  name: string
  customerName?: string
  estimatedvalue?: number
  estimatedclosedate?: string
  closeprobability?: number
  description?: string
  stepname?: string
  leadId?: string
  ownerName?: string
  ownerEmail?: string
}

export interface UpdateOpportunityPayload {
  name?: string
  estimatedvalue?: number
  estimatedclosedate?: string
  closeprobability?: number
  description?: string
  stepname?: string
  owner_name?: string
  on_hold?: boolean
}

const ON_HOLD_MARKER = /\n?<!--sales-workspace:on_hold=(true|false)-->/i

function stripOnHoldMarker(description: string | undefined): string | undefined {
  if (!description) return undefined
  const cleaned = description.replace(ON_HOLD_MARKER, '').trim()
  return cleaned || undefined
}

function parseOnHold(description: string | undefined): boolean {
  if (!description) return false
  const match = description.match(ON_HOLD_MARKER)
  return match?.[1]?.toLowerCase() === 'true'
}

function formattedValue(record: DataverseOpportunityRecord, field: string): string | undefined {
  const key = `${field}@OData.Community.Display.V1.FormattedValue`
  const value = record[key]
  return typeof value === 'string' ? value : undefined
}

function mapStatus(statecode?: number): OpportunityStatus {
  if (statecode === 1) return 'won'
  if (statecode === 2) return 'lost'
  return 'open'
}

function mapStage(record: DataverseOpportunityRecord): OpportunityStage {
  const status = mapStatus(record.statecode)
  if (status === 'won') return 'won'
  if (status === 'lost') return 'lost'

  const step = (record.stepname || formattedValue(record, 'statuscode') || '').toLowerCase()
  if (step.includes('qualif')) return 'qualification'
  if (step.includes('discover')) return 'discovery'
  if (step.includes('proposal')) return 'proposal'
  if (step.includes('commercial')) return 'commercial_review'
  if (step.includes('negotiat')) return 'negotiation'
  if (step.includes('legal') || step.includes('contract')) return 'legal_review'
  if (step.includes('prospect')) return 'prospect'
  return 'qualification'
}

function stageToStepName(stage: OpportunityStage): string {
  return STAGE_LABELS[stage]
}

function mapForecastCategory(stage: OpportunityStage, status: OpportunityStatus): ForecastCategory {
  if (status === 'won') return 'closed'
  if (status === 'lost') return 'omitted'
  if (stage === 'negotiation' || stage === 'legal_review') return 'commit'
  if (stage === 'proposal' || stage === 'commercial_review') return 'best_case'
  return 'pipeline'
}

export function mapDataverseOpportunityToOpportunity(record: DataverseOpportunityRecord): Opportunity {
  const stage = mapStage(record)
  const status = mapStatus(record.statecode)
  const modified = record.modifiedon?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  const closeDate = record.estimatedclosedate?.slice(0, 10) ?? modified
  const probability = record.closeprobability ?? STAGE_PROBABILITY[stage] ?? 10

  return {
    id: record.opportunityid,
    name: record.name?.trim() || 'Untitled Opportunity',
    customer: formattedValue(record, '_customerid_value') || '—',
    primaryContact: formattedValue(record, '_parentcontactid_value') || '—',
    contactEmail: '',
    owner: formattedValue(record, '_ownerid_value') ?? 'Unassigned',
    stage,
    probability,
    expectedRevenue: Number(record.estimatedvalue ?? 0),
    forecastCategory: mapForecastCategory(stage, status),
    closeDate,
    region: '—',
    industry: 'General',
    priority: 'medium' as OpportunityPriority,
    risk: 'medium' as OpportunityRisk,
    status,
    lastActivity: modified,
    kanbanColumn: stageToKanban(stage),
    currency: 'USD',
    description: stripOnHoldMarker(record.description?.trim()),
    leadId: record._originatingleadid_value,
    locked: status === 'won',
    closedDate: record.actualclosedate?.slice(0, 10),
    finalRevenue: status === 'won' ? Number(record.actualvalue ?? record.estimatedvalue ?? 0) : undefined,
    onHold: parseOnHold(record.description?.trim()),
  }
}

function buildTimeline(opp: Opportunity): OpportunityTimelineEvent[] {
  return [
    {
      id: `evt-${opp.id}`,
      type: 'created',
      title: 'Opportunity in Dataverse',
      description: `${opp.name} synced from Microsoft Dataverse.`,
      timestamp: new Date().toISOString(),
      actor: opp.owner,
    },
  ]
}

function buildDefaultExtras(opp: Opportunity): OpportunityExtras {
  return {
    timeline: buildTimeline(opp),
    activities: [],
    contacts: [],
    notes: [],
    documents: [],
    meetings: [],
    emails: [],
    commercials: {
      revenue: opp.expectedRevenue,
      cost: 0,
      margin: 0,
      discount: 0,
      currency: opp.currency,
      forecast: opp.forecastCategory,
    },
    proposals: [],
    stageHistory: [],
    auditRecords: [],
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
    'Dataverse opportunity request failed'
  return new Error(message)
}

function mapAnnotationToNote(record: Record<string, unknown>) {
  return {
    id: String(record.annotationid ?? ''),
    content: String(record.notetext ?? record.subject ?? ''),
    author: String(record['_createdby_value@OData.Community.Display.V1.FormattedValue'] ?? 'User'),
    createdAt: String(record.createdon ?? new Date().toISOString()).slice(0, 10),
  }
}

function mapDocument(record: Record<string, unknown>) {
  const sizeBytes = Number(record.filesize ?? 0)
  const sizeLabel = sizeBytes > 0 ? `${(sizeBytes / 1024 / 1024).toFixed(1)} MB` : '—'
  return {
    id: String(record.annotationid ?? ''),
    name: String(record.filename ?? record.subject ?? 'Document'),
    size: sizeLabel,
    uploadedAt: String(record.createdon ?? new Date().toISOString()).slice(0, 10),
  }
}

function mapTaskToActivity(record: Record<string, unknown>): OpportunityActivity {
  const statecode = record.statecode
  return {
    id: String(record.activityid ?? ''),
    type: 'task',
    subject: String(record.subject ?? 'Task'),
    status: statecode === 1 ? 'completed' : 'planned',
    owner: String(record['_ownerid_value@OData.Community.Display.V1.FormattedValue'] ?? 'Unassigned'),
    createdAt: String(record.createdon ?? new Date().toISOString()).slice(0, 10),
  }
}

async function enrichExtras(opp: Opportunity, extras: OpportunityExtras): Promise<OpportunityExtras> {
  try {
    const [notesRes, activitiesRes, documentsRes] = await Promise.all([
      apiClient.get<{ value?: Record<string, unknown>[] }>(`${OPPORTUNITIES_BASE}/${opp.id}/notes`),
      apiClient.get<{ tasks?: Record<string, unknown>[]; appointments?: Record<string, unknown>[] }>(
        `${OPPORTUNITIES_BASE}/${opp.id}/activities`,
      ),
      apiClient.get<{ value?: Record<string, unknown>[] }>(`${OPPORTUNITIES_BASE}/${opp.id}/documents`),
    ])

    const notes = (notesRes.data.value ?? [])
      .filter((item) => !item.isdocument)
      .map(mapAnnotationToNote)
    const tasks = (activitiesRes.data.tasks ?? []).map(mapTaskToActivity)
    const meetings = (activitiesRes.data.appointments ?? []).map((item) => ({
      id: String(item.activityid ?? ''),
      title: String(item.subject ?? 'Meeting'),
      scheduledAt: String(item.scheduledstart ?? ''),
      status: 'scheduled',
    }))
    const documents = (documentsRes.data.value ?? []).map(mapDocument)

    const timeline: OpportunityTimelineEvent[] = [...extras.timeline]
    for (const note of notes.slice(0, 5)) {
      timeline.unshift({
        id: `note-${note.id}`,
        type: 'note_added',
        title: 'Note Added',
        description: note.content.slice(0, 120),
        timestamp: note.createdAt,
        actor: note.author,
      })
    }

    return {
      ...extras,
      notes,
      activities: tasks,
      meetings,
      documents,
      timeline,
    }
  } catch {
    return extras
  }
}

export const OpportunityApi = {
  async fetchOpportunities(): Promise<{
    opportunities: Opportunity[]
    opportunityExtras: Record<string, OpportunityExtras>
  }> {
    try {
      const { data } = await apiClient.get<DataverseOpportunityCollectionResponse>(OPPORTUNITIES_BASE)
      const records = data.value ?? []
      const opportunities = records.map(mapDataverseOpportunityToOpportunity)
      const opportunityExtras = Object.fromEntries(
        opportunities.map((opp) => [opp.id, buildDefaultExtras(opp)]),
      )
      return { opportunities, opportunityExtras }
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async fetchOpportunityById(id: string): Promise<{ opportunity: Opportunity; extras: OpportunityExtras }> {
    try {
      const { data } = await apiClient.get<DataverseOpportunityRecord>(`${OPPORTUNITIES_BASE}/${id}`)
      const opportunity = mapDataverseOpportunityToOpportunity(data)
      const extras = await enrichExtras(opportunity, buildDefaultExtras(opportunity))
      return { opportunity, extras }
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async createOpportunity(
    payload: CreateOpportunityPayload,
  ): Promise<{ opportunity: Opportunity; extras: OpportunityExtras; crmUrl?: string }> {
    try {
      const body: Record<string, unknown> = {
        name: payload.name,
        customer_name: payload.customerName,
        estimatedvalue: payload.estimatedvalue,
        estimatedclosedate: payload.estimatedclosedate,
        closeprobability: payload.closeprobability,
        description: payload.description,
        lead_id: payload.leadId,
        owner_name: payload.ownerName,
        owner_email: payload.ownerEmail,
      }
      const { data } = await apiClient.post<DataverseOpportunityRecord>(OPPORTUNITIES_BASE, body)
      if (!data?.opportunityid) {
        throw new Error('Dataverse did not return the created opportunity')
      }
      const opportunity = mapDataverseOpportunityToOpportunity({
        ...data,
        name: data.name || payload.name,
      })
      if (payload.customerName && (!opportunity.customer || opportunity.customer === '—')) {
        opportunity.customer = payload.customerName
      }
      const crmUrl = typeof data.crm_url === 'string' ? data.crm_url : undefined
      if (payload.ownerName && (!opportunity.owner || opportunity.owner === 'Unassigned')) {
        opportunity.owner = payload.ownerName
      }
      return { opportunity, extras: buildDefaultExtras(opportunity), crmUrl }
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async deleteOpportunity(id: string): Promise<void> {
    try {
      await apiClient.delete(`${OPPORTUNITIES_BASE}/${id}`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async updateOpportunity(id: string, payload: UpdateOpportunityPayload): Promise<Opportunity> {
    try {
      const body = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined))
      const { data } = await apiClient.patch<DataverseOpportunityRecord>(`${OPPORTUNITIES_BASE}/${id}`, body)
      return mapDataverseOpportunityToOpportunity(data)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async updateOpportunityFromModel(opp: Opportunity): Promise<Opportunity> {
    return OpportunityApi.updateOpportunity(opp.id, {
      name: opp.name,
      estimatedvalue: opp.expectedRevenue,
      estimatedclosedate: opp.closeDate,
      closeprobability: opp.probability,
      description: opp.description,
      stepname: stageToStepName(opp.stage),
    })
  },

  async assignOwner(opportunityId: string, ownerName: string): Promise<Opportunity> {
    return OpportunityApi.updateOpportunity(opportunityId, { owner_name: ownerName })
  },

  async setOnHold(opportunityId: string, onHold: boolean): Promise<Opportunity> {
    return OpportunityApi.updateOpportunity(opportunityId, { on_hold: onHold })
  },

  async transitionStage(input: TransitionStageInput): Promise<Opportunity> {
    return OpportunityApi.updateOpportunity(input.opportunityId, {
      stepname: stageToStepName(input.targetStage),
      closeprobability: STAGE_PROBABILITY[input.targetStage],
    })
  },

  async closeAsWon(opportunityId: string, input: CloseAsWonInput): Promise<Opportunity> {
    try {
      await apiClient.post(`${OPPORTUNITIES_BASE}/${opportunityId}/win`, {
        final_revenue: Number(input.finalRevenue),
        actual_end: input.contractEndDate,
        description: `Won — ${input.decisionMaker}, delivery: ${input.deliveryOwner}`,
      })
      const { opportunity } = await OpportunityApi.fetchOpportunityById(opportunityId)
      return opportunity
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async closeAsLost(opportunityId: string, input: CloseAsLostInput): Promise<Opportunity> {
    try {
      await apiClient.post(`${OPPORTUNITIES_BASE}/${opportunityId}/lose`, {
        reason: input.lostReason,
        description: input.lostRemarks,
        competitor_name: input.competitorName,
        actual_end: new Date().toISOString().slice(0, 10),
      })
      const { opportunity } = await OpportunityApi.fetchOpportunityById(opportunityId)
      return opportunity
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async addNote(opportunityId: string, content: string): Promise<void> {
    try {
      await apiClient.post(`${OPPORTUNITIES_BASE}/${opportunityId}/notes`, { content })
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async createActivity(
    opportunityId: string,
    payload: { subject: string; activityType?: string; description?: string },
  ): Promise<void> {
    try {
      await apiClient.post(`${OPPORTUNITIES_BASE}/${opportunityId}/activities`, {
        subject: payload.subject,
        activity_type: payload.activityType ?? 'task',
        description: payload.description,
      })
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}

export type { UpdateOpportunityPayload as OpportunityUpdatePayload }
