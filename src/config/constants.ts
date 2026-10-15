export const APP_NAME = 'Sales Workspace'
export const APP_VERSION = '0.1.0'
export const APP_DESCRIPTION = 'Enterprise sales operations platform'

export const SIDEBAR_WIDTH = '16rem'
export const SIDEBAR_WIDTH_COLLAPSED = '4rem'
export const HEADER_HEIGHT = '3.5rem'
export const FOOTER_HEIGHT = '2.5rem'
export const COMMAND_BAR_HEIGHT = '2.75rem'

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export const STORAGE_KEYS = {
  sidebarCollapsed: 'sw:sidebar-collapsed',
  settings: 'sw:settings',
  isAuthenticated: 'sw:is-authenticated',
  rememberMe: 'sw:remember-me',
  user: 'sw:user',
  dashboardSettings: 'sw:dashboard-settings',
  workspaceViewMode: 'sw:workspace-view-mode',
  leadViewMode: 'sw:lead-view-mode',
  leadColumns: 'sw:lead-columns',
  opportunityViewMode: 'sw:opportunity-view-mode',
  opportunityColumns: 'sw:opportunity-columns',
  aiCopilotWidth: 'sw:ai-copilot-width',
  aiCopilotMode: 'sw:ai-copilot-mode',
  aiCopilotHistory: 'sw:ai-copilot-history',
} as const

export const AUTH_ROUTES = {
  login: '/login',
  defaultRedirect: '/dashboard',
} as const
