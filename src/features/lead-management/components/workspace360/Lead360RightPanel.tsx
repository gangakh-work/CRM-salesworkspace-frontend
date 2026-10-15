import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Bot,
  Calendar,
  Lightbulb,
  Mail,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { AI_QUICK_COMMANDS, getLead360AiInsights } from '@/features/lead-management/lib/lead-360'
import type { Lead, Lead360Profile } from '@/features/lead-management/types/lead.types'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

const INSIGHT_ICONS = {
  action: Zap,
  risk: AlertTriangle,
  followup: Target,
  summary: Calendar,
  insight: Lightbulb,
}

const COMMAND_PROMPTS: Record<string, string> = {
  summary: 'Generate a concise summary for this lead',
  email: 'Draft a professional follow-up email for this lead',
  win: 'Predict win probability for this lead',
  meeting: 'Suggest the next meeting slot for this lead',
  followup: 'Recommend the best follow-up action for this lead',
}

export function Lead360RightPanel({ lead, profile }: { lead: Lead; profile: Lead360Profile }) {
  const { open } = useAiCopilot()
  const [query, setQuery] = useState('')
  const insights = getLead360AiInsights(lead, profile)

  const askAssistant = (prompt: string) => {
    open({ prompt: `${prompt} — ${lead.name} at ${lead.company}` })
  }

  return (
    <motion.aside
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="flex h-full w-full flex-col border-l border-border/60 bg-gradient-to-b from-violet-500/5 via-background/95 to-background backdrop-blur-xl xl:w-80 xl:shrink-0"
    >
      <div className="border-b border-border/60 p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div>
            <Typography variant="body" className="text-sm font-semibold">AI Assistant</Typography>
            <Typography variant="caption" tone="muted">Sales Assistant · Live CRM data</Typography>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Ask about this lead…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 bg-background/80 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                askAssistant(query.trim())
                setQuery('')
              }
            }}
          />
          <Button
            size="icon-sm"
            disabled={!query.trim()}
            onClick={() => {
              askAssistant(query.trim())
              setQuery('')
            }}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4 p-4">
          {insights.map((insight) => {
            const Icon = INSIGHT_ICONS[insight.type] ?? Bot
            return (
              <motion.div
                key={insight.id}
                variants={fadeIn}
                className="rounded-xl border border-border/60 bg-card/60 p-3 shadow-elevation-1"
              >
                <div className="flex items-start gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Typography variant="body" className="text-xs font-semibold">{insight.title}</Typography>
                      {insight.confidence && (
                        <Badge variant="secondary" className="text-[10px]">{insight.confidence}%</Badge>
                      )}
                    </div>
                    <Typography variant="caption" tone="muted" className="mt-1 leading-relaxed">
                      {insight.description}
                    </Typography>
                  </div>
                </div>
              </motion.div>
            )
          })}

          <Separator />

          <div>
            <Typography variant="caption" className="mb-2 font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Commands
            </Typography>
            <div className="grid gap-2">
              {AI_QUICK_COMMANDS.map(({ id, label }) => (
                <Button
                  key={id}
                  variant="outline"
                  size="sm"
                  className="h-auto justify-start gap-2 py-2.5 text-xs"
                  onClick={() => askAssistant(COMMAND_PROMPTS[id] ?? label)}
                >
                  {id === 'summary' && <Sparkles className="size-3.5 text-primary" />}
                  {id === 'email' && <Mail className="size-3.5 text-primary" />}
                  {id === 'win' && <TrendingUp className="size-3.5 text-primary" />}
                  {id === 'meeting' && <Calendar className="size-3.5 text-primary" />}
                  {id === 'followup' && <Target className="size-3.5 text-primary" />}
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
      </ScrollArea>
    </motion.aside>
  )
}

export function Lead360AiMobileSheet({
  lead,
  profile,
  open,
  onOpenChange,
}: {
  lead: Lead
  profile: Lead360Profile
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <div className={cn('xl:hidden', !open && 'hidden')}>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => onOpenChange(false)} />
      )}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-sm shadow-elevation-4 transition-transform',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <Lead360RightPanel lead={lead} profile={profile} />
      </div>
    </div>
  )
}
