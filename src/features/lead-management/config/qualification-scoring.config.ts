import type { LeadQualificationRating, LeadPriority } from '@/features/lead-management/types/lead.types'

export const QUALIFICATION_BUDGET_POINTS: Record<string, number> = {
  'under-25k': 5,
  '25k-100k': 12,
  '100k-500k': 20,
  '500k-1m': 28,
  'over-1m': 35,
}

export const QUALIFICATION_TIMELINE_POINTS: Record<string, number> = {
  immediate: 25,
  quarter: 20,
  'half-year': 12,
  year: 6,
  exploring: 2,
}

export const QUALIFICATION_PRIORITY_POINTS: Record<LeadPriority, number> = {
  high: 15,
  medium: 8,
  low: 3,
}

export const QUALIFICATION_INDUSTRY_POINTS: Record<string, number> = {
  Technology: 12,
  'Financial Services': 10,
  Manufacturing: 8,
  Healthcare: 8,
  Logistics: 6,
  Retail: 5,
  Utilities: 7,
  Other: 3,
}

export const QUALIFICATION_BANT_POINTS = 10

export const QUALIFICATION_RATING_THRESHOLDS = {
  hot: 75,
  warm: 50,
} as const

export function scoreToRating(score: number): LeadQualificationRating {
  if (score >= QUALIFICATION_RATING_THRESHOLDS.hot) return 'hot'
  if (score >= QUALIFICATION_RATING_THRESHOLDS.warm) return 'warm'
  return 'cold'
}

export function formatQualificationRating(rating: LeadQualificationRating): string {
  return rating.charAt(0).toUpperCase() + rating.slice(1)
}
