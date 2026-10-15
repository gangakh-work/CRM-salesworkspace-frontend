import { useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Full-bleed media block for editorial heroes.
 *
 * - Video is lazy: nothing downloads until the block is on screen
 *   (preload="none" + IntersectionObserver); it pauses when scrolled away.
 * - Muted, looping, inline — never autoplays for prefers-reduced-motion.
 * - Without a video, the poster is shown in black & white with a slow zoom.
 */
export function HeroVideo({
  src,
  poster,
  className,
  children,
}: {
  src?: string
  poster?: string
  className?: string
  children?: ReactNode
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [visible, setVisible] = useState(false)
  const [reduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src || reduce) return
    if (visible) void video.play().catch(() => undefined)
    else video.pause()
  }, [visible, src, reduce])

  return (
    <div ref={wrapRef} className={cn('relative overflow-hidden bg-neutral-950', className)}>
      {src ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        >
          {visible && <source src={src} />}
        </video>
      ) : poster ? (
        <img
          src={poster}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn(
            'absolute inset-0 h-full w-full object-cover opacity-60 grayscale contrast-125',
            !reduce && 'animate-[kenburns_24s_ease-in-out_infinite_alternate]',
          )}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" aria-hidden="true" />
      <div className="relative h-full">{children}</div>
    </div>
  )
}
