import { motion } from 'framer-motion'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Typography } from '@/components/ui/typography'
import { LeadActivitiesPanel } from '@/features/lead-management/components/detail/LeadActivitiesPanel'
import { LeadEmailsPanel } from '@/features/lead-management/components/detail/LeadEmailsPanel'
import { LeadMeetingsPanel } from '@/features/lead-management/components/detail/LeadMeetingsPanel'
import { LeadNotesPanel } from '@/features/lead-management/components/detail/LeadNotesPanel'
import { Lead360AttachmentsGrid } from '@/features/lead-management/components/workspace360/Lead360AttachmentsGrid'
import { Lead360Overview } from '@/features/lead-management/components/workspace360/Lead360Overview'
import { Lead360ProposalHistory } from '@/features/lead-management/components/workspace360/Lead360ProposalHistory'
import { Lead360RelatedOpportunities } from '@/features/lead-management/components/workspace360/Lead360RelatedOpportunities'
import { Lead360TasksPanel } from '@/features/lead-management/components/workspace360/Lead360TasksPanel'
import { Lead360Timeline } from '@/features/lead-management/components/workspace360/Lead360Timeline'
import {
  getProposalHistory,
  getRelatedOpportunities,
} from '@/features/lead-management/lib/lead-360'
import type { Lead, Lead360Profile, LeadExtras } from '@/features/lead-management/types/lead.types'
import { queryKeys } from '@/infrastructure/api/query-keys'
import { pageTransition } from '@/design-system/animations/motion'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'activities', label: 'Activities' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'emails', label: 'Emails' },
  { id: 'notes', label: 'Notes' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'proposals', label: 'Proposals' },
] as const

export function Lead360CenterPanel({
  lead,
  profile,
  extras,
}: {
  lead: Lead
  profile: Lead360Profile
  extras: LeadExtras
}) {
  const [tab, setTab] = useState('overview')
  const linkedOpportunitiesQuery = useQuery({
    queryKey: queryKeys.opportunities.byLead(lead.id),
    queryFn: () =>
      import('@/features/opportunity-management/services/opportunity.service').then((m) =>
        m.opportunityService.getByLeadId(lead.id),
      ),
    staleTime: 15_000,
  })
  const opportunities = getRelatedOpportunities(lead, linkedOpportunitiesQuery.data ?? [])
  const proposals = getProposalHistory(lead)
  const tasks = extras.activities.filter((a) => a.type === 'task')

  return (
    <motion.main
      variants={pageTransition}
      initial="initial"
      animate="animate"
      className="flex min-w-0 flex-1 flex-col overflow-hidden"
    >
      <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col">
        <div className="shrink-0 overflow-x-auto border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md">
          <TabsList className="inline-flex h-auto w-max gap-1 rounded-xl bg-muted/50 p-1">
            {TABS.map(({ id, label }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="rounded-lg px-3.5 py-2 text-xs font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <TabsContent value="overview" className="mt-0">
            <Lead360Overview lead={lead} profile={profile} extras={extras} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
            <Lead360Timeline events={extras.timeline} />
          </TabsContent>
          <TabsContent value="activities" className="mt-0">
            <LeadActivitiesPanel activities={extras.activities} />
          </TabsContent>
          <TabsContent value="meetings" className="mt-0">
            <LeadMeetingsPanel meetings={extras.meetings} />
          </TabsContent>
          <TabsContent value="emails" className="mt-0">
            <LeadEmailsPanel emails={extras.emails} />
          </TabsContent>
          <TabsContent value="notes" className="mt-0">
            <LeadNotesPanel leadId={lead.id} notes={extras.notes} />
          </TabsContent>
          <TabsContent value="tasks" className="mt-0">
            <Lead360TasksPanel tasks={tasks} />
          </TabsContent>
          <TabsContent value="attachments" className="mt-0">
            <Lead360AttachmentsGrid attachments={extras.attachments} />
          </TabsContent>
          <TabsContent value="opportunities" className="mt-0">
            {linkedOpportunitiesQuery.isLoading ? (
              <Typography variant="caption" tone="muted">Loading related opportunities from Dataverse…</Typography>
            ) : linkedOpportunitiesQuery.isError ? (
              <Typography variant="caption" tone="muted">
                Unable to load related opportunities. Try refreshing the page.
              </Typography>
            ) : (
              <Lead360RelatedOpportunities opportunities={opportunities} />
            )}
          </TabsContent>
          <TabsContent value="proposals" className="mt-0">
            <Lead360ProposalHistory proposals={proposals} leadStatus={lead.status} />
          </TabsContent>
        </div>
      </Tabs>
    </motion.main>
  )
}
