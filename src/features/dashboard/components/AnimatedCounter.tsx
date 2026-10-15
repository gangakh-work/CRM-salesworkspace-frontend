import { useEffect, useState } from 'react'

interface UseAnimatedCounterOptions {
  enabled?: boolean
}

export function useAnimatedCounter(target: number, { enabled = true }: UseAnimatedCounterOptions = {}) {
  const [display, setDisplay] = useState(enabled ? 0 : target)

  useEffect(() => {
    if (!enabled) return

    const duration = 1200
    const start = performance.now()
    let frame: number

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(target * eased))

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [target, enabled])

  return enabled ? display : target
}
