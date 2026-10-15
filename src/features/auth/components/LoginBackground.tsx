import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

const shapes = [
  { size: 320, x: '10%', y: '15%', color: 'from-blue-500/30 to-cyan-400/20', delay: 0 },
  { size: 280, x: '75%', y: '10%', color: 'from-violet-500/25 to-purple-400/15', delay: 0.5 },
  { size: 240, x: '60%', y: '65%', color: 'from-indigo-500/20 to-blue-500/10', delay: 1 },
  { size: 200, x: '20%', y: '70%', color: 'from-sky-500/25 to-teal-400/15', delay: 1.5 },
]

export function LoginBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className={cn(
            'absolute rounded-full bg-gradient-to-br blur-3xl',
            shape.color,
          )}
          style={{
            width: shape.size,
            height: shape.size,
            left: shape.x,
            top: shape.y,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 15, 0],
            scale: [1, 1.08, 0.95, 1],
          }}
          transition={{
            duration: 18 + index * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: shape.delay,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
    </div>
  )
}
