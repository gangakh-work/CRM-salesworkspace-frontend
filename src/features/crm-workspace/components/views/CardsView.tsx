import { RecordCard } from '@/features/crm-workspace/components/RecordCard'
import { useWorkspace } from '@/features/crm-workspace/context/WorkspaceProvider'
import { EmptyState } from '@/components/global/EmptyState'
import { LayoutGrid } from 'lucide-react'

export function CardsView() {
  const { records } = useWorkspace()

  if (records.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="No records found"
        description="Try adjusting your search or filters."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {records.map((record) => (
        <RecordCard key={record.id} record={record} />
      ))}
    </div>
  )
}
