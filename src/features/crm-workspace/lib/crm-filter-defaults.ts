/** Fallback picklists when Dataverse metadata is still loading. */
export const DEFAULT_CRM_REGIONS = ['North America', 'EMEA', 'APAC', 'LATAM'] as const

export const DEFAULT_CRM_INDUSTRIES = [
  'Technology',
  'Manufacturing',
  'Financial Services',
  'Retail',
  'Healthcare',
  'Logistics',
] as const

export function ownerOptions(owners: string[]) {
  return owners.map((owner) => ({ value: owner, label: owner }))
}

export function labelOptions(values: string[]) {
  return values.map((value) => ({ value, label: value }))
}
