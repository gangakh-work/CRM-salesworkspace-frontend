export const OPPORTUNITY_UPDATED_EVENT = 'sw:opportunity-updated'

export function notifyOpportunityUpdated(): void {
  window.dispatchEvent(new CustomEvent(OPPORTUNITY_UPDATED_EVENT))
}

export function subscribeOpportunityUpdated(handler: () => void): () => void {
  window.addEventListener(OPPORTUNITY_UPDATED_EVENT, handler)
  return () => window.removeEventListener(OPPORTUNITY_UPDATED_EVENT, handler)
}
