import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Typography } from '@/components/ui/typography'
import { useWorkspace } from '@/features/crm-workspace/context/WorkspaceProvider'
import { WORKSPACE_TABS } from '@/features/crm-workspace/types/workspace.types'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

export function WorkspaceNavPanel() {
  const { tabCounts } = useWorkspace()

  return (
    <aside className="flex h-full w-[var(--workspace-nav-width)] shrink-0 flex-col border-r border-border/60 bg-sidebar/50 backdrop-blur-xl">
      <div className="border-b border-border/60 px-4 py-4">
        <Typography variant="body" className="font-semibold">
          Workspace
        </Typography>
        <Typography variant="caption" tone="muted">
          Daily sales operations
        </Typography>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <motion.nav
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-1"
        >
          {WORKSPACE_TABS.map((tab) => {
            const Icon = tab.icon
            const count = tabCounts[tab.id] ?? 0

            return (
              <motion.div key={tab.id} variants={fadeIn}>
                <NavLink
                  to={tab.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      'hover:bg-sidebar-accent/80',
                      isActive
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                        : 'text-sidebar-foreground/80',
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{tab.label}</span>
                  <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[10px]">
                    {count}
                  </Badge>
                </NavLink>
              </motion.div>
            )
          })}
        </motion.nav>
      </ScrollArea>
    </aside>
  )
}
