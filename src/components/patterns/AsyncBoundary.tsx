import type { ReactNode } from 'react'

import { ErrorState, LoadingState } from '@/components/patterns/state-components'

export interface AsyncBoundaryProps {
  isLoading: boolean
  isError?: boolean
  error?: Error | null
  onRetry?: () => void
  loadingLabel?: string
  loadingFallback?: ReactNode
  errorTitle?: string
  errorDescription?: string
  children: ReactNode
}

/**
 * Standard async data wrapper for query and provider loading states.
 * Renders shared LoadingState / ErrorState from the design system.
 */
export function AsyncBoundary({
  isLoading,
  isError = false,
  error,
  onRetry,
  loadingLabel,
  loadingFallback,
  errorTitle,
  errorDescription,
  children,
}: AsyncBoundaryProps) {
  if (isLoading) {
    return loadingFallback ?? <LoadingState label={loadingLabel} />
  }

  if (isError) {
    return (
      <ErrorState
        title={errorTitle}
        description={errorDescription ?? error?.message}
        onRetry={onRetry}
      />
    )
  }

  return children
}
