import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'

import { AppProviders } from '@/app/providers/AppProviders'
import { router } from '@/app/router'
import { ErrorBoundary } from '@/components/global/ErrorBoundary'
import { LoadingOverlay } from '@/components/global/LoadingOverlay'

export function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <Suspense fallback={<LoadingOverlay label="Loading application..." />}>
          <RouterProvider router={router} />
        </Suspense>
      </AppProviders>
    </ErrorBoundary>
  )
}
