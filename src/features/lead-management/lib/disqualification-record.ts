import { formatDisqualificationReason } from '@/features/lead-management/config/disqualification-form.config'
import type { DisqualifyLeadInput } from '@/features/lead-management/domain/disqualification.schema'
import type { LeadDisqualificationData, RevisitAfterDays } from '@/features/lead-management/types/lead.types'

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function buildDisqualificationRecord(
  input: DisqualifyLeadInput,
  disqualifiedBy: string,
): LeadDisqualificationData {
  const today = new Date().toISOString().slice(0, 10)
  const revisitDays = input.revisitAfterDays
    ? (Number(input.revisitAfterDays) as RevisitAfterDays)
    : undefined

  return {
    reason: input.reason,
    remarks: input.remarks?.trim() || undefined,
    competitorName: input.competitorName?.trim() || undefined,
    scheduleFollowUp: input.scheduleFollowUp,
    revisitAfterDays: revisitDays,
    followUpOwner: input.scheduleFollowUp ? input.followUpOwner?.trim() : undefined,
    followUpDate:
      input.scheduleFollowUp && revisitDays ? addDays(today, revisitDays) : undefined,
    disqualifiedAt: today,
    disqualifiedBy,
  }
}

export function buildDisqualificationSummary(record: LeadDisqualificationData): string {
  const reason = formatDisqualificationReason(record.reason)
  if (record.competitorName) {
    return `${reason} · Competitor: ${record.competitorName}`
  }
  return reason
}
