import { formatCurrency } from '@/lib/formatters'

export type KpiFormat = 'currency' | 'number' | 'percent'

export function formatKpiValue(value: number, format: KpiFormat): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value)
    case 'percent':
      return `${value}%`
    default:
      return value.toLocaleString()
  }
}

export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}
