import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Pause, Play, Sparkles, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Typography } from '@/components/ui/typography'
import { ApprovalCard } from '@/features/workflow-engine/components/ApprovalCard'
import { ProgressIndicator } from '@/features/workflow-engine/components/ProgressIndicator'
import { WorkflowActivityFeed, WorkflowTimeline } from '@/features/workflow-engine/components/WorkflowTimeline'
import { WorkflowBuilder } from '@/features/workflow-engine/components/WorkflowBuilder'
import { WorkflowChecklist } from '@/features/workflow-engine/components/WorkflowChecklist'
import { WorkflowComments } from '@/features/workflow-engine/components/WorkflowComments'
import { WorkflowFutureIntegrations } from '@/features/workflow-engine/components/WorkflowFutureIntegrations'
import { WorkflowStepper } from '@/features/workflow-engine/components/WorkflowStepper'
import { useWorkflowEngine } from '@/features/workflow-engine/context/WorkflowEngineProvider'
import { getTemplate } from '@/features/workflow-engine/lib/workflow-definitions'
import { formatWorkflowStatus } from '@/features/workflow-engine/lib/workflow-engine'
import { pageTransition } from '@/design-system/animations/motion'

export function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const {
    getWorkflow,
    completeStep,
    approveStep,
    rejectStep,
    addComment,
    toggleChecklistItem,
    pauseWorkflow,
    resumeWorkflow,
    cancelWorkflow,
  } = useWorkflowEngine()
  const [tab, setTab] = useState('execution')

  const workflow = id ? getWorkflow(id) : undefined
  const template = workflow ? getTemplate(workflow.templateId) : undefined
  const currentStep = workflow?.steps.find((s) => s.id === workflow.currentStepId)
  const pendingApprovals = workflow?.approvals.filter((a) => a.status === 'pending') ?? []
  const isTerminal = workflow?.status === 'completed' || workflow?.status === 'cancelled'

  if (!workflow || !template) {
    return <Navigate to="/workspace/workflows" replace />
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background/40"
    >
      <header className="shrink-0 border-b border-border/60 bg-gradient-to-r from-background via-primary/5 to-violet-500/5 px-4 py-3 md:px-6">
        <Link to="/workspace/workflows" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-3.5" />
          Back to Workflows
        </Link>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Typography variant="heading-m" className="truncate">{workflow.name}</Typography>
              <Sparkles className="size-4 shrink-0 text-primary/60" />
            </div>
            <Typography variant="caption" tone="muted">
              {template.name} · {workflow.owner}
              {workflow.entityName && ` · ${workflow.entityType}: ${workflow.entityName}`}
            </Typography>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={workflow.status === 'completed' ? 'success' : workflow.status === 'paused' ? 'warning' : 'info'} className="capitalize">
                {formatWorkflowStatus(workflow.status)}
              </Badge>
              {pendingApprovals.length > 0 && (
                <Badge variant="warning">{pendingApprovals.length} pending approval</Badge>
              )}
            </div>
          </div>

          {!isTerminal && (
            <div className="flex flex-wrap gap-2">
              {currentStep && (currentStep.status === 'in_progress' || currentStep.status === 'awaiting_approval') && (
                <Button variant="primary" size="sm" className="gap-1" onClick={() => completeStep(workflow.id, currentStep.id)}>
                  <CheckCircle2 className="size-4" />
                  Complete Step
                </Button>
              )}
              {workflow.status === 'active' ? (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => pauseWorkflow(workflow.id)}>
                  <Pause className="size-4" />
                  Pause
                </Button>
              ) : workflow.status === 'paused' ? (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => resumeWorkflow(workflow.id)}>
                  <Play className="size-4" />
                  Resume
                </Button>
              ) : null}
              <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={() => cancelWorkflow(workflow.id)}>
                <XCircle className="size-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4">
          <ProgressIndicator value={workflow.progress} size="lg" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <WorkflowStepper
            steps={workflow.steps}
            stepDefinitions={template.steps}
            currentStepId={workflow.currentStepId}
          />
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 overflow-x-auto border-b border-border/60 px-4 py-2">
          <TabsList className="inline-flex h-auto w-max gap-1 bg-transparent p-0">
            {['execution', 'approvals', 'comments', 'checklist', 'activity', 'audit', 'builder', 'integrations'].map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="rounded-lg px-3 py-1.5 text-xs capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <TabsContent value="execution" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-card/60 p-5">
                <Typography variant="body" className="mb-4 font-semibold">Current Step</Typography>
                {currentStep ? (
                  <div className="space-y-2">
                    <Typography variant="heading-m" className="text-base">{currentStep.name}</Typography>
                    <Typography variant="caption" tone="muted">
                      {template.steps.find((d) => d.id === currentStep.definitionId)?.description}
                    </Typography>
                    <Badge variant="secondary" className="capitalize">{currentStep.status.replace('_', ' ')}</Badge>
                    <Typography variant="caption" className="block">Owner: {currentStep.owner}</Typography>
                  </div>
                ) : (
                  <Typography variant="caption" tone="muted">Workflow complete.</Typography>
                )}
              </div>
              <div className="rounded-xl border border-border/60 bg-card/60 p-5">
                <Typography variant="body" className="mb-4 font-semibold">Step Progress</Typography>
                <WorkflowStepper
                  steps={workflow.steps}
                  stepDefinitions={template.steps}
                  currentStepId={workflow.currentStepId}
                  orientation="vertical"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="approvals" className="mt-0">
            <div className="space-y-3">
              {workflow.approvals.length === 0 ? (
                <Typography variant="caption" tone="muted" className="py-8 text-center">No approvals for this workflow.</Typography>
              ) : (
                workflow.approvals.map((a) => (
                  <ApprovalCard
                    key={a.id}
                    approval={a}
                    readonly={isTerminal}
                    onApprove={(comment) => approveStep(workflow.id, a.id, comment)}
                    onReject={(comment) => rejectStep(workflow.id, a.id, comment)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="comments" className="mt-0">
            <WorkflowComments
              comments={workflow.comments}
              onAdd={(content) => addComment(workflow.id, content, currentStep?.id)}
              readonly={isTerminal}
            />
          </TabsContent>

          <TabsContent value="checklist" className="mt-0">
            <WorkflowChecklist
              items={workflow.checklist}
              onToggle={(itemId) => toggleChecklistItem(workflow.id, itemId)}
              readonly={isTerminal}
            />
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <WorkflowActivityFeed activities={workflow.activities} />
          </TabsContent>

          <TabsContent value="audit" className="mt-0">
            <WorkflowTimeline entries={workflow.auditHistory} />
          </TabsContent>

          <TabsContent value="builder" className="mt-0">
            <WorkflowBuilder template={template} />
          </TabsContent>

          <TabsContent value="integrations" className="mt-0">
            <WorkflowFutureIntegrations />
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  )
}
