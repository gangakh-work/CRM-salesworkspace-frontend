/** Design system semantic color tokens */
export const semanticColors = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
  neutral: 'neutral',
} as const

export type SemanticColor = keyof typeof semanticColors

export const containerWidths = {
  xs: 'var(--container-xs)',
  sm: 'var(--container-sm)',
  md: 'var(--container-md)',
  lg: 'var(--container-lg)',
  xl: 'var(--container-xl)',
  '2xl': 'var(--container-2xl)',
  '3xl': 'var(--container-3xl)',
  '4xl': 'var(--container-4xl)',
  '5xl': 'var(--container-5xl)',
  '6xl': 'var(--container-6xl)',
  '7xl': 'var(--container-7xl)',
  full: 'var(--container-full)',
} as const

export const spacing = {
  0: 'var(--space-0)',
  1: 'var(--space-1)',
  2: 'var(--space-2)',
  3: 'var(--space-3)',
  4: 'var(--space-4)',
  5: 'var(--space-5)',
  6: 'var(--space-6)',
  8: 'var(--space-8)',
  10: 'var(--space-10)',
  12: 'var(--space-12)',
  16: 'var(--space-16)',
} as const

export const elevation = {
  0: 'var(--elevation-0)',
  1: 'var(--elevation-1)',
  2: 'var(--elevation-2)',
  3: 'var(--elevation-3)',
  4: 'var(--elevation-4)',
  5: 'var(--elevation-5)',
} as const
