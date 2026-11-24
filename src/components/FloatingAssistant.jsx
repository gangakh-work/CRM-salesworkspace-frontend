import Icon from './Icon'
import { useApp } from '../lib/store'

export default function FloatingAssistant() {
  const { page, goAssistant, assistantReturn } = useApp()
  if (page === 'assistant') return null

  return (
    <button
      type="button"
      className="floating-assistant"
      onClick={goAssistant}
      aria-label="Ask AI Assistant"
      data-tip="Ask AI Assistant"
    >
      <span className="floating-assistant-icon"><Icon name="sparkle" size={22} /></span>
    </button>
  )
}
