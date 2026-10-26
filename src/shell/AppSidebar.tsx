import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Menu } from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'

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
          <div className="flex items-center gap-2"><img src="/logo.png" alt="Company logo" className="h-8 w-8 object-contain" onError={(e) => { e.currentTarget.style.display = "none" }} /><Typography variant="body" className="truncate font-semibold">{APP_NAME}</Typography></div>
        ) : (
          <img src="/logo.png" alt="Company logo" className="h-8 w-8 object-contain" onError={(e) => { e.currentTarget.style.display = "none" }} />
        )}
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <TooltipProvider delayDuration={0}>
          <nav className="space-y-4">
            {groups.filter(group => group.id !== "admin").map((group) => (
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
  const { mobileOpen, hoverOpen, pinnedOpen, closeMobile, openHover, closeHover, closePinnedOpen } = useSidebar()

  return (
    <>
      {/* Unified hover-to-expand sidebar on all desktop pages. */}
      <div
        aria-hidden="true"
        className="fixed inset-y-0 left-0 z-40 hidden w-3 lg:block"
        onMouseEnter={openHover}
      />
      <AnimatePresence>
        {(hoverOpen || pinnedOpen) && (
          <motion.aside
            key="navigation-overlay"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            onMouseEnter={openHover}
            onMouseLeave={closeHover}
            data-shell-surface
            className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl lg:flex"
          >
            <SidebarContent collapsed={false} />
            <div className="border-t border-sidebar-border p-2">
              <Button variant="ghost" size="icon-sm" className="w-full" onClick={closePinnedOpen} aria-label="Close navigation sidebar">
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

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
