import { NotificationCenter } from '@/shell/NotificationCenter'
import { ProfileMenu } from '@/shell/ProfileMenu'
import { SidebarToggle } from '@/shell/AppSidebar'
import { ThemeSwitcher } from '@/shell/ThemeSwitcher'
import { WorkspaceDock } from '@/components/threeui/WorkspaceDock'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { useNavigation } from '@/hooks/useNavigation'
import { useSidebar } from '@/hooks/useSidebar'
import { useLocation } from 'react-router-dom'
import { APP_NAME } from '@/config/constants'
import { cn } from '@/lib/utils'

interface TopNavigationProps {
  onOpenCommandBar: () => void
}

export function TopNavigation({ onOpenCommandBar }: TopNavigationProps) {
  const { currentFeature } = useNavigation()
  const { openHover, closeHover, hoverOpen, pinnedOpen, togglePinnedOpen } = useSidebar()
  const location = useLocation()
  const isWorkspace = true

  return (
    <header data-shell-surface data-dock-frame className="relative z-30 flex h-[var(--header-height)] shrink-0 items-center gap-3 border-b bg-background px-4">
      <SidebarToggle />

      {/* On workspace pages: "Sales Workspace" is the hover trigger for the overlay sidebar */}
      {isWorkspace ? (
        <button
          type="button"
          onMouseEnter={() => openHover()}
          onMouseLeave={() => closeHover()}
          onClick={togglePinnedOpen}
          onFocus={() => openHover()}
          className={cn(
            'crm-sidebar-hover-trigger flex min-w-0 cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1 transition-all',
            hoverOpen
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-foreground hover:bg-accent',
          )}
          aria-label={pinnedOpen ? 'Close navigation sidebar' : 'Pin navigation sidebar open'}
          aria-expanded={hoverOpen || pinnedOpen}
        >
          <img src="/logo.png" alt="" className="crm-header-logo" />
          <Typography variant="body" className="truncate font-semibold">
            {APP_NAME}
          </Typography>
          {/* Small chevron hint */}
          <svg
            className="crm-sidebar-chevron size-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        /* the breadcrumb repeats the page name, so the dock takes this room at xl+ */
        <div className="hidden min-w-0 sm:block xl:hidden">
          <Typography variant="body" className="truncate font-semibold">
            {currentFeature?.label ?? APP_NAME}
          </Typography>
          {currentFeature?.description && (
            <Typography variant="caption" tone="muted" className="hidden truncate md:block">
              {currentFeature.description}
            </Typography>
          )}
        </div>
      )}

      {/* ThreeUI Sable dock — primary destinations, centred in the header */}
      <WorkspaceDock className="crm-top-dock flex min-w-0 flex-1 items-center justify-center" />

      <div className="crm-header-actions flex items-center justify-end gap-2">


        <Separator orientation="vertical" className="hidden h-6 md:block" />
        <ThemeSwitcher />
        <NotificationCenter />
        <ProfileMenu />
      </div>
    </header>
  )
}
