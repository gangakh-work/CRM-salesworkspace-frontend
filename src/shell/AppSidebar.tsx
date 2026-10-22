import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Menu } from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { APP_NAME } from '@/config/constants'
import { sidebarAnimation } from '@/design-system/animations/motion'
import { useNavigation } from '@/hooks/useNavigation'
import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@/lib/utils'

function NavItem({
  path,
  label,
  icon: Icon,
  badge,
  collapsed,
  onNavigate,
}: {
  path: string
  label: string
  icon: ComponentType<{ className?: string }>
  badge?: string
  collapsed: boolean
  onNavigate?: () => void
}) {
  const link = (
    <NavLink
      to={path}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/80',
          collapsed && 'justify-center px-2',
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="truncate">{label}</span>
          {badge && (
            <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
              {badge}
            </Badge>
          )}
        </>
      )}
    </NavLink>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return link
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { groups } = useNavigation()

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex h-[var(--header-height)] shrink-0 items-center border-b border-sidebar-border px-4',
          collapsed && 'justify-center px-2',
        )}
      >
        
        {!collapsed ? (
          <img
            src="/logo.png"
            alt="Sonata"
            className="h-8 w-auto max-w-[150px] object-contain"
          />
        ) : (
          <img
            src="/logo.png"
            alt="Sonata"
            className="h-7 w-7 object-contain"
          />
        )}

      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <TooltipProvider delayDuration={0}>
          <nav className="space-y-4">
            {groups.map((group) => (
              <div key={group.id}>
                {!collapsed && (
                  <Typography
                    variant="caption"
                    tone="muted"
                    className="mb-2 px-3 uppercase tracking-wider"
                  >
                    {group.label}
                  </Typography>
                )}
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <NavItem
                        path={item.path}
                        label={item.label}
                        icon={item.icon}
                        badge={item.badge}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </TooltipProvider>
      </ScrollArea>
    </div>
  )
}

export function AppSidebar() {
  const { collapsed, mobileOpen, hoverOpen, toggleCollapsed, closeMobile, openHover, closeHover } = useSidebar()
  const location = useLocation()
  const isWorkspace = location.pathname.startsWith('/workspace')

  return (
    <>
      {/* Desktop sidebar — normal flow when not on workspace pages */}
      {!isWorkspace && (
        <motion.aside
          initial={false}
          animate={collapsed ? 'collapsed' : 'expanded'}
          variants={sidebarAnimation}
          data-shell-surface
          className="hidden shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col"
          style={
            {
              '--sidebar-width': 'var(--layout-sidebar-width)',
              '--sidebar-width-collapsed': 'var(--layout-sidebar-width-collapsed)',
            } as Record<string, string>
          }
        >
          <SidebarContent collapsed={collapsed} />
          <div className="border-t border-sidebar-border p-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="w-full"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft
                className={cn('size-4 transition-transform', collapsed && 'rotate-180')}
              />
            </Button>
          </div>
        </motion.aside>
      )}

      {/* Workspace overlay sidebar — slides in from left on hover, floats over content */}
      {isWorkspace && (
        <AnimatePresence>
          {hoverOpen && (
            <motion.aside
              key="workspace-sidebar"
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }}
              onMouseEnter={() => openHover()}
              onMouseLeave={() => closeHover()}
              data-shell-surface
              className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl lg:flex"
            >
              <SidebarContent collapsed={false} />
              <div className="border-t border-sidebar-border p-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="w-full"
                  onClick={toggleCollapsed}
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      )}

      {/* Mobile sheet sidebar */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && closeMobile()}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent collapsed={false} onNavigate={closeMobile} />
        </SheetContent>
      </Sheet>
    </>
  )
}

export function SidebarToggle() {
  const { toggleMobile } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="lg:hidden"
      onClick={toggleMobile}
      aria-label="Open navigation"
    >
      <Menu className="size-5" />
    </Button>
  )
}
