import { useEffect, useState } from 'react'
import { ThemeContext } from './theme-context'

const THEME_STORAGE_KEY = 'crm-theme'

function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = getSavedTheme()
    document.documentElement.dataset.theme = savedTheme
    return savedTheme
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Keep the selected theme for this session when storage is unavailable.
    }
  }, [theme])

  const value = {
    theme,
    toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark'),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
