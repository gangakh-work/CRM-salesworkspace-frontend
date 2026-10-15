import { AnimatePresence, motion } from 'framer-motion'
import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { ProgressBar } from '@/components/global/ProgressBar'
import { LoadingState } from '@/components/patterns/state-components'
import { pageTransition } from '@/design-system/animations/motion'
import { useSettings } from '@/hooks/useSettings'
import { AppBreadcrumb } from '@/shell/AppBreadcrumb'
import { AppSidebar } from '@/shell/AppSidebar'
import { CommandBar, useCommandBar } from '@/shell/CommandBar'
import { ShellFooter } from '@/shell/ShellFooter'
import { TopNavigation } from '@/shell/TopNavigation'
import { AppBackdrop } from '@/components/threeui/AppBackdrop'
import { GlobalAiCopilot } from '@/features/ai-copilot/components/GlobalAiCopilot'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'

export function AppShell() {
  const location = useLocation()
  const { settings } = useSettings()
  const { open, setOpen } = useCommandBar()
  const { open: openCopilot } = useAiCopilot()
  const isWorkspace = location.pathname.startsWith('/workspace')

  return (
    <div
      className={
        settings.animatedBackground
          ? 'relative isolate flex h-screen overflow-hidden bg-[#05030e]'
          : 'flex h-screen overflow-hidden bg-background'
      }
      data-backdrop={settings.animatedBackground ? 'on' : 'off'}
      style={
        {
          '--layout-sidebar-width': '16rem',
          '--layout-sidebar-width-collapsed': '4rem',
          '--header-height': '3.5rem',
          '--footer-height': '2.5rem',
        } as Record<string, string>
      }
    >
      {settings.animatedBackground && <AppBackdrop />}
      <ProgressBar />
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavigation onOpenCommandBar={() => setOpen(true)} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main
            className={
              isWorkspace
                ? 'flex-1 overflow-hidden'
                : 'flex-1 overflow-auto p-[var(--page-padding)]'
            }
          >
            {!isWorkspace && <AppBreadcrumb />}
            <AnimatePresence mode="wait">
              <motion.div
                key={isWorkspace ? 'workspace' : location.pathname}
                initial={settings.animationsEnabled ? 'initial' : false}
                animate={settings.animationsEnabled ? 'animate' : false}
                exit={settings.animationsEnabled ? 'exit' : undefined}
                variants={pageTransition}
                className="h-full"
              >
                <Suspense fallback={<LoadingState label="Loading page..." />}>
                  <Outlet />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
          <GlobalAiCopilot />
        </div>
        <ShellFooter />
      </div>
      <CommandBar open={open} onOpenChange={setOpen} onOpenCopilot={(opts) => openCopilot(opts)} />
    </div>
  )
}
