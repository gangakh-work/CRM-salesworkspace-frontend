import { cva, type VariantProps } from 'class-variance-authority'
import type { ElementType, HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const typographyVariants = cva('', {
  variants: {
    variant: {
      'heading-xl': 'text-heading-xl',
      'heading-l': 'text-heading-l',
      'heading-m': 'text-heading-m',
      body: 'text-body',
      'body-lg': 'text-body-lg',
      caption: 'text-caption text-muted-foreground',
      badge: 'text-badge',
      code: 'text-code font-mono rounded bg-muted px-1.5 py-0.5',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      success: 'text-success',
      warning: 'text-warning-foreground',
      error: 'text-destructive',
      info: 'text-info',
    },
  },
  defaultVariants: {
    variant: 'body',
    tone: 'default',
  },
})

type TypographyVariant = NonNullable<VariantProps<typeof typographyVariants>['variant']>

const defaultElements: Record<TypographyVariant, ElementType> = {
  'heading-xl': 'h1',
  'heading-l': 'h2',
  'heading-m': 'h3',
  body: 'p',
  'body-lg': 'p',
  caption: 'span',
  badge: 'span',
  code: 'code',
}

export interface TypographyProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: ElementType
}

export function Typography({
  as,
  variant = 'body',
  tone,
  className,
  children,
  ...props
}: TypographyProps) {
  const resolvedVariant = (variant ?? 'body') as TypographyVariant
  const Component = as ?? defaultElements[resolvedVariant]

  return (
    <Component className={cn(typographyVariants({ variant, tone }), className)} {...props}>
      {children}
    </Component>
  )
}
