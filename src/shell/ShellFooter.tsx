import { APP_NAME, APP_VERSION } from '@/config/constants'
import { Typography } from '@/components/ui/typography'

export function ShellFooter() {
  return (
    <footer data-shell-surface className="flex h-[var(--footer-height)] shrink-0 items-center justify-between border-t bg-background px-4">
      <Typography variant="caption" tone="muted">
        © {new Date().getFullYear()} {APP_NAME}
      </Typography>
      <Typography variant="caption" tone="muted">
        v{APP_VERSION}
      </Typography>
    </footer>
  )
}
