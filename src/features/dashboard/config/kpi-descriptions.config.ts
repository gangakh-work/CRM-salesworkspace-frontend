/** KPI metric descriptions shown on hover in dashboard cards. */
export const KPI_DESCRIPTIONS: Record<string, string> = {
  'total-leads': 'Count of all lead records in Dataverse UAT, including open and closed states.',
  'open-opportunities': 'Active opportunities in the sales pipeline excluding won and lost deals.',
  'won-opportunities': 'Opportunities closed as Won in Dataverse.',
  'lost-opportunities': 'Opportunities closed as Lost in Dataverse.',
  'pipeline-value': 'Sum of estimated revenue on all open opportunities.',
  'this-month-revenue': 'Revenue from opportunities won in the current calendar month.',
  'qualified-leads': 'Leads in Qualified state ready for conversion.',
  'conversion-rate': 'Qualified leads divided by total disqualified + qualified leads (%).',
}

export const HEALTH_SCORE_DESCRIPTION =
  'Composite engagement score (0–100) based on lead score, recent activity, status, and expected revenue. Higher is healthier.'
