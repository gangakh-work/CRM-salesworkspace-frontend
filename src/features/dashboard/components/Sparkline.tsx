import { cn } from '@/lib/utils'

interface SparklineProps {
  data: number[]
  className?: string
  strokeClassName?: string
  width?: number
  height?: number
}

export function Sparkline({
  data,
  className,
  strokeClassName = 'stroke-primary',
  width = 88,
  height = 36,
}: SparklineProps) {
  const points = data ?? []
  if (points.length < 2) return null

  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1

  const polylinePoints = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width
      const y = height - ((value - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  const lastPoint = points[points.length - 1]
  const lastX = width
  const lastY = height - ((lastPoint - min) / range) * (height - 4) - 2

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${polylinePoints} ${width},${height}`}
        className="fill-primary/10"
      />
      <polyline
        fill="none"
        points={polylinePoints}
        className={cn('fill-none stroke-[2]', strokeClassName)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="3" className="fill-primary" />
    </svg>
  )
}
