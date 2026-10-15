import type { Transition, Variants } from 'framer-motion'

export const transitions = {
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } satisfies Transition,
  base: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } satisfies Transition,
  slow: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } satisfies Transition,
  spring: { type: 'spring', stiffness: 400, damping: 30 } satisfies Transition,
} as const

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: transitions.base },
  exit: { opacity: 0, y: -4, transition: transitions.fast },
}

export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.01, y: -2, transition: transitions.fast },
}

export const buttonTap = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: transitions.fast,
}

export const dialogAnimation: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitions.spring },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: transitions.fast },
}

export const dialogOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
  exit: { opacity: 0, transition: transitions.fast },
}

export const sidebarAnimation: Variants = {
  expanded: { width: 'var(--sidebar-width)' },
  collapsed: { width: 'var(--sidebar-width-collapsed)' },
}

export const sidebarContent: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: transitions.base },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transitions.base },
}

export const slideIn: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: transitions.base },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

export const skeletonPulse: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
}

export const drawerAnimation: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: transitions.spring },
  exit: { x: '100%', transition: transitions.base },
}

export const popoverAnimation: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitions.fast },
  exit: { opacity: 0, scale: 0.98, transition: transitions.fast },
}
