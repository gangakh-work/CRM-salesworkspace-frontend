import { Timeline } from '@/components/patterns/data-display'
import { Mail, Phone, Target } from 'lucide-react'
import { useNavigateToLead } from '@/features/lead-management/hooks/useNavigateToLead'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import { EmptyState } from '@/components/global/EmptyState'

export function LeadTimelineView() {
  const { filteredLeads } = useLeadManagement()
  const navigateToLead = useNavigateToLead()

  if (filteredLeads.length === 0) {
    return <EmptyState icon={Target} title="No leads" description="Adjust filters to see timeline." />
  }

  const sorted = [...filteredLeads].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity))

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
      <Timeline
        items={sorted.map((lead) => ({
          id: lead.id,
          title: `${lead.name} — ${lead.company}`,
          description: `${lead.status} · Score ${lead.score} · ${lead.owner}`,
          timestamp: lead.lastActivity,
          icon: lead.email ? Mail : Phone,
        }))}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {sorted.slice(0, 5).map((lead) => (
          <button
            key={lead.id}
            type="button"
            className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
            onClick={() => navigateToLead(lead)}
          >
            View {lead.name}
          </button>
        ))}
      </div>
    </div>
  )
}
