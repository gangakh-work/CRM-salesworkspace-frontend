import type { AccountInfo } from '@azure/msal-browser'

import { env } from '@/config/env'
import type { User } from '@/types'

function buildInitials(displayName: string): string {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function resolveRoles(email: string): string[] {
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined)
    ?.split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  const isAdmin =
    env.VITE_ENVIRONMENT === 'uat' ||
    adminEmails?.includes(email.toLowerCase()) === true

  return isAdmin ? ['Sales.Admin', 'Sales.Rep'] : ['Sales.Rep']
}

export function mapMsalAccountToUser(account: AccountInfo): User {
  const displayName = account.name?.trim() || account.username
  const email = account.username
  const roles = resolveRoles(email)

  return {
    id: account.localAccountId,
    displayName,
    email,
    role: roles.includes('Sales.Admin') ? 'Sales Admin' : 'Sales Rep',
    department: 'Sales',
    initials: buildInitials(displayName) || 'SW',
    roles,
  }
}
