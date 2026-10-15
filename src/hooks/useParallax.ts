import { useEffect, useRef } from 'react'

function scrollParent(el: HTMLElement | null): HTMLElement | Window {
  let node = el?.parentElement ?? null
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node
    node = node.parentElement
  }
  return window
}

/**
 * Scroll-linked parallax that works inside scrolling containers (the app's
 * <main>), uses one rAF per frame and is off for prefers-reduced-motion.
 *
 * - mode "start" (heroes): at rest on load, then lags behind as you scroll.
 * - mode "center" (galleries): settles to rest when the element is centred,
 *   sits slightly lower before and slightly higher after.
 * The drift is capped at `max` px so layouts never collide.
 */
export function useParallax<T extends HTMLElement>(
  speed: number,
  { mode = 'center', max = 40 }: { mode?: 'center' | 'start'; max?: number } = {},
) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || speed === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const parent = scrollParent(el)
    const scrollTop = () => (parent instanceof Window ? window.scrollY : parent.scrollTop)
    const startScroll = scrollTop()
    let frame = 0
    const update = () => {
      frame = 0
      let offset: number
      if (mode === 'start') {
        offset = (scrollTop() - startScroll) * speed
      } else {
        // Measure without our own transform so the result is stable.
        const prev = el.style.transform
        el.style.transform = ''
        const rect = el.getBoundingClientRect()
        el.style.transform = prev
        offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed
      }
      offset = Math.max(-max, Math.min(max, offset))
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    parent.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      parent.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [speed, mode, max])

  return ref
}
