import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

import { ThemeProvider } from '@/design-system/provider/ThemeProvider'

interface DesignSystemProviderProps {
  children: ReactNode
}

export function DesignSystemProvider({ children }: DesignSystemProviderProps) {
  return (
    <ThemeProvider>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </ThemeProvider>
  )
}
