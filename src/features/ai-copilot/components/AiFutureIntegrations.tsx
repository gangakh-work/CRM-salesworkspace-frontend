import { useEffect, useState } from 'react'
import { Cloud, Database, Search, Share2, Workflow, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { fetchAiPlatformStatus } from '@/features/ai-copilot/api/SalesAssistantApi'
import type { FutureIntegration } from '@/features/ai-copilot/types/copilot.types'

const INTEGRATIONS: { id: FutureIntegration; label: string; icon: typeof Cloud }[] = [
  { id: 'azure_openai', label: 'Azure OpenAI', icon: Cloud },
  { id: 'dataverse', label: 'Dataverse', icon: Database },
  { id: 'ai_search', label: 'AI Search', icon: Search },
  { id: 'power_automate', label: 'Power Automate', icon: Workflow },
  { id: 'sharepoint', label: 'SharePoint', icon: Share2 },
  { id: 'teams', label: 'Teams', icon: Zap },
]

const ACTIVE_INTEGRATIONS = new Set<FutureIntegration>(['azure_openai', 'dataverse'])

export function AiFutureIntegrations() {
  const [modelLabel, setModelLabel] = useState<string | null>(null)

  useEffect(() => {
    void fetchAiPlatformStatus()
      .then((status) => {
        if (status.available) {
          setModelLabel(status.model)
        }
      })
      .catch(() => {
        setModelLabel(null)
      })
  }, [])

  return (
    <div className="border-t border-border/60 px-3 py-2">
      <Typography variant="caption" tone="muted" className="text-[10px] uppercase tracking-wider">
        Integrations
      </Typography>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {INTEGRATIONS.map(({ id, label, icon: Icon }) => {
          const active = ACTIVE_INTEGRATIONS.has(id)
          return (
            <Badge
              key={id}
              variant={active ? 'secondary' : 'outline'}
              className={`gap-1 text-[10px] font-normal ${active ? '' : 'opacity-60'}`}
            >
              <Icon className="size-2.5" />
              {label}
              {id === 'azure_openai' && modelLabel ? ` · ${modelLabel}` : null}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
