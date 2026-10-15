import { PageHeader } from '@/components/layout/PageHeader'
import { DisqualificationReportPanel } from '@/features/dashboard/components/DisqualificationReportPanel'
import { LeadFunnelPanel } from '@/features/dashboard/components/LeadFunnelPanel'

export function DisqualificationReportPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <PageHeader
        title="Disqualification Report"
        description="Analytics on disqualified leads — top reasons, competitors, industries, and lead sources."
      />
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Lead Funnel</h2>
        <LeadFunnelPanel />
      </section>
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Disqualification Analytics</h2>
        <DisqualificationReportPanel />
      </section>
    </div>
  )
}
