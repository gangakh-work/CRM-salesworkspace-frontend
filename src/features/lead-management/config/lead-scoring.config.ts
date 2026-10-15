/** Revenue tiers used when calculating initial lead scores on creation. */
export const LEAD_SCORE_REVENUE_TIERS = [
  { min: 500_000, points: 25 },
  { min: 100_000, points: 15 },
  { min: 25_000, points: 8 },
] as const

export const LEAD_SCORE_PRIORITY_POINTS = {
  high: 15,
  medium: 8,
  low: 0,
} as const

export const LEAD_SCORE_BONUS = {
  hasBudget: 5,
  hasWebsite: 3,
  hasEmployees: 2,
} as const

export const LEAD_SCORE_BOUNDS = {
  min: 10,
  max: 99,
  base: 40,
} as const
