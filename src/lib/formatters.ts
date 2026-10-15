const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
}

/**
 * Compact currency formatter for pipeline and dashboard values.
 * Supports optional currency codes and undefined values (renders em dash).
 */
export function formatCurrency(value?: number, currency = 'USD'): string {
  if (value === undefined) return '—'

  const sym = CURRENCY_SYMBOLS[currency] ?? '$'

  if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${sym}${(value / 1_000).toFixed(0)}K`
  return `${sym}${value.toLocaleString()}`
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}
