import { PageHeader } from '@/components/layout/PageHeader'
import { DashboardChartsGrid } from '@/features/dashboard/components/DashboardChartsGrid'
import { DisqualificationReportPanel } from '@/features/dashboard/components/DisqualificationReportPanel'
import { ExecutiveDashboardPanel } from '@/features/dashboard/components/ExecutiveDashboardPanel'
import { KpiMetricsGrid } from '@/features/dashboard/components/KpiMetricsGrid'
import { LeadFunnelPanel } from '@/features/dashboard/components/LeadFunnelPanel'

export function ReportsHubPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6">
      <PageHeader
        title="Sales Reports"
        description="Executive dashboards for sales leaders — pipeline, funnel, revenue, and disqualification analytics from Dataverse UAT."
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Executive KPIs</h2>
        <KpiMetricsGrid />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Leadership View</h2>
        <ExecutiveDashboardPanel />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Pipeline & Revenue Analytics</h2>
        <DashboardChartsGrid />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Lead Funnel</h2>
          <LeadFunnelPanel />
        </div>
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Disqualification Analytics</h2>
          <DisqualificationReportPanel />
        </div>
      </section>
    </div>
  )
}
