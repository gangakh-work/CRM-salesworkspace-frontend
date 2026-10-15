import {
  AlertTriangle,
  Bot,
  Calendar,
  ChevronDown,
  Lightbulb,
  Mail,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { AI_QUICK_COMMANDS } from '@/features/lead-management/lib/lead-360'
import { cn } from '@/lib/utils'

const LEAD_COMMAND_PROMPTS: Record<string, string> = {
  summary: 'Generate a concise summary for this lead',
  email: 'Draft a professional follow-up email for this lead',
  win: 'Predict win probability for this lead',
  meeting: 'Suggest the next meeting slot for this lead',
  followup: 'Recommend the best follow-up action for this lead',
}

const OPP_COMMANDS = [
  {
    id: 'summary',
    label: 'Deal Summary',
    prompt: 'Summarize this opportunity and key next steps',
  },
  {
    id: 'risk',
    label: 'Risk Analysis',
    prompt: 'Analyze risks for this opportunity',
  },
  {
    id: 'email',
    label: 'Draft Email',
    prompt: 'Draft a follow-up email for this opportunity',
  },
  {
    id: 'forecast',
    label: 'Forecast Insight',
    prompt: 'Provide forecast category recommendation for this deal',
  },
] as const

function insightCards(
  metadata: Record<string, string>,
  entityType: string,
) {
  if (entityType === 'lead') {
    const status = metadata.status ?? 'unknown'
    const score = metadata.score ?? '—'

    return [
      {
        id: 'action',
        icon: Zap,
        title: 'Suggested Next Action',
        description: `Lead is ${status.replace(
          /\_/g,
          ' ',
        )} — use quick commands below for AI-powered recommendations.`,
        confidence: 92,
      },
      {
        id: 'risk',
        icon: AlertTriangle,
        title: 'Risk Analysis',
        description: `Score ${score} — monitor engagement and follow-up cadence to prevent the deal going cold.`,
        confidence: 74,
      },
      {
        id: 'followup',
        icon: Target,
        title: 'Recommended Follow-up',
        description: `Reach out regarding ${
          metadata.company ?? 'this account'
        } while status is ${status.replace(/\_/g, ' ')}.`,
        confidence: 85,
      },
    ]
  }

  if (entityType === 'opportunity') {
    return [
      {
        id: 'stage',
        icon: TrendingUp,
        title: 'Stage Intelligence',
        description: `Currently in ${
          metadata.stage?.replace(/\_/g, ' ') ?? 'pipeline'
        } at ${metadata.probability ?? '—'}% probability.`,
        confidence: 88,
      },
      {
        id: 'customer',
        icon: Bot,
        title: 'Account Context',
        description: `${metadata.customer ?? 'Customer'} · Owner: ${
          metadata.owner ?? 'Unassigned'
        }`,
        confidence: undefined,
      },
      {
        id: 'next',
        icon: Lightbulb,
        title: 'Next Best Action',
        description:
          'Use quick commands to draft emails, assess risk, or refine forecast category.',
        confidence: 90,
      },
    ]
  }

  return []
}

export function AiEntityInsights() {
  const {
    pageContext,
    sendMessage,
    isGenerating,
  } = useAiCopilot()

  const {
    entityType,
    entityName,
    metadata,
  } = pageContext

  /*
   * Quick Actions are collapsed by default.
   *
   * This gives the chat area maximum space when
   * the Sales Assistant is opened.
   */
  const [expanded, setExpanded] = useState(false)

  if (!entityType || !entityName) {
    return null
  }

  const meta = metadata ?? {}

  const cards = insightCards(
    meta,
    entityType,
  )

  const commands =
    entityType === 'lead'
      ? AI_QUICK_COMMANDS.map((c) => ({
          id: c.id,
          label: c.label,
          prompt: `${
            LEAD_COMMAND_PROMPTS[c.id] ??
            c.label
          } — ${entityName}${
            meta.company
              ? ` at ${meta.company}`
              : ''
          }`,
        }))
      : OPP_COMMANDS.map((c) => ({
          id: c.id,
          label: c.label,
          prompt: `${c.prompt} — ${entityName}`,
        }))

  return (
    <div className="px-3 pb-2">
      {/* =====================================================
          COLLAPSED QUICK ACTIONS HEADER
          ===================================================== */}

      <button
        type="button"
        onClick={() =>
          setExpanded((current) => !current)
        }
        className={cn(
          'flex w-full items-center justify-between',
          'rounded-lg border border-border/60',
          'bg-muted/20 px-3 py-2',
          'text-left transition-colors',
          'hover:bg-muted/40',
          'focus:outline-none focus:ring-2 focus:ring-primary/30',
        )}
        aria-expanded={expanded}
        aria-label={
          expanded
            ? 'Minimize quick actions'
            : 'Show quick actions'
        }
      >
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              'flex size-7 shrink-0',
              'items-center justify-center',
              'rounded-md bg-primary/10',
            )}
          >
            <Sparkles className="size-3.5 text-primary" />
          </div>

          <div className="min-w-0">
            <Typography
              variant="caption"
              className="font-semibold"
            >
              Quick Actions
            </Typography>

            <Typography
              variant="caption"
              tone="muted"
              className="block truncate text-[10px]"
            >
              {entityType === 'lead'
                ? `Actions for ${entityName}`
                : `Actions for ${entityName}`}
            </Typography>
          </div>
        </div>

        <ChevronDown
          className={cn(
            'size-4 shrink-0',
            'text-muted-foreground',
            'transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {/* =====================================================
          EXPANDED QUICK ACTIONS
          ===================================================== */}

      {expanded && (
        <div className="mt-2 space-y-3">
          {/* -------------------------------------------------
              INTELLIGENCE CARDS
              ------------------------------------------------- */}

          {cards.length > 0 && (
            <div className="space-y-2">
              <Typography
                variant="caption"
                className="font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Intelligence
              </Typography>

              {cards.map((card) => {
                const Icon = card.icon

                return (
                  <div
                    key={card.id}
                    className={cn(
                      'rounded-xl border',
                      'border-border/60',
                      'bg-card/60 p-3',
                      'shadow-elevation-1',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          'flex size-7 shrink-0',
                          'items-center justify-center',
                          'rounded-lg bg-primary/10',
                        )}
                      >
                        <Icon className="size-3.5 text-primary" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Typography
                            variant="body"
                            className="text-xs font-semibold"
                          >
                            {card.title}
                          </Typography>

                          {card.confidence !=
                            null && (
                            <Badge
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {card.confidence}%
                            </Badge>
                          )}
                        </div>

                        <Typography
                          variant="caption"
                          tone="muted"
                          className="mt-1 leading-relaxed"
                        >
                          {card.description}
                        </Typography>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* -------------------------------------------------
              SUGGESTED COMMANDS
              ------------------------------------------------- */}

          <div>
            <Typography
              variant="caption"
              className="mb-2 font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Suggested
            </Typography>

            <div className="grid gap-1.5">
              {commands.map(
                ({
                  id,
                  label,
                  prompt,
                }) => (
                  <Button
                    key={id}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isGenerating}
                    className={cn(
                      'h-auto justify-start gap-2',
                      'py-2 text-xs',
                    )}
                    onClick={() =>
                      void sendMessage(prompt)
                    }
                  >
                    {/* Summary */}
                    {id === 'summary' && (
                      <Sparkles className="size-3.5 shrink-0 text-primary" />
                    )}

                    {/* Email */}
                    {id === 'email' && (
                      <Mail className="size-3.5 shrink-0 text-primary" />
                    )}

                    {/* Win probability */}
                    {id === 'win' && (
                      <TrendingUp className="size-3.5 shrink-0 text-primary" />
                    )}

                    {/* Meeting */}
                    {id === 'meeting' && (
                      <Calendar className="size-3.5 shrink-0 text-primary" />
                    )}

                    {/* Follow-up */}
                    {id === 'followup' && (
                      <Target className="size-3.5 shrink-0 text-primary" />
                    )}

                    {/* Risk */}
                    {id === 'risk' && (
                      <AlertTriangle className="size-3.5 shrink-0 text-primary" />
                    )}

                    {/* Forecast */}
                    {id === 'forecast' && (
                      <TrendingUp className="size-3.5 shrink-0 text-primary" />
                    )}

                    <span className="truncate">
                      {label}
                    </span>
                  </Button>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}