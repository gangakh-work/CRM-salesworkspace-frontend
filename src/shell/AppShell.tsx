import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { ProgressBar } from '@/components/global/ProgressBar'
import { LoadingState } from '@/components/patterns/state-components'
import { pageTransition } from '@/design-system/animations/motion'
import { useSettings } from '@/hooks/useSettings'
import { AppBreadcrumb } from '@/shell/AppBreadcrumb'
import { AppSidebar } from '@/shell/AppSidebar'
import { CommandBar, useCommandBar } from '@/shell/CommandBar'
import { TopNavigation } from '@/shell/TopNavigation'
import { AppBackdrop } from '@/components/threeui/AppBackdrop'

import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { GlobalAiCopilot } from '@/features/ai-copilot/components/GlobalAiCopilot'

export function AppShell() {
  const location = useLocation()
  const { settings } = useSettings()
  const { open, setOpen } = useCommandBar()
  const { open: openCopilot, isOpen: isCopilotOpen, close: closeCopilot } = useAiCopilot()
  const isWorkspace = location.pathname.startsWith('/workspace')

  return (
    <div
      className={
        settings.animatedBackground
          ? 'sales-workspace-app relative isolate flex h-dvh min-h-0 bg-background'
          : 'sales-workspace-app flex h-dvh min-h-0 bg-background'
      }
      data-backdrop={settings.animatedBackground ? 'on' : 'off'}
      data-product-theme="sales-workspace"
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
                ? 'flex-1 min-h-0 overflow-auto'
                : 'flex-1 min-h-0 overflow-auto p-[var(--page-padding)]'
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
                className="min-h-0"
              >
                <Suspense fallback={<LoadingState label="Loading page..." />}>
                  <Outlet />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>

        </div>

      </div>
      <GlobalAiCopilot showTrigger={false} />
      <button type="button" className="crm-floating-assistant" aria-label={isCopilotOpen ? 'Close AI Assistant' : 'Open AI Assistant'} title="AI Assistant" onClick={() => isCopilotOpen ? closeCopilot() : openCopilot({ mode: 'floating' })}>
        <Sparkles size={22}/><span>AI Assistant</span>
      </button>
      <CommandBar open={open} onOpenChange={setOpen} onOpenCopilot={(opts) => openCopilot(opts)} />
    </div>
  )
}
