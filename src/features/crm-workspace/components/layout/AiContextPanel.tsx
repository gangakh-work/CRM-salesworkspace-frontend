import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Lightbulb,
  Loader2,
  Maximize2,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { DashboardApi } from '@/features/dashboard/api/DashboardApi'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'
import { queryKeys } from '@/infrastructure/api/query-keys'
import { cn } from '@/lib/utils'

const severityVariant = {
  high: 'error' as const,
  medium: 'warning' as const,
  low: 'neutral' as const,
}

const SUGGESTED_PROMPTS = [
  { id: '1', label: 'Summarize pipeline', description: 'Get overview of open deals' },
  { id: '2', label: 'Generate email', description: 'Draft a follow-up email' },
  { id: '3', label: 'Create lead', description: 'Add new prospect quickly' },
  { id: '4', label: 'Search customer', description: 'Find account details' },
]

export function AiContextPanel() {
  const [query, setQuery] = useState('')
  const { open, setMode } = useAiCopilot()

  const recommendationsQuery = useQuery({
    queryKey: queryKeys.dashboard.aiRecommendations(),
    queryFn: () => DashboardApi.fetchAiRecommendations(),
    staleTime: 60_000,
  })

  const activitiesQuery = useQuery({
    queryKey: queryKeys.dashboard.upcomingActivities(),
    queryFn: () => DashboardApi.fetchUpcomingActivities(),
    staleTime: 60_000,
  })

  const recommendations = recommendationsQuery.data?.data ?? []
  const activities = activitiesQuery.data?.data ?? []
  const topRecommendation = recommendations[0]
  const isLoading = recommendationsQuery.isLoading || activitiesQuery.isLoading
  const hasError = recommendationsQuery.isError || activitiesQuery.isError

  const askAssistant = (prompt: string) => {
    open({ prompt })
    setQuery('')
  }

  return (
    <aside className="flex h-full w-[var(--workspace-ai-width)] shrink-0 flex-col border-l border-border/60 bg-gradient-to-b from-primary/5 via-background/95 to-background backdrop-blur-xl">
      <div className="border-b border-border/60 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Typography variant="body" className="text-sm font-semibold">
              Sales Assistant
            </Typography>
            <Typography variant="caption" tone="muted">
              Live CRM context
            </Typography>
          </div>
          {/* Maximize → opens fullscreen AI assistant */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setMode('fullscreen')
              open()
            }}
            aria-label="Open full screen assistant"
            title="Open full screen"
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>

        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Ask Sales Assistant..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) askAssistant(query.trim())
            }}
            className="h-9 bg-background/80 text-sm"
          />
          <Button
            size="icon-sm"
            disabled={!query.trim()}
            onClick={() => askAssistant(query.trim())}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 px-4 py-6 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <Typography variant="caption" tone="muted">Loading live CRM context…</Typography>
        </div>
      )}

      {hasError && !isLoading && (
        <div className="mx-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          <Typography variant="caption" tone="muted">
            Unable to load recommendations or activities. Check your Dataverse connection.
          </Typography>
        </div>
      )}

      <ScrollArea className="flex-1">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6 p-4"
        >
          <PanelSection title="Suggested Actions" icon={Zap}>
            <div className="space-y-2">
              {SUGGESTED_PROMPTS.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  variants={fadeIn}
                  className="flex w-full items-start gap-2 rounded-lg border border-border/60 bg-background/60 p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                  onClick={() => askAssistant(item.label)}
                >
                  <Bot className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <Typography variant="body" className="text-sm font-medium">
                      {item.label}
                    </Typography>
                    <Typography variant="caption" tone="muted">
                      {item.description}
                    </Typography>
                  </div>
                </motion.button>
              ))}
            </div>
          </PanelSection>

          <PanelSection title="Follow-ups" icon={ArrowRight}>
            <div className="space-y-2">
              {activities.length === 0 ? (
                <Typography variant="caption" tone="muted">
                  No upcoming activities from Dataverse.
                </Typography>
              ) : (
                activities.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border/60 bg-background/60 p-3"
                  >
                    <Typography variant="body" className="text-sm font-medium">
                      {item.subject}
                    </Typography>
                    <Typography variant="caption" tone="muted" className="mt-1">
                      {item.regarding} · {item.scheduled_start?.slice(0, 16) ?? 'Scheduled'}
                    </Typography>
                  </div>
                ))
              )}
            </div>
          </PanelSection>

          <PanelSection title="Next Best Action" icon={Lightbulb}>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <Typography variant="caption" className="leading-relaxed">
                {topRecommendation?.description ?? 'Connect to Dataverse to receive live recommendations.'}
              </Typography>
            </div>
          </PanelSection>

          <PanelSection title="Priority Leads" icon={AlertTriangle}>
            <div className="space-y-2">
              {recommendations.length === 0 ? (
                <Typography variant="caption" tone="muted">
                  No AI recommendations available yet.
                </Typography>
              ) : (
                recommendations.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    className={cn(
                      'rounded-lg border p-3',
                      rec.priority === 'high'
                        ? 'border-destructive/30 bg-destructive/5'
                        : 'border-warning/30 bg-warning/5',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Typography variant="caption" className="font-medium">
                        {rec.title}
                      </Typography>
                      <Badge variant={severityVariant[rec.priority as keyof typeof severityVariant] ?? 'neutral'} className="text-[10px]">
                        {rec.priority}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PanelSection>
        </motion.div>
      </ScrollArea>

      <div className="border-t border-border/60 p-3">
        <Typography variant="caption" tone="muted" className="text-center">
          Powered by Azure OpenAI · Live Dataverse context
        </Typography>
      </div>
    </aside>
  )
}

function PanelSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Bot
  children: ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <Typography variant="caption" className="font-semibold uppercase tracking-wider">
          {title}
        </Typography>
      </div>
      {children}
      <Separator className="mt-6" />
    </section>
  )
}
