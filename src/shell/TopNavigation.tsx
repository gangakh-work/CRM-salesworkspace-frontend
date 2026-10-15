import { GlobalSearch } from '@/shell/GlobalSearch'
import { NotificationCenter } from '@/shell/NotificationCenter'
import { ProfileMenu } from '@/shell/ProfileMenu'
import { SidebarToggle } from '@/shell/AppSidebar'
import { ThemeSwitcher } from '@/shell/ThemeSwitcher'
import { WorkspaceDock } from '@/components/threeui/WorkspaceDock'
import { AiCopilotTrigger } from '@/features/ai-copilot/components/GlobalAiCopilot'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { useNavigation } from '@/hooks/useNavigation'
import { useCrmEnvironment } from '@/hooks/useCrmEnvironment'
import { useSidebar } from '@/hooks/useSidebar'
import { useLocation } from 'react-router-dom'
import { APP_NAME } from '@/config/constants'
import { cn } from '@/lib/utils'

interface TopNavigationProps {
  onOpenCommandBar: () => void
}

export function TopNavigation({ onOpenCommandBar }: TopNavigationProps) {
  const { currentFeature } = useNavigation()
  const crm = useCrmEnvironment()
  const { openHover, closeHover, hoverOpen } = useSidebar()
  const location = useLocation()
  const isWorkspace = location.pathname.startsWith('/workspace')

  return (
    <header data-shell-surface data-dock-frame className="relative z-30 flex h-[var(--header-height)] shrink-0 items-center gap-3 border-b bg-background px-4">
      <SidebarToggle />

      {/* On workspace pages: "Sales Workspace" is the hover trigger for the overlay sidebar */}
      {isWorkspace ? (
        <button
          type="button"
          onMouseEnter={() => openHover()}
          onMouseLeave={() => closeHover()}
          className={cn(
            'hidden min-w-0 cursor-default select-none items-center gap-1.5 rounded-md px-2 py-1 transition-colors sm:flex',
            hoverOpen
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-foreground hover:bg-accent',
          )}
          aria-label="Show navigation"
        >
          <Typography variant="body" className="truncate font-semibold">
            {APP_NAME}
          </Typography>
          {/* Small chevron hint */}
          <svg
            className="size-3 shrink-0 opacity-50"
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
      <WorkspaceDock className="pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-1/2 items-center xl:flex" />

      <div className="flex flex-1 items-center justify-end gap-2">
        {crm.data?.dataverseUrl ? (
          <a
            href={crm.data.dataverseUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden max-w-[14rem] truncate rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground lg:inline-flex xl:hidden"
            title="This app writes only to Dynamics 365 UAT, not DEV"
          >
            CRM: {crm.data.orgLabel}
          </a>
        ) : null}
        <GlobalSearch
          className="hidden md:flex xl:w-9 xl:max-w-9 xl:justify-center xl:px-0 xl:[&>:not(svg)]:hidden"
          onOpenCommandBar={onOpenCommandBar}
        />
        <AiCopilotTrigger className="hidden sm:flex" />
        <Separator orientation="vertical" className="hidden h-6 md:block" />
        <ThemeSwitcher />
        <NotificationCenter />
        <ProfileMenu />
      </div>
    </header>
  )
}
