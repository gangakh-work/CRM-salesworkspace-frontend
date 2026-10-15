import type { FeatureDefinition } from '@/config/feature-registry'
import { getEnabledFeatures } from '@/config/feature-registry'

export interface FeatureRouteDefinition {
  path: string
  featureId: string
}

export function getFeatureRouteDefinitions(): FeatureRouteDefinition[] {
  return getEnabledFeatures().map((feature) => ({
    path: feature.path.replace(/^\//, ''),
    featureId: feature.id,
  }))
}

export const staticRoutePaths = {
  unauthorized: '/unauthorized',
  maintenance: '/maintenance',
  designSystem: '/design-system',
} as const

export const routeMeta = {
  public: ['/login', '/unauthorized', '/maintenance', '/design-system'],
  defaultRedirect: '/dashboard',
  login: '/login',
} as const

export type StaticRouteKey = keyof typeof staticRoutePaths

export function getFeatureRouteMeta(featureId: string): FeatureDefinition | undefined {
  return getEnabledFeatures().find((f) => f.id === featureId)
}
