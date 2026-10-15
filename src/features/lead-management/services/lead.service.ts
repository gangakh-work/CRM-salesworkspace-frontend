import type { CreateLeadResultDto } from '@/features/lead-management/domain/lead.dto'
import { LeadApi } from '@/features/lead-management/api/LeadApi'
import { createLeadSchema, type CreateLeadInput } from '@/features/lead-management/domain/lead.schema'
import type {
  DisqualificationReason,
  Lead,
  LeadDisqualificationData,
  LeadExtras,
  LeadQualificationRating,
} from '@/features/lead-management/types/lead.types'
import { formatDisqualificationReason } from '@/features/lead-management/config/disqualification-form.config'

export type CreateLeadResult = CreateLeadResultDto

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now()}-${idCounter}`
}

function buildActivity(lead: Lead) {
  return {
    id: nextId('activity'),
    title: 'Lead Created',
    description: `${lead.name} — ${lead.company}${lead.opportunityName ? ` · ${lead.opportunityName}` : ''}`,
    timestamp: 'Just now',
    isoTimestamp: new Date().toISOString(),
    type: 'lead' as const,
    entityId: lead.id,
    entityType: 'lead' as const,
  }
}

/** Lead operations backed by live Dataverse APIs. */
export class LeadService {
  async getAll(): Promise<{ leads: Lead[]; leadExtras: Record<string, LeadExtras> }> {
    return LeadApi.fetchLeads()
  }

  async getById(id: string): Promise<{ lead: Lead; extras: LeadExtras } | null> {
    try {
      return await LeadApi.fetchLeadById(id)
    } catch {
      return null
    }
  }

  async createLead(input: CreateLeadInput, owner: string, ownerEmail?: string): Promise<CreateLeadResult> {
    const parsed = createLeadSchema.parse(input)
    const { lead, extras, crmUrl } = await LeadApi.createLead(parsed, owner, ownerEmail)
    return { lead, extras, activity: buildActivity(lead), crmUrl }
  }

  async persistLeadUpdate(lead: Lead): Promise<Lead> {
    return LeadApi.updateLeadFromModel(lead)
  }

  async getActiveLeadCount(): Promise<number> {
    const { leads } = await LeadApi.fetchLeads()
    return leads.filter((l) => l.status !== 'disqualified' && l.status !== 'converted').length
  }

  async getQualifiedLeadCount(): Promise<number> {
    const { leads } = await LeadApi.fetchLeads()
    return leads.filter((l) => l.status === 'qualified').length
  }

  async getQualifiedPipelineValue(): Promise<number> {
    const { leads } = await LeadApi.fetchLeads()
    return leads
      .filter((l) => l.status === 'qualified')
      .reduce((sum, l) => sum + (l.expectedRevenue ?? 0), 0)
  }

  async getScoreDistribution(): Promise<Record<LeadQualificationRating, number>> {
    const { leads } = await LeadApi.fetchLeads()
    const dist: Record<LeadQualificationRating, number> = { hot: 0, warm: 0, cold: 0 }
    for (const lead of leads) {
      if (lead.qualificationRating) {
        dist[lead.qualificationRating] += 1
      }
    }
    return dist
  }

  async getDisqualifiedLeadCount(): Promise<number> {
    const { leads } = await LeadApi.fetchLeads()
    return leads.filter((l) => l.status === 'disqualified').length
  }

  async getLeadConversionRate(): Promise<number> {
    const { leads } = await LeadApi.fetchLeads()
    const converted = leads.filter((l) => l.status === 'converted').length
    const disqualified = leads.filter((l) => l.status === 'disqualified').length
    const decided = converted + disqualified
    if (decided === 0) return 0
    return Math.round((converted / decided) * 100)
  }

  async getLeadFunnelCounts(): Promise<Record<string, number>> {
    const { leads } = await LeadApi.fetchLeads()
    const counts: Record<string, number> = {
      draft: 0,
      contacted: 0,
      qualified: 0,
      proposal_sent: 0,
      negotiation: 0,
      converted: 0,
      disqualified: 0,
    }
    for (const lead of leads) {
      if (lead.status in counts) {
        counts[lead.status]! += 1
      }
    }
    return counts
  }

  async getDisqualificationAnalytics(): Promise<{
    totalDisqualified: number
    topReasons: { reason: DisqualificationReason; label: string; count: number }[]
    competitorAnalysis: { name: string; count: number }[]
    industryAnalysis: { name: string; count: number }[]
    sourceAnalysis: { name: string; count: number }[]
  }> {
    const { leads, leadExtras } = await LeadApi.fetchLeads()
    const disqualifiedLeads = leads.filter((l) => l.status === 'disqualified')

    const reasonCounts = new Map<DisqualificationReason, number>()
    const competitorCounts = new Map<string, number>()
    const industryCounts = new Map<string, number>()
    const sourceCounts = new Map<string, number>()

    for (const lead of disqualifiedLeads) {
      const record =
        leadExtras[lead.id]?.disqualification ??
        (lead.disqualificationReason
          ? ({ reason: lead.disqualificationReason } as LeadDisqualificationData)
          : undefined)

      const reason = record?.reason ?? lead.disqualificationReason ?? 'other'
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1)

      if (record?.competitorName?.trim()) {
        const name = record.competitorName.trim()
        competitorCounts.set(name, (competitorCounts.get(name) ?? 0) + 1)
      }

      industryCounts.set(lead.industry, (industryCounts.get(lead.industry) ?? 0) + 1)
      sourceCounts.set(lead.source, (sourceCounts.get(lead.source) ?? 0) + 1)
    }

    const topReasons = [...reasonCounts.entries()]
      .map(([reason, count]) => ({
        reason,
        label: formatDisqualificationReason(reason),
        count,
      }))
      .sort((a, b) => b.count - a.count)

    const toSortedList = (map: Map<string, number>) =>
      [...map.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)

    return {
      totalDisqualified: disqualifiedLeads.length,
      topReasons,
      competitorAnalysis: toSortedList(competitorCounts),
      industryAnalysis: toSortedList(industryCounts),
      sourceAnalysis: toSortedList(sourceCounts),
    }
  }
}

export const leadService = new LeadService()
