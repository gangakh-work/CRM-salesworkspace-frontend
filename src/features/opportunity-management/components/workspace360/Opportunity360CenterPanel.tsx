import { motion } from 'framer-motion'
import { useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  OpportunityActivitiesPanel,
  OpportunityEmailsPanel,
  OpportunityMeetingsPanel,
} from '@/features/opportunity-management/components/detail/OpportunityActivityPanels'
import { OpportunityTimeline } from '@/features/opportunity-management/components/detail/OpportunityTimeline'
import { OpportunityNotesPanel } from '@/features/opportunity-management/components/detail/OpportunityNotesPanel'
import {
  OpportunityAiPanel,
  OpportunityCommercialsPanel,
  OpportunityOverviewPanel,
  OpportunityProposalPanel,
} from '@/features/opportunity-management/components/workspace360/Opportunity360Panels'
import { OpportunityLostInfoPanel } from '@/features/opportunity-management/components/detail/OpportunityLostInfoPanel'
import { OpportunityStageHistoryPanel } from '@/features/opportunity-management/components/detail/OpportunityStageHistoryPanel'
import { forecastEngineService } from '@/features/opportunity-management/services/forecast-engine.service'
import { OpportunityWorkflowStepper } from '@/features/opportunity-management/components/workflow/OpportunityWorkflowStepper'
import { formatCurrency } from '@/lib/formatters'
import type { Opportunity, OpportunityExtras } from '@/features/opportunity-management/types/opportunity.types'
import { pageTransition } from '@/design-system/animations/motion'
import { Typography } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { Download } from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'stage-history', label: 'Stage History' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'activities', label: 'Activities' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'emails', label: 'Emails' },
  { id: 'documents', label: 'Documents' },
  { id: 'notes', label: 'Notes' },
  { id: 'commercials', label: 'Commercials' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'ai', label: 'AI Insights' },
] as const

export function Opportunity360CenterPanel({
  opp,
  extras,
}: {
  opp: Opportunity
  extras: OpportunityExtras
}) {
  const [tab, setTab] = useState(opp.status === 'lost' ? 'lost-info' : 'overview')
  const forecast = forecastEngineService.recalculateForStage(opp, opp.stage)
  const weighted = opp.expectedRevenue * (opp.probability / 100)

  const tabs = [
    ...(opp.status === 'lost' ? [{ id: 'lost-info', label: 'Lost Information' }] : []),
    ...TABS,
  ]

  return (
    <motion.main
      variants={pageTransition}
      initial="initial"
      animate="animate"
      className="flex min-w-0 flex-1 flex-col overflow-hidden"
    >
      <div className="shrink-0 border-b border-border/60 px-4 py-3">
        <OpportunityWorkflowStepper stage={opp.stage} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col">
        <div className="shrink-0 overflow-x-auto border-b border-border/60 bg-background/80 px-4 py-2 backdrop-blur-sm">
          <TabsList className="inline-flex h-auto w-max gap-1 bg-transparent p-0">
            {tabs.map(({ id, label }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="rounded-lg px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <TabsContent value="lost-info" className="mt-0">
            <OpportunityLostInfoPanel opp={opp} extras={extras} />
          </TabsContent>
          <TabsContent value="overview" className="mt-0">
            <OpportunityOverviewPanel opp={opp} />
          </TabsContent>
          <TabsContent value="stage-history" className="mt-0">
            <OpportunityStageHistoryPanel history={extras.stageHistory ?? []} />
          </TabsContent>
          <TabsContent value="contacts" className="mt-0">
            <div className="space-y-3">
              {extras.contacts.map((c) => (
                <div key={c.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Typography variant="body" className="font-semibold">{c.name}</Typography>
                      <Typography variant="caption" tone="muted">{c.title}</Typography>
                    </div>
                    {c.isPrimary && <Badge variant="info">Primary</Badge>}
                  </div>
                  <Typography variant="caption" className="mt-2 block">{c.email} · {c.phone}</Typography>
                  <Badge variant="secondary" className="mt-2 capitalize">{c.role.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
            <OpportunityTimeline events={extras.timeline} />
          </TabsContent>
          <TabsContent value="activities" className="mt-0">
            <OpportunityActivitiesPanel activities={extras.activities} />
          </TabsContent>
          <TabsContent value="meetings" className="mt-0">
            <OpportunityMeetingsPanel meetings={extras.meetings} />
          </TabsContent>
          <TabsContent value="emails" className="mt-0">
            <OpportunityEmailsPanel emails={extras.emails} />
          </TabsContent>
          <TabsContent value="documents" className="mt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              {extras.documents.length === 0 ? (
                <Typography variant="caption" tone="muted">No documents uploaded.</Typography>
              ) : (
                extras.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                    <div>
                      <Typography variant="body" className="text-sm font-medium">{doc.name}</Typography>
                      <Typography variant="caption" tone="muted">{doc.size} · {doc.uploadedAt}</Typography>
                    </div>
                    <Download className="size-4 text-muted-foreground" />
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="notes" className="mt-0">
            <OpportunityNotesPanel oppId={opp.id} notes={extras.notes} />
          </TabsContent>
          <TabsContent value="commercials" className="mt-0">
            <OpportunityCommercialsPanel commercials={extras.commercials} />
          </TabsContent>
          <TabsContent value="proposal" className="mt-0">
            <OpportunityProposalPanel proposals={extras.proposals} />
          </TabsContent>
          <TabsContent value="forecast" className="mt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 p-4">
                <Typography variant="caption" tone="muted">Pipeline Revenue</Typography>
                <Typography variant="heading-m">{formatCurrency(opp.expectedRevenue, opp.currency)}</Typography>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <Typography variant="caption" tone="muted">Weighted Revenue</Typography>
                <Typography variant="heading-m">{formatCurrency(weighted, opp.currency)}</Typography>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <Typography variant="caption" tone="muted">Expected Revenue</Typography>
                <Typography variant="heading-m">{formatCurrency(opp.expectedRevenue, opp.currency)}</Typography>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <Typography variant="caption" tone="muted">Forecast Category</Typography>
                <Typography variant="heading-m" className="capitalize">
                  {(forecast.forecastCategory ?? opp.forecastCategory).replace('_', ' ')}
                </Typography>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <Typography variant="caption" tone="muted">Win Probability</Typography>
                <Typography variant="heading-m">{opp.probability}%</Typography>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <Typography variant="caption" tone="muted">Close Date</Typography>
                <Typography variant="heading-m">{opp.closeDate}</Typography>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="ai" className="mt-0">
            <OpportunityAiPanel opp={opp} />
          </TabsContent>
        </div>
      </Tabs>
    </motion.main>
  )
}
