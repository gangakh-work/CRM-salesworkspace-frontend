import { useNavigate } from 'react-router-dom'

import type { WorkflowInstance } from '@/features/workflow-engine/types/workflow.types'

export function useNavigateToWorkflow() {
  const navigate = useNavigate()
  return (wf: WorkflowInstance | { id: string }) => navigate(`/workspace/workflows/${wf.id}`)
}
