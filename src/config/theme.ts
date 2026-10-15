export const themeConfig = {
  defaultTheme: 'system' as const,
  themes: ['light', 'dark', 'system'] as const,
  storageKey: 'sw:theme',
}

export type AppTheme = (typeof themeConfig.themes)[number]
