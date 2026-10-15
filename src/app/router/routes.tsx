import { lazy } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { getFeatureRouteDefinitions, routeMeta, staticRoutePaths } from '@/config/routes'
import { ShellLayout } from '@/shell/RootLayout'

const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const CrmWorkspacePage = lazy(() =>
  import('@/features/crm-workspace/pages/CrmWorkspacePage').then((m) => ({
    default: m.CrmWorkspacePage,
  })),
)
const ComingSoonPage = lazy(() =>
  import('@/pages/ComingSoonPage').then((m) => ({ default: m.ComingSoonPage })),
)
const ReportsHubPage = lazy(() =>
  import('@/features/reports/pages/ReportsHubPage').then((m) => ({ default: m.ReportsHubPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const AdministrationPage = lazy(() =>
  import('@/pages/AdministrationPage').then((m) => ({ default: m.AdministrationPage })),
)
const AccountsModule = lazy(() =>
  import('@/features/accounts-contacts/pages/AccountsModule').then((m) => ({ default: m.AccountsModule })),
)
const ContactsModule = lazy(() =>
  import('@/features/accounts-contacts/pages/ContactsModule').then((m) => ({ default: m.ContactsModule })),
)
const MyWorkflowPage = lazy(() =>
  import('@/features/intelligence/pages/MyWorkflowPage').then((m) => ({ default: m.MyWorkflowPage })),
)
const DealIntelligencePage = lazy(() =>
  import('@/features/intelligence/pages/DealIntelligencePage').then((m) => ({ default: m.DealIntelligencePage })),
)
const AnalyticsForecastPage = lazy(() =>
  import('@/features/intelligence/pages/AnalyticsForecastPage').then((m) => ({ default: m.AnalyticsForecastPage })),
)
const IntegrationsAuditPage = lazy(() =>
  import('@/features/intelligence/pages/AdminPages').then((m) => ({ default: m.IntegrationsAuditPage })),
)
const ConversationInsightsPage = lazy(() =>
  import('@/features/intelligence/pages/AdminPages').then((m) => ({ default: m.ConversationInsightsPage })),
)
const SalesAgentPage = lazy(() =>
  import('@/features/sales-agent/pages/SalesAgentPage').then((m) => ({ default: m.SalesAgentPage })),
)
const AiAssistantPage = lazy(() =>
  import('@/pages/AiAssistantPage').then((m) => ({ default: m.AiAssistantPage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)
const UnauthorizedPage = lazy(() =>
  import('@/pages/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage })),
)
const MaintenancePage = lazy(() =>
  import('@/pages/MaintenancePage').then((m) => ({ default: m.MaintenancePage })),
)
const DesignSystemCatalog = lazy(() =>
  import('@/design-system/catalog').then((m) => ({ default: m.DesignSystemCatalog })),
)

const WORKSPACE_FEATURE_IDS = new Set(['leads', 'opportunities', 'workflows', 'activities', 'documents'])
/** Modules with their own nested list/detail routes (mounted as `path/*` below). */
const MODULE_FEATURE_IDS = new Set(['accounts', 'contacts'])

const featureRoutes = getFeatureRouteDefinitions()
  .filter(({ featureId }) => !WORKSPACE_FEATURE_IDS.has(featureId) && !MODULE_FEATURE_IDS.has(featureId))
  .map(({ path, featureId }) => ({
    path,
    element:
      featureId === 'dashboard' ? (
        <DashboardPage />
      ) : featureId === 'reports' ? (
        <ReportsHubPage />
      ) : featureId === 'settings' ? (
        <SettingsPage />
      ) : featureId === 'administration' ? (
        <AdministrationPage />
      ) : featureId === 'workflow' ? (
        <MyWorkflowPage />
      ) : featureId === 'dealIntelligence' ? (
        <DealIntelligencePage />
      ) : featureId === 'analytics' ? (
        <AnalyticsForecastPage />
      ) : featureId === 'conversations' ? (
        <ConversationInsightsPage />
      ) : featureId === 'integrations' ? (
        <IntegrationsAuditPage />
      ) : featureId === 'salesAgent' ? (
        <SalesAgentPage />
      ) : featureId === 'aiAssistant' ? (
        <AiAssistantPage />
      ) : (
        <ComingSoonPage featureId={featureId} />
      ),
  }))

export const router = createBrowserRouter([
  {
    path: routeMeta.login.replace(/^\//, ''),
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <ShellLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={routeMeta.defaultRedirect} replace />,
          },
          {
            path: 'workspace/*',
            element: <CrmWorkspacePage />,
          },
          {
            path: 'accounts/*',
            element: <AccountsModule />,
          },
          {
            path: 'contacts/*',
            element: <ContactsModule />,
          },
          ...featureRoutes,
          {
            path: staticRoutePaths.designSystem.replace(/^\//, ''),
            element: <DesignSystemCatalog />,
          },
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
  {
    path: staticRoutePaths.unauthorized.replace(/^\//, ''),
    element: <UnauthorizedPage />,
  },
  {
    path: staticRoutePaths.maintenance.replace(/^\//, ''),
    element: <MaintenancePage />,
  },
])
