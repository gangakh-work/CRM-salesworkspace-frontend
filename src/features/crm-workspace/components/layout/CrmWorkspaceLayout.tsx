import { motion } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'

import { LoadingState } from '@/components/patterns/state-components'
import { WORKSPACE_LAYOUT_VARS } from '@/config/workspace-layout'
import { WorkspaceContent } from '@/features/crm-workspace/components/layout/WorkspaceContent'
import { WorkspaceNavPanel } from '@/features/crm-workspace/components/layout/WorkspaceNavPanel'
import { WorkspaceStatusBar } from '@/features/crm-workspace/components/layout/WorkspaceStatusBar'
import { WorkspaceToolbar } from '@/features/crm-workspace/components/layout/WorkspaceToolbar'
import { useWorkspace } from '@/features/crm-workspace/context/WorkspaceProvider'
import { WorkspaceProvider } from '@/features/crm-workspace/context/WorkspaceProvider'
import { WORKSPACE_TABS } from '@/features/crm-workspace/types/workspace.types'
import { pageTransition } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

const LeadsModule = lazy(() =>
  import('@/features/lead-management/pages/LeadsModule').then((m) => ({ default: m.LeadsModule })),
)
const OpportunitiesModule = lazy(() =>
  import('@/features/opportunity-management/pages/OpportunitiesModule').then((m) => ({
    default: m.OpportunitiesModule,
  })),
)
const WorkflowEngineModule = lazy(() =>
  import('@/features/workflow-engine/pages/WorkflowEngineModule').then((m) => ({
    default: m.WorkflowEngineModule,
  })),
)

function ModuleFallback() {
  return <LoadingState label="Loading module..." className="py-24" />
}

function WorkspacePanels() {
  const { activeTab } = useWorkspace()
  const location = useLocation()
  const isLeadsModule = activeTab === 'leads'
  const isOpportunitiesModule = activeTab === 'opportunities'
  const isWorkflowsModule = activeTab === 'workflows'
  const isLead360 = /^\/workspace\/leads\/[^/]+$/.test(location.pathname)
  const isOpportunity360 = /^\/workspace\/opportunities\/[^/]+$/.test(location.pathname)
  const isWorkflowDetail = /^\/workspace\/workflows\/[^/]+$/.test(location.pathname)
  const isEntity360 = isLead360 || isOpportunity360 || isWorkflowDetail
  const isDedicatedModule = isLeadsModule || isOpportunitiesModule || isWorkflowsModule

  return (
    <div
      data-workspace-root
      className="flex h-full flex-col overflow-hidden bg-background"
      style={
        {
          '--workspace-nav-width': WORKSPACE_LAYOUT_VARS.navWidth,
          '--workspace-ai-width': WORKSPACE_LAYOUT_VARS.aiPanelWidth,
          '--workspace-status-height': WORKSPACE_LAYOUT_VARS.statusBarHeight,
        } as Record<string, string>
      }
    >
      {!isDedicatedModule && <WorkspaceToolbar />}

      <div className="flex min-h-0 flex-1">
        {!isEntity360 && (
          <div className="hidden md:block">
            <WorkspaceNavPanel />
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Suspense fallback={<ModuleFallback />}>
            {isLeadsModule ? (
              <LeadsModule />
            ) : isOpportunitiesModule ? (
              <OpportunitiesModule />
            ) : isWorkflowsModule ? (
              <WorkflowEngineModule />
            ) : (
              <WorkspaceContent />
            )}
          </Suspense>
        </main>

      
      </div>

      <div className={cn('md:hidden', isEntity360 && 'hidden')}>
        <MobileWorkspaceNav />
      </div>

      <WorkspaceStatusBar />
    </div>
  )
}

function MobileWorkspaceNav() {
  return (
    <nav
      className="flex gap-1 overflow-x-auto border-t border-border/60 bg-muted/30 px-2 py-2"
      aria-label="Workspace navigation"
    >
      {WORKSPACE_TABS.map((tab) => {
        const Icon = tab.icon
        return (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={({ isActive }) =>
              cn(
                'flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-background hover:text-foreground',
              )
            }
          >
            <Icon className="size-4" aria-hidden />
            {tab.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

export function CrmWorkspaceLayout() {
  return (
    <WorkspaceProvider>
      <motion.div
        className="flex h-full min-h-0 flex-1 flex-col"
        initial="initial"
        animate="animate"
        variants={pageTransition}
      >
        <Routes>
          <Route index element={<Navigate to="leads" replace />} />
          {WORKSPACE_TABS.map((tab) => (
            <Route
              key={tab.id}
              path={
                tab.id === 'leads'
                  ? 'leads/*'
                  : tab.id === 'opportunities'
                    ? 'opportunities/*'
                    : tab.id === 'workflows'
                      ? 'workflows/*'
                      : tab.id
              }
              element={<WorkspacePanels />}
            />
          ))}
        </Routes>
      </motion.div>
    </WorkspaceProvider>
  )
}
