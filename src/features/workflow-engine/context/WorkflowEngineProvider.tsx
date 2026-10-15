import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { toast as sonnerToast } from 'sonner'

import { WORKFLOW_OWNERS, getWorkflowStats } from '@/features/workflow-engine/data/workflow-helpers'
import { getTemplate, WORKFLOW_TEMPLATES } from '@/features/workflow-engine/lib/workflow-definitions'
import {
  buildChecklistFromTemplate,
  computeProgress,
  instantiateSteps,
} from '@/features/workflow-engine/lib/workflow-engine'
import type {
  AuditEntry,
  ConfirmDialogState,
  WorkflowActivity,
  WorkflowComment,
  WorkflowFilters,
  WorkflowInstance,
  WorkflowNotification,
  WorkflowTemplateId,
} from '@/features/workflow-engine/types/workflow.types'
import { DEFAULT_WORKFLOW_FILTERS } from '@/features/workflow-engine/types/workflow.types'

export { WORKFLOW_TEMPLATES, WORKFLOW_OWNERS }

type UndoEntry = { id: string; undo: () => void }

let counter = 0
function nextId(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}`
}

interface WorkflowEngineContextValue {
  workflows: WorkflowInstance[]
  filteredWorkflows: WorkflowInstance[]
  stats: ReturnType<typeof getWorkflowStats>
  searchQuery: string
  filters: WorkflowFilters
  selectedWorkflow: WorkflowInstance | null
  confirmDialog: ConfirmDialogState | null
  unreadNotifications: number
  setSearchQuery: (q: string) => void
  setFilters: (f: WorkflowFilters) => void
  selectWorkflow: (id: string | null) => void
  getWorkflow: (id: string) => WorkflowInstance | undefined
  showConfirm: (dialog: ConfirmDialogState) => void
  hideConfirm: () => void
  completeStep: (workflowId: string, stepId: string) => void
  startStep: (workflowId: string, stepId: string) => void
  approveStep: (workflowId: string, approvalId: string, comment?: string) => void
  rejectStep: (workflowId: string, approvalId: string, comment?: string) => void
  addComment: (workflowId: string, content: string, stepId?: string) => void
  toggleChecklistItem: (workflowId: string, itemId: string) => void
  pauseWorkflow: (workflowId: string) => void
  resumeWorkflow: (workflowId: string) => void
  cancelWorkflow: (workflowId: string) => void
  markNotificationRead: (workflowId: string, notificationId: string) => void
  markAllNotificationsRead: () => void
  startWorkflowFromTemplate: (templateId: WorkflowTemplateId, name: string, owner: string) => WorkflowInstance
  refresh: () => void
  isRefreshing: boolean
}

const WorkflowEngineContext = createContext<WorkflowEngineContextValue | null>(null)

export function WorkflowEngineProvider({ children }: { children: ReactNode }) {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<WorkflowFilters>(DEFAULT_WORKFLOW_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const undoStack = useRef<UndoEntry[]>([])

  const showConfirm = useCallback((d: ConfirmDialogState) => setConfirmDialog(d), [])
  const hideConfirm = useCallback(() => setConfirmDialog(null), [])

  const pushUndo = useCallback((message: string, undo: () => void) => {
    const entry: UndoEntry = { id: nextId('undo'), undo }
    undoStack.current.push(entry)
    sonnerToast.success(message, {
      action: {
        label: 'Undo',
        onClick: () => {
          undo()
          undoStack.current = undoStack.current.filter((e) => e.id !== entry.id)
          sonnerToast.info('Action undone')
        },
      },
    })
  }, [])

  const appendAudit = useCallback(
    (workflowId: string, entry: Omit<AuditEntry, 'id'>) => {
      const audit: AuditEntry = { id: nextId('audit'), ...entry }
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === workflowId ? { ...w, auditHistory: [audit, ...w.auditHistory] } : w,
        ),
      )
    },
    [],
  )

  const appendActivity = useCallback(
    (workflowId: string, activity: Omit<WorkflowActivity, 'id'>) => {
      const act: WorkflowActivity = { id: nextId('act'), ...activity }
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === workflowId ? { ...w, activities: [act, ...w.activities] } : w,
        ),
      )
    },
    [],
  )

  const addNotification = useCallback(
    (workflowId: string, notification: Omit<WorkflowNotification, 'id' | 'workflowId' | 'read'>) => {
      const notif: WorkflowNotification = {
        id: nextId('notif'),
        workflowId,
        read: false,
        ...notification,
      }
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === workflowId ? { ...w, notifications: [notif, ...w.notifications] } : w,
        ),
      )
    },
    [],
  )

  const updateWorkflow = useCallback(
    (workflowId: string, updater: (w: WorkflowInstance) => WorkflowInstance) => {
      setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? updater(w) : w)))
    },
    [],
  )

  const filteredWorkflows = useMemo(() => {
    let result = [...workflows]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.owner.toLowerCase().includes(q) ||
          w.entityName?.toLowerCase().includes(q),
      )
    }
    if (filters.status.length) result = result.filter((w) => filters.status.includes(w.status))
    if (filters.template.length) result = result.filter((w) => filters.template.includes(w.templateId))
    if (filters.owner.length) result = result.filter((w) => filters.owner.includes(w.owner))
    if (filters.category.length) {
      result = result.filter((w) => {
        const cat = getTemplate(w.templateId)?.category
        return cat && filters.category.includes(cat)
      })
    }
    return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [workflows, searchQuery, filters])

  const stats = useMemo(() => getWorkflowStats(workflows), [workflows])

  const selectedWorkflow = useMemo(
    () => workflows.find((w) => w.id === selectedId) ?? null,
    [workflows, selectedId],
  )

  const unreadNotifications = useMemo(
    () => workflows.reduce((s, w) => s + w.notifications.filter((n) => !n.read).length, 0),
    [workflows],
  )

  const getWorkflow = useCallback((id: string) => workflows.find((w) => w.id === id), [workflows])

  const completeStep = useCallback(
    (workflowId: string, stepId: string) => {
      const wf = workflows.find((w) => w.id === workflowId)
      if (!wf) return
      const step = wf.steps.find((s) => s.id === stepId)
      if (!step || step.status === 'completed') return

      const prevSteps = wf.steps.map((s) => ({ ...s }))
      const stepIdx = wf.steps.findIndex((s) => s.id === stepId)
      const now = new Date().toISOString()

      updateWorkflow(workflowId, (w) => {
        const steps = w.steps.map((s) =>
          s.id === stepId ? { ...s, status: 'completed' as const, completedAt: now } : s,
        )
        const nextStep = steps[stepIdx + 1]
        if (nextStep && nextStep.status === 'pending') {
          const template = getTemplate(w.templateId)
          const stepDef = template?.steps.find((d) => d.id === nextStep.definitionId)
          steps[stepIdx + 1] = {
            ...nextStep,
            status: stepDef?.type === 'approval' ? 'awaiting_approval' : 'in_progress',
            startedAt: now,
          }
        }
        const progress = computeProgress(steps)
        const allDone = steps.every((s) => s.status === 'completed' || s.status === 'skipped')
        return {
          ...w,
          steps,
          currentStepId: nextStep?.id ?? stepId,
          progress,
          status: allDone ? 'completed' : w.status,
          completedAt: allDone ? now : undefined,
          updatedAt: now,
        }
      })

      appendAudit(workflowId, { action: 'Step Completed', actor: wf.owner, timestamp: now, details: step.name, stepId })
      appendActivity(workflowId, { type: 'step_completed', title: 'Step Completed', description: step.name, actor: wf.owner, timestamp: now, stepId })
      addNotification(workflowId, { title: 'Step Completed', message: `${step.name} completed`, timestamp: now, type: 'success' })
      pushUndo(`Completed "${step.name}"`, () => updateWorkflow(workflowId, (w) => ({ ...w, steps: prevSteps })))
    },
    [workflows, updateWorkflow, appendAudit, appendActivity, addNotification, pushUndo],
  )

  const startStep = useCallback(
    (workflowId: string, stepId: string) => {
      const now = new Date().toISOString()
      updateWorkflow(workflowId, (w) => ({
        ...w,
        steps: w.steps.map((s) =>
          s.id === stepId ? { ...s, status: 'in_progress' as const, startedAt: now } : s,
        ),
        currentStepId: stepId,
        updatedAt: now,
      }))
    },
    [updateWorkflow],
  )

  const approveStep = useCallback(
    (workflowId: string, approvalId: string, comment?: string) => {
      const now = new Date().toISOString()
      updateWorkflow(workflowId, (w) => ({
        ...w,
        approvals: w.approvals.map((a) =>
          a.id === approvalId ? { ...a, status: 'approved' as const, comment, timestamp: now } : a,
        ),
        updatedAt: now,
      }))
      const approval = workflows.find((w) => w.id === workflowId)?.approvals.find((a) => a.id === approvalId)
      if (approval) {
        appendActivity(workflowId, { type: 'approval', title: 'Approval Granted', description: approval.stepName, actor: approval.approver, timestamp: now, stepId: approval.stepId })
        sonnerToast.success('Approval granted')
        completeStep(workflowId, approval.stepId)
      }
    },
    [workflows, updateWorkflow, appendActivity, completeStep],
  )

  const rejectStep = useCallback(
    (workflowId: string, approvalId: string, comment?: string) => {
      const now = new Date().toISOString()
      updateWorkflow(workflowId, (w) => ({
        ...w,
        approvals: w.approvals.map((a) =>
          a.id === approvalId ? { ...a, status: 'rejected' as const, comment, timestamp: now } : a,
        ),
        status: 'paused',
        updatedAt: now,
      }))
      sonnerToast.error('Approval rejected — workflow paused')
    },
    [updateWorkflow],
  )

  const addComment = useCallback(
    (workflowId: string, content: string, stepId?: string) => {
      const wf = workflows.find((w) => w.id === workflowId)
      if (!wf) return
      const now = new Date().toISOString()
      const comment: WorkflowComment = { id: nextId('comment'), author: wf.owner, content, timestamp: now, stepId }
      updateWorkflow(workflowId, (w) => ({
        ...w,
        comments: [comment, ...w.comments],
        updatedAt: now,
      }))
      appendActivity(workflowId, { type: 'comment', title: 'Comment Added', description: content.slice(0, 80), actor: wf.owner, timestamp: now, stepId })
      sonnerToast.success('Comment added')
    },
    [workflows, updateWorkflow, appendActivity],
  )

  const toggleChecklistItem = useCallback(
    (workflowId: string, itemId: string) => {
      const wf = workflows.find((w) => w.id === workflowId)
      if (!wf) return
      const now = new Date().toISOString()
      updateWorkflow(workflowId, (w) => ({
        ...w,
        checklist: w.checklist.map((item) =>
          item.id === itemId
            ? {
                ...item,
                completed: !item.completed,
                completedBy: !item.completed ? wf.owner : undefined,
                completedAt: !item.completed ? now : undefined,
              }
            : item,
        ),
        updatedAt: now,
      }))
    },
    [workflows, updateWorkflow],
  )

  const pauseWorkflow = useCallback(
    (workflowId: string) => {
      updateWorkflow(workflowId, (w) => ({ ...w, status: 'paused', updatedAt: new Date().toISOString() }))
      sonnerToast.info('Workflow paused')
    },
    [updateWorkflow],
  )

  const resumeWorkflow = useCallback(
    (workflowId: string) => {
      updateWorkflow(workflowId, (w) => ({ ...w, status: 'active', updatedAt: new Date().toISOString() }))
      sonnerToast.success('Workflow resumed')
    },
    [updateWorkflow],
  )

  const cancelWorkflow = useCallback(
    (workflowId: string) => {
      showConfirm({
        title: 'Cancel Workflow',
        description: 'This will cancel the workflow. This action cannot be undone.',
        confirmLabel: 'Cancel Workflow',
        variant: 'destructive',
        onConfirm: () => {
          updateWorkflow(workflowId, (w) => ({ ...w, status: 'cancelled', updatedAt: new Date().toISOString() }))
          sonnerToast.info('Workflow cancelled')
        },
      })
    },
    [showConfirm, updateWorkflow],
  )

  const markNotificationRead = useCallback(
    (workflowId: string, notificationId: string) => {
      updateWorkflow(workflowId, (w) => ({
        ...w,
        notifications: w.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n,
        ),
      }))
    },
    [updateWorkflow],
  )

  const markAllNotificationsRead = useCallback(() => {
    setWorkflows((prev) =>
      prev.map((w) => ({
        ...w,
        notifications: w.notifications.map((n) => ({ ...n, read: true })),
      })),
    )
  }, [])

  const startWorkflowFromTemplate = useCallback(
    (templateId: WorkflowTemplateId, name: string, owner: string): WorkflowInstance => {
      const template = getTemplate(templateId)
      if (!template) throw new Error(`Template ${templateId} not found`)
      const id = nextId('wf')
      const steps = instantiateSteps(template, owner, id)
      const checklist = buildChecklistFromTemplate(template, steps, id)
      const now = new Date().toISOString()
      const instance: WorkflowInstance = {
        id,
        templateId,
        name,
        status: 'active',
        owner,
        currentStepId: steps[0].id,
        progress: 0,
        steps,
        approvals: [],
        comments: [],
        notifications: [],
        auditHistory: [{ id: nextId('audit'), action: 'Workflow Started', actor: owner, timestamp: now, details: name }],
        checklist,
        activities: [{ id: nextId('act'), type: 'step_started', title: 'Workflow Started', description: name, actor: owner, timestamp: now }],
        startedAt: now,
        updatedAt: now,
      }
      setWorkflows((prev) => [instance, ...prev])
      sonnerToast.success(`Workflow "${name}" started`)
      return instance
    },
    [],
  )

  const refresh = useCallback(() => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 600)
  }, [])

  const value = useMemo(
    (): WorkflowEngineContextValue => ({
      workflows,
      filteredWorkflows,
      stats,
      searchQuery,
      filters,
      selectedWorkflow,
      confirmDialog,
      unreadNotifications,
      setSearchQuery,
      setFilters,
      selectWorkflow: setSelectedId,
      getWorkflow,
      showConfirm,
      hideConfirm,
      completeStep,
      startStep,
      approveStep,
      rejectStep,
      addComment,
      toggleChecklistItem,
      pauseWorkflow,
      resumeWorkflow,
      cancelWorkflow,
      markNotificationRead,
      markAllNotificationsRead,
      startWorkflowFromTemplate,
      refresh,
      isRefreshing,
    }),
    [
      workflows,
      filteredWorkflows,
      stats,
      searchQuery,
      filters,
      selectedWorkflow,
      confirmDialog,
      unreadNotifications,
      getWorkflow,
      showConfirm,
      hideConfirm,
      completeStep,
      startStep,
      approveStep,
      rejectStep,
      addComment,
      toggleChecklistItem,
      pauseWorkflow,
      resumeWorkflow,
      cancelWorkflow,
      markNotificationRead,
      markAllNotificationsRead,
      startWorkflowFromTemplate,
      refresh,
      isRefreshing,
    ],
  )

  return (
    <WorkflowEngineContext.Provider value={value}>
      {children}
    </WorkflowEngineContext.Provider>
  )
}

export function useWorkflowEngine() {
  const ctx = useContext(WorkflowEngineContext)
  if (!ctx) throw new Error('useWorkflowEngine must be used within WorkflowEngineProvider')
  return ctx
}
