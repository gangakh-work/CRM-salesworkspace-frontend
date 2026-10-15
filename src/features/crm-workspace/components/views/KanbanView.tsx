import { motion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { RecordCard } from '@/features/crm-workspace/components/RecordCard'
import { KANBAN_COLUMNS } from '@/features/crm-workspace/lib/workspace-config'
import { useWorkspace } from '@/features/crm-workspace/context/WorkspaceProvider'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'

export function KanbanView() {
  const { records, activeTab } = useWorkspace()
  const columns = KANBAN_COLUMNS[activeTab]

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex gap-4 overflow-x-auto pb-4"
    >
      {columns.map((column) => {
        const columnRecords = records.filter(
          (r) => r.kanbanColumn === column || (!r.kanbanColumn && column === columns[0]),
        )

        return (
          <motion.div
            key={column}
            variants={fadeIn}
            className="flex w-72 shrink-0 flex-col rounded-xl border border-border/60 bg-muted/20 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <Typography variant="body" className="text-sm font-semibold">
                {column}
              </Typography>
              <Badge variant="secondary">{columnRecords.length}</Badge>
            </div>
            <div className="flex-1 space-y-3 p-3">
              {columnRecords.map((record) => (
                <RecordCard key={record.id} record={record} compact />
              ))}
              {columnRecords.length === 0 && (
                <Typography variant="caption" tone="muted" className="block py-8 text-center">
                  No items
                </Typography>
              )}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
