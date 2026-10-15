import { motion } from 'framer-motion'

import { Download, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { ForecastBadge } from '@/features/opportunity-management/components/OpportunityBadges'
import { formatCurrency } from '@/lib/formatters'

import type {
  Opportunity,
  OpportunityCommercials,
  OpportunityProposal,
} from '@/features/opportunity-management/types/opportunity.types'

import { fadeIn } from '@/design-system/animations/motion'

const PROPOSAL_CONTENT_STORAGE_KEY =
  'sales-workspace:opportunity-proposal-content'

/**
 * Creates a safe filename for the downloaded proposal.
 */
function getProposalFileName(proposal: OpportunityProposal): string {
  const title = proposal.title
    .trim()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')

  const version = proposal.version
    .trim()
    .replace(/[^a-z0-9.-]+/gi, '_')

  return `${title || 'Proposal'}_${version || 'version'}.md`
}

/**
 * Loads the actual proposal content created when Generate Proposal
 * was clicked.
 */
function loadProposalContent(proposalId: string): string | null {
  try {
    const raw = localStorage.getItem(PROPOSAL_CONTENT_STORAGE_KEY)

    if (!raw) {
      return null
    }

    const stored = JSON.parse(raw) as Record<string, string>
    const content = stored[proposalId]

    if (typeof content !== 'string' || !content.trim()) {
      return null
    }

    return content
  } catch {
    return null
  }
}

/**
 * Downloads the actual generated proposal content.
 */
function downloadProposal(proposal: OpportunityProposal): void {
  const storedContent = loadProposalContent(proposal.id)

  const proposalContent =
    storedContent ??
    [
      '# Proposal',
      '',
      `**Title:** ${proposal.title}`,
      `**Version:** ${proposal.version}`,
      `**Status:** ${proposal.status}`,
      `**Generated Date:** ${proposal.generatedDate}`,
      `**Estimated Value:** ${formatCurrency(proposal.value)}`,
      '',
      '> This proposal was generated from the Sales Workspace.',
      '',
    ].join('\n')

  const blob = new Blob([proposalContent], {
    type: 'text/markdown;charset=utf-8',
  })

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url
  link.download = getProposalFileName(proposal)

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export function OpportunityOverviewPanel({
  opp,
}: {
  opp: Opportunity
}) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="grid gap-4 md:grid-cols-2"
    >
      <div className="rounded-xl border border-border/60 bg-card/60 p-5">
        <Typography variant="heading-m" className="mb-3">
          Deal Summary
        </Typography>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Customer</dt>
            <dd className="font-medium">{opp.customer}</dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-muted-foreground">Owner</dt>
            <dd>{opp.owner}</dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-muted-foreground">Region</dt>
            <dd>{opp.region}</dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-muted-foreground">Industry</dt>
            <dd>{opp.industry}</dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-muted-foreground">Close Date</dt>
            <dd>{opp.closeDate}</dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-muted-foreground">Forecast</dt>

            <dd>
              <ForecastBadge category={opp.forecastCategory} />
            </dd>
          </div>
        </dl>

        {opp.description && (
          <Typography
            variant="caption"
            tone="muted"
            className="mt-4 block"
          >
            {opp.description}
          </Typography>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-violet-500/5 p-5">
        <Typography variant="heading-m" className="mb-3">
          Key Metrics
        </Typography>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Typography variant="caption" tone="muted">
              Expected Revenue
            </Typography>

            <Typography variant="heading-m">
              {formatCurrency(
                opp.expectedRevenue,
                opp.currency,
              )}
            </Typography>
          </div>

          <div>
            <Typography variant="caption" tone="muted">
              Win Probability
            </Typography>

            <Typography variant="heading-m">
              {opp.probability}%
            </Typography>
          </div>

          <div>
            <Typography variant="caption" tone="muted">
              Weighted Value
            </Typography>

            <Typography variant="heading-m">
              {formatCurrency(
                (opp.expectedRevenue * opp.probability) / 100,
                opp.currency,
              )}
            </Typography>
          </div>

          <div>
            <Typography variant="caption" tone="muted">
              Last Activity
            </Typography>

            <Typography variant="body">
              {opp.lastActivity}
            </Typography>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function OpportunityCommercialsPanel({
  commercials,
}: {
  commercials: OpportunityCommercials
}) {
  const marginPct =
    commercials.revenue > 0
      ? Math.round(
          (commercials.margin / commercials.revenue) * 100,
        )
      : 0

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {[
        {
          label: 'Revenue',
          value: formatCurrency(
            commercials.revenue,
            commercials.currency,
          ),
        },
        {
          label: 'Cost',
          value: formatCurrency(
            commercials.cost,
            commercials.currency,
          ),
        },
        {
          label: 'Margin',
          value: `${formatCurrency(
            commercials.margin,
            commercials.currency,
          )} (${marginPct}%)`,
        },
        {
          label: 'Discount',
          value: `${commercials.discount}%`,
        },
        {
          label: 'Currency',
          value: commercials.currency,
        },
        {
          label: 'Forecast',
          value: commercials.forecast,
        },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="rounded-xl border border-border/60 bg-card/60 p-4"
        >
          <Typography variant="caption" tone="muted">
            {label}
          </Typography>

          <Typography
            variant="heading-m"
            className="mt-1 capitalize"
          >
            {value}
          </Typography>
        </div>
      ))}
    </motion.div>
  )
}

export function OpportunityProposalPanel({
  proposals,
}: {
  proposals: OpportunityProposal[]
}) {
  const current =
    proposals.find((p) => p.isCurrent) ?? proposals[0]

  if (!proposals.length) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center">
        <Typography variant="caption" tone="muted">
          No proposals yet. Use Generate Proposal to create one.
        </Typography>
      </div>
    )
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {current && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="info">
                Current Proposal
              </Badge>

              <Typography
                variant="heading-m"
                className="mt-2"
              >
                {current.title}
              </Typography>

              <Typography
                variant="caption"
                tone="muted"
              >
                Version {current.version} · Generated{' '}
                {current.generatedDate}
              </Typography>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadProposal(current)}
              type="button"
            >
              <Download className="size-4" />
              Download
            </Button>
          </div>

          <div className="mt-3 flex gap-2">
            <Badge
              variant="secondary"
              className="capitalize"
            >
              {current.status}
            </Badge>

            <Badge variant="success">
              {formatCurrency(current.value)}
            </Badge>
          </div>
        </div>
      )}

      <Typography variant="heading-m">
        Proposal Versions
      </Typography>

      <div className="space-y-2">
        {proposals.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-border/60 p-3"
          >
            <div>
              <Typography
                variant="body"
                className="text-sm font-medium"
              >
                {p.title}
              </Typography>

              <Typography
                variant="caption"
                tone="muted"
              >
                {p.version} · {p.generatedDate}
              </Typography>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="capitalize"
              >
                {p.status}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadProposal(p)}
                type="button"
                aria-label={`Download ${p.title} ${p.version}`}
              >
                <Download className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export function OpportunityAiPanel({
  opp,
}: {
  opp: Opportunity
}) {
  const insights = [
    {
      title: 'Opportunity Summary',
      content: `${opp.name} is a ${opp.priority}-priority deal with ${opp.customer} in ${opp.industry}. Currently in ${opp.stage} stage with ${opp.probability}% win probability.`,
    },
    {
      title: 'Win Probability',
      content: `AI estimates ${Math.min(
        opp.probability + 5,
        95,
      )}% likelihood based on stage velocity, engagement, and competitive signals.`,
    },
    {
      title: 'Competitor Analysis',
      content:
        'Primary competitor: Legacy ERP vendor. Differentiator: faster implementation and integrated AI copilot.',
    },
    {
      title: 'Suggested Next Action',
      content:
        opp.stage === 'negotiation'
          ? 'Schedule executive alignment call to resolve pricing objections.'
          : 'Send tailored ROI analysis to economic buyer.',
    },
    {
      title: 'Risk Analysis',
      content:
        opp.risk === 'high'
          ? 'Budget approval delayed. Recommend multi-threading with finance stakeholder.'
          : 'Low risk profile. Maintain momentum with weekly check-ins.',
    },
    {
      title: 'Commercial Suggestions',
      content: `Consider ${
        opp.stage === 'negotiation' ? '10%' : '5%'
      } strategic discount tied to multi-year commitment to accelerate close.`,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />

        <Typography variant="heading-m">
          AI Insights
        </Typography>

        <Badge variant="secondary">
          Placeholder
        </Badge>
      </div>

      {insights.map(({ title, content }) => (
        <div
          key={title}
          className="rounded-xl border border-border/60 bg-gradient-to-br from-violet-500/5 to-primary/5 p-4"
        >
          <Typography
            variant="body"
            className="text-sm font-semibold"
          >
            {title}
          </Typography>

          <Typography
            variant="caption"
            tone="muted"
            className="mt-1 block"
          >
            {content}
          </Typography>
        </div>
      ))}
    </div>
  )
}