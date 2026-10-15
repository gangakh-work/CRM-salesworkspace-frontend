import { useEffect } from 'react'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'

export function AiAssistantPage() {
  const { open } = useAiCopilot()

  useEffect(() => {
    open({ mode: 'fullscreen' })
  }, [open])

  // The panel renders via GlobalAiCopilot — nothing else needed here
  return null
}
