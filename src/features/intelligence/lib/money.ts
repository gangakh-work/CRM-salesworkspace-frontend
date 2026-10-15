/** Compact currency-agnostic figure: 1.2M, 340K, 950. */
export function money(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)}K`
  return v.toLocaleString()
}
