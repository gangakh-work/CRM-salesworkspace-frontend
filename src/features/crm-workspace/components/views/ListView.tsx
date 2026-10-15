import { RecordListItem } from '@/features/crm-workspace/components/RecordCard'
import { useWorkspace } from '@/features/crm-workspace/context/WorkspaceProvider'
import { EmptyState } from '@/components/global/EmptyState'
import { List } from 'lucide-react'

export function ListView() {
  const { records } = useWorkspace()

  if (records.length === 0) {
    return (
      <EmptyState icon={List} title="No records found" description="Try adjusting your search or filters." />
    )
  }

  return (
    <div className="space-y-2">
      {records.map((record) => (
        <RecordListItem key={record.id} record={record} />
      ))}
    </div>
  )
}
