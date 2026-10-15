import type { AiPageContext } from '@/features/ai-copilot/types/copilot.types'

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Executive Dashboard',
  '/workspace/leads': 'Lead Management',
  '/workspace/opportunities': 'Opportunities',
  '/workspace/workflows': 'Workflow Engine',
  '/workspace/activities': 'Activities',
  '/workspace/customers': 'Customers',
  '/workspace/proposals': 'Proposals',
  '/workspace/documents': 'Documents',
  '/workspace/tasks': 'Tasks',
  '/login': 'Login',
}

export function resolvePageContextFromPath(pathname: string): AiPageContext {
  const leadMatch = pathname.match(/^\/workspace\/leads\/([^/]+)$/)
  if (leadMatch) {
    return {
      page: pathname,
      pageLabel: 'Lead 360° Workspace',
      entityType: 'lead',
      entityId: leadMatch[1],
      entityName: leadMatch[1].replace(/-/g, ' '),
    }
  }

  const oppMatch = pathname.match(/^\/workspace\/opportunities\/([^/]+)$/)
  if (oppMatch) {
    return {
      page: pathname,
      pageLabel: 'Opportunity 360° Workspace',
      entityType: 'opportunity',
      entityId: oppMatch[1],
      entityName: oppMatch[1].replace(/-/g, ' '),
    }
  }

  const wfMatch = pathname.match(/^\/workspace\/workflows\/([^/]+)$/)
  if (wfMatch) {
    return {
      page: pathname,
      pageLabel: 'Workflow Execution',
      entityType: 'workflow',
      entityId: wfMatch[1],
      entityName: wfMatch[1].replace(/-/g, ' '),
    }
  }

  const base = Object.keys(PAGE_LABELS)
    .sort((a, b) => b.length - a.length)
    .find((p) => pathname === p || pathname.startsWith(`${p}/`))

  return {
    page: pathname,
    pageLabel: PAGE_LABELS[base ?? ''] ?? 'Sales Workspace',
    entityType: pathname.startsWith('/workspace') ? 'page' : undefined,
  }
}
