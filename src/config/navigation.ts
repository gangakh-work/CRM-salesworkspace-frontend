import { getNavFeatures, type FeatureDefinition } from '@/config/feature-registry'

export interface NavGroup {
  id: string
  label: string
  items: FeatureDefinition[]
}

const groupLabels: Record<FeatureDefinition['group'], string> = {
  core: 'Workspace',
  sales: 'Seller work',
  intelligence: 'Intelligence',
  tools: 'Tools',
  admin: 'Administration',
}

export function getNavigationGroups(): NavGroup[] {
  const features = getNavFeatures()
  const groups = new Map<string, FeatureDefinition[]>()

  for (const feature of features) {
    const existing = groups.get(feature.group) ?? []
    existing.push(feature)
    groups.set(feature.group, existing)
  }

  return Array.from(groups.entries()).map(([id, items]) => ({
    id,
    label: groupLabels[id as FeatureDefinition['group']],
    items,
  }))
}

export function getFlatNavigation(): FeatureDefinition[] {
  return getNavFeatures()
}
