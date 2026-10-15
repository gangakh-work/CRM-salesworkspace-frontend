import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GlobalSearchProps {
  className?: string
  onOpenCommandBar?: () => void
}

export function GlobalSearch({ className, onOpenCommandBar }: GlobalSearchProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        'relative h-9 w-full max-w-sm justify-start gap-2 bg-muted/40 text-muted-foreground',
        className,
      )}
      onClick={() => onOpenCommandBar?.()}
      aria-label="Open search"
    >
      <Search className="size-4 shrink-0" />
      <span className="hidden flex-1 text-left text-sm sm:inline">Search...</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  )
}
