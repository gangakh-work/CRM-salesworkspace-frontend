import {
  QUALIFICATION_BANT_POINTS,
  QUALIFICATION_BUDGET_POINTS,
  QUALIFICATION_INDUSTRY_POINTS,
  QUALIFICATION_PRIORITY_POINTS,
  QUALIFICATION_TIMELINE_POINTS,
  scoreToRating,
} from '@/features/lead-management/config/qualification-scoring.config'
import type { QualifyLeadInput } from '@/features/lead-management/domain/qualification.schema'
import type { Lead, LeadQualificationData, LeadQualificationRating } from '@/features/lead-management/types/lead.types'

export interface QualificationScoreResult {
  score: number
  rating: LeadQualificationRating
  buyingIntent: number
}

/** Client-side qualification scoring from wizard inputs and live lead fields. */
export function calculateQualificationScore(
  input: QualifyLeadInput,
  lead: Pick<Lead, 'industry'>,
): QualificationScoreResult {
  let score = 0

  score += QUALIFICATION_BUDGET_POINTS[input.budgetRange] ?? 0
  score += QUALIFICATION_TIMELINE_POINTS[input.buyingTimeline] ?? 0
  score += QUALIFICATION_PRIORITY_POINTS[input.priority] ?? 0
  score += QUALIFICATION_INDUSTRY_POINTS[lead.industry] ?? QUALIFICATION_INDUSTRY_POINTS.Other

  const bantFields = [
    input.needConfirmed,
    input.budgetConfirmed,
    input.authorityConfirmed,
    input.timelineConfirmed,
  ] as const
  const buyingIntent = bantFields.filter((v) => v === 'yes').length
  score += buyingIntent * QUALIFICATION_BANT_POINTS

  const revenue = Number(input.expectedRevenue)
  if (revenue >= 500_000) score += 10
  else if (revenue >= 100_000) score += 6
  else if (revenue >= 25_000) score += 3

  const clamped = Math.min(99, Math.max(10, score))

  return {
    score: clamped,
    rating: scoreToRating(clamped),
    buyingIntent,
  }
}

export function buildQualificationRecord(
  input: QualifyLeadInput,
  _lead: Lead,
  qualifiedBy: string,
  scoreResult: QualificationScoreResult,
): LeadQualificationData {
  const now = new Date().toISOString()
  return {
    productsInterested: input.productsInterested.trim(),
    expectedRevenue: Number(input.expectedRevenue),
    priority: input.priority,
    budgetRange: input.budgetRange,
    buyingTimeline: input.buyingTimeline,
    decisionMaker: input.decisionMaker.trim(),
    competitors: input.competitors?.trim() || undefined,
    needConfirmed: input.needConfirmed === 'yes',
    budgetConfirmed: input.budgetConfirmed === 'yes',
    authorityConfirmed: input.authorityConfirmed === 'yes',
    timelineConfirmed: input.timelineConfirmed === 'yes',
    painPoints: input.painPoints.trim(),
    qualificationScore: scoreResult.score,
    qualificationRating: scoreResult.rating,
    qualifiedAt: now,
    qualifiedBy,
  }
}
