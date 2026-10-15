import type {
  Lead,
  Lead360AiInsight,
  Lead360Profile,
  ProposalHistoryItem,
  RelatedOpportunity,
} from '@/features/lead-management/types/lead.types'
import { formatWorkflowStatus } from '@/features/lead-management/lib/lead-workflow'
import { formatStage } from '@/features/opportunity-management/lib/opportunity-workflow'
import type { Opportunity } from '@/features/opportunity-management/types/opportunity.types'

export function mapOpportunitiesToRelated(opportunities: Opportunity[]): RelatedOpportunity[] {
  return opportunities.map((o) => ({
    id: o.id,
    name: o.name,
    stage: formatStage(o.stage),
    value: o.expectedRevenue,
    closeDate: o.closeDate,
    probability: o.probability,
  }))
}

export function getRelatedOpportunities(
  lead: Lead,
  linkedOpportunities: Opportunity[] = [],
): RelatedOpportunity[] {
  if (linkedOpportunities.length > 0) {
    return mapOpportunitiesToRelated(linkedOpportunities)
  }

  if (lead.convertedOpportunityId) {
    return [{
      id: lead.convertedOpportunityId,
      name: lead.opportunityName ?? `${lead.company} — Opportunity`,
      stage: 'Qualification',
      value: lead.expectedRevenue ?? 0,
      closeDate: lead.closeDate ?? lead.createdDate,
      probability: 25,
    }]
  }

  return []
}

export function buildLead360Profile(lead: Lead): Lead360Profile {
  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(lead.lastActivity).getTime()) / (1000 * 60 * 60 * 24),
  )

  let riskLevel: Lead360Profile['riskLevel'] = 'low'
  let riskReason = 'Engagement is healthy with recent activity.'

  if (lead.status === 'disqualified') {
    riskLevel = 'high'
    riskReason = 'Lead has been disqualified from the pipeline.'
  } else if (daysSinceActivity > 14) {
    riskLevel = 'high'
    riskReason = `No activity in ${daysSinceActivity} days — risk of going cold.`
  } else if (daysSinceActivity > 7 || lead.priority === 'low') {
    riskLevel = 'medium'
    riskReason = 'Follow-up cadence could be improved.'
  } else if (lead.status === 'negotiation' || lead.status === 'proposal_sent') {
    riskLevel = 'medium'
    riskReason = 'Active deal — monitor competitor activity and decision timeline.'
  }

  const healthScore = Math.min(
    100,
    Math.max(
      20,
      Math.round(
        lead.score * 0.5 +
          (lead.status === 'disqualified' ? 0 : 30) +
          (daysSinceActivity < 3 ? 20 : daysSinceActivity < 7 ? 10 : 0) +
          (lead.expectedRevenue ? 10 : 0),
      ),
    ),
  )

  const slug = lead.company.toLowerCase().replace(/\s+/g, '-')

  return {
    healthScore,
    riskLevel,
    riskReason,
    linkedInUrl: lead.website ? undefined : `https://linkedin.com/company/${slug}`,
    website: lead.website ?? undefined,
    employeeCount: lead.employees,
    location: lead.country,
  }
}

/** Proposal history requires CRM document integration — returns live data only when available. */
export function getProposalHistory(_lead: Lead): ProposalHistoryItem[] {
  return []
}

/** Rule-based insights until AI summary is loaded from Sales Assistant API. */
export function getLead360AiInsights(lead: Lead, profile: Lead360Profile): Lead360AiInsight[] {
  const nextAction =
    lead.status === 'draft'
      ? 'Assign an owner and schedule initial outreach within 24 hours.'
      : lead.status === 'assigned'
        ? 'Make first contact call and send introduction email.'
        : lead.status === 'contacted'
          ? 'Schedule discovery meeting to qualify budget and timeline.'
          : lead.status === 'qualified'
            ? 'Prepare and send tailored proposal based on discovery notes.'
            : lead.status === 'proposal_sent'
              ? 'Follow up on proposal — confirm receipt and address questions.'
              : lead.status === 'negotiation'
                ? 'Align on final terms and identify decision makers for sign-off.'
                : lead.status === 'converted'
                  ? 'Hand off to account team and schedule kickoff meeting.'
                  : 'Archive lead and document disqualification reason.'

  return [
    {
      id: 'next-action',
      type: 'action',
      title: 'Suggested Next Action',
      description: nextAction,
      confidence: 92,
    },
    {
      id: 'risk',
      type: 'risk',
      title: 'Risk Analysis',
      description: profile.riskReason,
      confidence: profile.riskLevel === 'high' ? 88 : 74,
    },
    {
      id: 'followup',
      type: 'followup',
      title: 'Recommended Follow-up',
      description: `Reach out to ${lead.name} by ${lead.nextFollowUp !== '—' ? lead.nextFollowUp : 'end of week'} regarding ${lead.company}. Status: ${formatWorkflowStatus(lead.status).toLowerCase()}.`,
      confidence: 85,
    },
  ]
}

export const AI_QUICK_COMMANDS = [
  { id: 'summary', label: 'Generate Summary' },
  { id: 'email', label: 'Suggest Email' },
  { id: 'win', label: 'Predict Win Probability' },
  { id: 'meeting', label: 'Suggest Next Meeting' },
  { id: 'followup', label: 'Suggest Follow-up' },
] as const
