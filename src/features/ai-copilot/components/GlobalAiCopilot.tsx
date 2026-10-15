import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { AiCopilotPanel } from '@/features/ai-copilot/components/AiCopilotPanel'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { transitions } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

export function GlobalAiCopilot() {
  const { isOpen, mode, panelWidth, toggle } = useAiCopilot()

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 1279px)').matches
      : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1279px)')

    const handleChange = () => {
      setIsMobile(mq.matches)
    }

    handleChange()

    mq.addEventListener('change', handleChange)

    return () => {
      mq.removeEventListener('change', handleChange)
    }
  }, [])

  return (
    <>
      {/* =========================================================
          DOCKED SALES ASSISTANT
          ========================================================= */}
      <AnimatePresence>
        {isOpen && mode === 'docked' && !isMobile && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: panelWidth,
              opacity: 1,
            }}
            exit={{
              width: 0,
              opacity: 0,
            }}
            transition={transitions.base}
            className={cn(
              'relative z-30 hidden h-full min-h-0 shrink-0 overflow-hidden',
              'border-l border-border/60 bg-background shadow-elevation-2',
              'xl:flex',
              'flex-col',
            )}
          >
            <div className="flex min-h-0 h-full w-full flex-1 flex-col overflow-hidden">
              <AiCopilotPanel
                resizable
                className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden"
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* =========================================================
          FLOATING SALES ASSISTANT
          ========================================================= */}
      <AnimatePresence>
        {isOpen && mode === 'floating' && !isMobile && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            transition={transitions.base}
            className={cn(
              'fixed bottom-20 right-4 z-50 hidden',
              'h-[min(720px,calc(100vh-6rem))]',
              'w-[min(440px,calc(100vw-2rem))]',
              'overflow-hidden rounded-2xl',
              'border border-border/60',
              'bg-background shadow-elevation-4',
              'md:flex md:flex-col',
            )}
          >
            <AiCopilotPanel
              resizable={false}
              className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          FULLSCREEN SALES ASSISTANT — ChatGPT layout
          ========================================================= */}
      <AnimatePresence>
        {isOpen && mode === 'fullscreen' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.base}
            className="fixed inset-0 z-[100] flex h-[100dvh] w-screen overflow-hidden bg-background"
          >
            <AiCopilotPanel
              resizable={false}
              chatGptLayout
              className="h-full min-h-0 w-full flex-1 overflow-hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MOBILE / TABLET
          ========================================================= */}
      <Sheet
        open={isOpen && isMobile && mode !== 'fullscreen'}
        onOpenChange={(open) => {
          if (!open) toggle()
        }}
      >
        <SheetContent
          side="right"
          className="flex h-full w-full max-w-md flex-col p-0"
        >
          <AiCopilotPanel
            resizable={false}
            className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden"
          />
        </SheetContent>
      </Sheet>

      {/* =========================================================
          FLOATING ASSISTANT BUTTON
          ========================================================= */}
      <motion.div
        className={cn(
          'fixed z-40',
          mode === 'fullscreen'
            ? 'hidden'
            : mode === 'docked' && isOpen
            ? 'bottom-6 right-[calc(1rem+var(--ai-panel-offset,0px))]'
            : 'bottom-6 right-4',
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={transitions.fast}
      >
        <Button
          size="lg"
          onClick={toggle}
          className={cn(
            'h-14 gap-2 rounded-full px-5',
            'shadow-elevation-4',
            'bg-gradient-to-r from-primary to-violet-600',
            'hover:from-primary/90 hover:to-violet-600/90',
            isOpen && mode === 'docked' && 'xl:hidden',
          )}
          aria-label="Open Sales Assistant"
        >
          <Sparkles className="size-5" />

          <span className="hidden sm:inline">
            Assistant
          </span>

          <kbd className="ml-1 hidden rounded border border-primary-foreground/30 px-1 text-[10px] opacity-80 lg:inline">
            ⌃I
          </kbd>
        </Button>
      </motion.div>
    </>
  )
}

export function AiCopilotTrigger({
  className,
}: {
  className?: string
}) {
  const { open } = useAiCopilot()

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => open()}
    >
      <Sparkles className="size-4" />
      Ask Assistant
    </Button>
  )
}