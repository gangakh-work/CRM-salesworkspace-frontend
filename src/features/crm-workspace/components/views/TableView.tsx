import { Badge } from '@/components/ui/badge'
import { DataGrid } from '@/components/ui/data-grid'
import { formatRecordValue } from '@/features/crm-workspace/lib/workspace-config'
import { useWorkspace } from '@/features/crm-workspace/context/WorkspaceProvider'

export function TableView() {
  const { records } = useWorkspace()

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <DataGrid
        data={records}
        getRowId={(row) => row.id}
        emptyMessage="No records match your filters."
        columns={[
          {
            id: 'title',
            header: 'Name',
            accessor: (row) => row.title,
            sortable: true,
            sortValue: (row) => row.title,
          },
          {
            id: 'subtitle',
            header: 'Description',
            accessor: (row) => row.subtitle,
          },
          {
            id: 'status',
            header: 'Status',
            accessor: (row) => (
              <Badge variant="outline" className="capitalize">
                {row.status}
              </Badge>
            ),
            sortable: true,
            sortValue: (row) => row.status,
          },
          {
            id: 'value',
            header: 'Value',
            accessor: (row) => formatRecordValue(row.value),
            sortable: true,
            sortValue: (row) => row.value ?? 0,
          },
          {
            id: 'owner',
            header: 'Owner',
            accessor: (row) => row.owner,
            sortable: true,
            sortValue: (row) => row.owner,
          },
          {
            id: 'date',
            header: 'Date',
            accessor: (row) => row.date,
            sortable: true,
            sortValue: (row) => row.date,
          },
          {
            id: 'priority',
            header: 'Priority',
            accessor: (row) =>
              row.priority ? (
                <Badge variant={row.priority === 'high' ? 'error' : row.priority === 'medium' ? 'warning' : 'neutral'}>
                  {row.priority}
                </Badge>
              ) : (
                '—'
              ),
          },
        ]}
      />
    </div>
  )
}
