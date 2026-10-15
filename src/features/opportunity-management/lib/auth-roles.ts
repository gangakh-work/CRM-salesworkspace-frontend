const ADMIN_ROLES = new Set(['Sales.Admin', 'System.Administrator', 'System.Admin'])

/** Returns true when the user may skip mandatory opportunity stages. */
export function isOpportunityAdmin(roles?: string[]): boolean {
  if (!roles?.length) return false
  return roles.some((role) => ADMIN_ROLES.has(role))
}
