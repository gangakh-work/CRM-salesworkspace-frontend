import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

export function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const activeTheme = resolvedTheme ?? (theme === 'dark' ? 'dark' : 'light')
  const nextTheme = activeTheme === 'dark' ? 'light' : 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      aria-pressed={activeTheme === 'dark'}
      onClick={() => setTheme(nextTheme)}
    >
      {activeTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
