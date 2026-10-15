import { useTheme as useNextThemes } from 'next-themes'

import { themeConfig, type AppTheme } from '@/config/theme'

export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextThemes()

  return {
    theme: (theme ?? themeConfig.defaultTheme) as AppTheme,
    resolvedTheme: resolvedTheme as 'light' | 'dark' | undefined,
    systemTheme: systemTheme as 'light' | 'dark' | undefined,
    setTheme: (value: AppTheme) => setTheme(value),
    toggleTheme: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    themes: themeConfig.themes,
  }
}
