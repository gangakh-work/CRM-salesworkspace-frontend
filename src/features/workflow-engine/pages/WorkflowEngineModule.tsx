import { Route, Routes } from 'react-router-dom'

import { ManagementConfirmDialog } from '@/components/patterns/ManagementConfirmDialog'
import { WorkflowEngineProvider, useWorkflowEngine } from '@/features/workflow-engine/context/WorkflowEngineProvider'
import { WorkflowDetailPage } from '@/features/workflow-engine/pages/WorkflowDetailPage'
import { WorkflowListPage } from '@/features/workflow-engine/pages/WorkflowListPage'

function WorkflowConfirmDialog() {
  const { confirmDialog, hideConfirm } = useWorkflowEngine()
  return <ManagementConfirmDialog confirmDialog={confirmDialog} hideConfirm={hideConfirm} />
}

export function WorkflowEngineModule() {
  return (
    <WorkflowEngineProvider>
      <Routes>
        <Route index element={<WorkflowListPage />} />
        <Route path=":id" element={<WorkflowDetailPage />} />
      </Routes>
      <WorkflowConfirmDialog />
    </WorkflowEngineProvider>
  )
}
