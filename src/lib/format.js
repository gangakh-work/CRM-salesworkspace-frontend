const nf = new Intl.NumberFormat('en-US')

export const num = (n) => nf.format(Math.round(n))
export const money = (n) => `$${nf.format(Math.round(n))}`
export const pct = (n, digits = 1) => `${Math.abs(n).toFixed(digits).replace(/\.0$/, '')}%`

/* "Good Afternoon" by the visitor's own clock */
export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 5) return 'Good Evening'
  if (h < 12) return 'Good Morning'
  if (h < 18) return 'Good Afternoon'
  return 'Good Evening'
}

export const initials = (name) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
