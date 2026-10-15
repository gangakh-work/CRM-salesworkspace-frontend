import { useEffect, useState } from 'react'
import { useNavigation as useRouterNavigation } from 'react-router-dom'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  className?: string
}

export function ProgressBar({ className }: ProgressBarProps) {
  const navigation = useRouterNavigation()
  const isLoading = navigation.state === 'loading'
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isLoading) return

    const showTimer = window.requestAnimationFrame(() => {
      setVisible(true)
      setProgress(20)
    })
    const interval = window.setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 10))
    }, 200)

    return () => {
      window.cancelAnimationFrame(showTimer)
      window.clearInterval(interval)
    }
  }, [isLoading])

  useEffect(() => {
    if (isLoading || !visible) return

    const completeTimer = window.requestAnimationFrame(() => {
      setProgress(100)
      window.setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
    })

    return () => window.cancelAnimationFrame(completeTimer)
  }, [isLoading, visible])

  if (!visible) return null

  return (
    <div
      className={cn('fixed left-0 right-0 top-0 z-[200] h-0.5', className)}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <Progress value={progress} className="h-0.5 rounded-none" />
    </div>
  )
}
