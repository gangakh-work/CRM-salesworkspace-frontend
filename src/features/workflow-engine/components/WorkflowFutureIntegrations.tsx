import { Cloud, Database, Mail, MessageSquare, Workflow, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import type { FutureIntegration } from '@/features/workflow-engine/types/workflow.types'

const INTEGRATIONS: { id: FutureIntegration; label: string; icon: typeof Cloud; description: string }[] = [
  { id: 'power_automate', label: 'Power Automate', icon: Workflow, description: 'Trigger and orchestrate cloud flows' },
  { id: 'dataverse', label: 'Dataverse', icon: Database, description: 'Persist workflow state and entities' },
  { id: 'azure_openai', label: 'Azure OpenAI', icon: Cloud, description: 'AI-assisted routing and recommendations' },
  { id: 'teams', label: 'Teams', icon: MessageSquare, description: 'Approval cards and notifications in Teams' },
  { id: 'outlook', label: 'Outlook', icon: Mail, description: 'Email triggers and calendar integration' },
]

export function WorkflowFutureIntegrations() {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="size-4 text-muted-foreground" />
        <Typography variant="body" className="text-sm font-semibold">Future Integrations</Typography>
        <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map(({ id, label, icon: Icon, description }) => (
          <div key={id} className="rounded-lg border border-border/40 bg-background/60 p-3 opacity-70">
            <div className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" />
              <Typography variant="body" className="text-sm font-medium">{label}</Typography>
            </div>
            <Typography variant="caption" tone="muted" className="mt-1 block text-xs">{description}</Typography>
          </div>
        ))}
      </div>
    </div>
  )
}
