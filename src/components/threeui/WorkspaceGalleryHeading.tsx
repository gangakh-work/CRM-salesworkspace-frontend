import { useEffect, useState } from 'react'

/** Lightweight, dependency-free animated-style heading for the dashboard. */
export function WorkspaceGalleryHeading({
  lines = ['SALES WORKSPACE', 'IN MOTION'],
  className = '',
}: { lines?: readonly [string, string]; className?: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setVisible(true))
    return () => window.cancelAnimationFrame(id)
  }, [])
  return (
    <div className={`relative flex min-h-40 flex-col justify-center overflow-hidden rounded-sm bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-8 text-white transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'} ${className}`}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,.12) 48%, transparent 52%)' }} />
      <p className="relative text-xs font-semibold tracking-[0.32em] text-indigo-200">SALES INTELLIGENCE</p>
      <h2 className="relative mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">{lines[0]}</h2>
      <p className="relative mt-1 text-sm tracking-[0.22em] text-slate-300">{lines[1]}</p>
    </div>
  )
}
