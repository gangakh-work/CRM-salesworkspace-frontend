import { motion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Typography } from '@/components/ui/typography'
import { LeadActivitiesPanel } from '@/features/lead-management/components/detail/LeadActivitiesPanel'
import { LeadAiPanel } from '@/features/lead-management/components/detail/LeadAiPanel'
import { LeadAttachmentsPanel } from '@/features/lead-management/components/detail/LeadAttachmentsPanel'
import { LeadEmailsPanel } from '@/features/lead-management/components/detail/LeadEmailsPanel'
import { LeadHistoryPanel } from '@/features/lead-management/components/detail/LeadHistoryPanel'
import { LeadMeetingsPanel } from '@/features/lead-management/components/detail/LeadMeetingsPanel'
import { LeadNotesPanel } from '@/features/lead-management/components/detail/LeadNotesPanel'
import { LeadTimelinePanel } from '@/features/lead-management/components/detail/LeadTimelinePanel'
import { LeadScoreBadge, PriorityBadge, StatusBadge } from '@/features/lead-management/components/LeadBadges'
import { LeadQuickActions } from '@/features/lead-management/components/workflow/LeadQuickActions'
import { LeadWorkflowStepper } from '@/features/lead-management/components/workflow/LeadWorkflowStepper'
import { formatCurrency } from '@/lib/formatters'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import { fadeIn } from '@/design-system/animations/motion'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activities', label: 'Activities' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'notes', label: 'Notes' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'emails', label: 'Emails' },
  { id: 'history', label: 'History' },
  { id: 'ai', label: 'AI Insights' },
] as const

export function LeadDetailDrawer() {
  const { selectedLead, selectedLeadExtras, drawerOpen, closeDrawer } = useLeadManagement()

  if (!selectedLead) return null

  const lead = selectedLead
  const extras = selectedLeadExtras ?? {
    timeline: [],
    activities: [],
    notes: [],
    attachments: [],
    meetings: [],
    emails: [],
  }

  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto p-0 sm:max-w-2xl">
        <div className="border-b bg-gradient-to-r from-primary/10 to-violet-500/5 p-6">
          <SheetHeader className="text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SheetTitle className="text-xl">{lead.name}</SheetTitle>
                <Typography variant="body" tone="muted">{lead.title} at {lead.company}</Typography>
              </div>
              <LeadScoreBadge score={lead.score} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
              <Badge variant="outline">{lead.source}</Badge>
              {lead.convertedOpportunityId && (
                <Badge variant="success">{lead.convertedOpportunityId}</Badge>
              )}
            </div>
            <div className="mt-4">
              <LeadWorkflowStepper status={lead.status} />
            </div>
            <div className="mt-4">
              <LeadQuickActions lead={lead} />
            </div>
          </SheetHeader>
        </div>

        <Tabs defaultValue="overview" className="p-6">
          <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
            {TABS.map(({ id, label }) => (
              <TabsTrigger key={id} value={id} className="text-xs">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <motion.div variants={fadeIn} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2">
              <InfoField label="Email" value={lead.email} />
              <InfoField label="Phone" value={lead.phone} />
              <InfoField label="Industry" value={lead.industry} />
              <InfoField label="Country" value={lead.country} />
              <InfoField label="Owner" value={lead.owner} />
              <InfoField label="Budget" value={formatCurrency(lead.budget)} />
              <InfoField label="Expected Revenue" value={formatCurrency(lead.expectedRevenue)} />
              <InfoField label="Created" value={lead.createdDate} />
              <InfoField label="Last Activity" value={lead.lastActivity} />
              <InfoField label="Next Follow-up" value={lead.nextFollowUp} />
              {lead.description && (
                <div className="sm:col-span-2">
                  <InfoField label="Description" value={lead.description} />
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="activities">
            <LeadActivitiesPanel activities={extras.activities} />
          </TabsContent>
          <TabsContent value="timeline">
            <LeadTimelinePanel events={extras.timeline} />
          </TabsContent>
          <TabsContent value="notes">
            <LeadNotesPanel leadId={lead.id} notes={extras.notes} />
          </TabsContent>
          <TabsContent value="attachments">
            <LeadAttachmentsPanel attachments={extras.attachments} />
          </TabsContent>
          <TabsContent value="meetings">
            <LeadMeetingsPanel meetings={extras.meetings} />
          </TabsContent>
          <TabsContent value="emails">
            <LeadEmailsPanel emails={extras.emails} />
          </TabsContent>
          <TabsContent value="history">
            <LeadHistoryPanel events={extras.timeline} />
          </TabsContent>
          <TabsContent value="ai">
            <LeadAiPanel lead={lead} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <Typography variant="caption" tone="muted">{label}</Typography>
      <Typography variant="body" className="text-sm font-medium">{value}</Typography>
    </div>
  )
}
