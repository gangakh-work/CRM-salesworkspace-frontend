import { Timeline } from '@/components/patterns/data-display'
import { Target } from 'lucide-react'
import { useWorkspace } from '@/features/crm-workspace/context/WorkspaceProvider'
import { EmptyState } from '@/components/global/EmptyState'

export function TimelineView() {
  const { records } = useWorkspace()

  if (records.length === 0) {
    return (
      <EmptyState icon={Target} title="No timeline events" description="Records will appear chronologically here." />
    )
  }

  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
      <Timeline
        items={sorted.map((record) => ({
          id: record.id,
          title: record.title,
          description: `${record.subtitle} · ${record.owner}`,
          timestamp: record.date,
        }))}
      />
    </div>
  )
}
