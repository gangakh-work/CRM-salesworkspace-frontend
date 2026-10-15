import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

export function AiTypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1 px-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-2 rounded-full bg-primary/60"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}
