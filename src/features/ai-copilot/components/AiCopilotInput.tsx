import { ArrowUp, Mic, Paperclip, Square, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Textarea } from '@/components/ui/textarea'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { cn } from '@/lib/utils'

const ACCEPTED_TYPES = '.pdf,.docx,.txt,.md,.xlsx,.xlsm'

export function AiCopilotInput() {
  const { sendMessage, isGenerating, stopGeneration } = useAiCopilot()

  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<{ start: () => void; stop: () => void; lang?: string; interimResults?: boolean; continuous?: boolean; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: ((event?: { error?: string }) => void) | null; onend: (() => void) | null } | null>(null)
  const [isListening, setIsListening] = useState(false)

  const canSend = (input.trim().length > 0 || attachments.length > 0) && !isGenerating

  const submit = () => {
    if (!canSend) return
    void sendMessage(input.trim(), undefined, attachments)
    setInput('')
    setAttachments([])
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const incoming = Array.from(e.target.files)
    setAttachments((prev) => {
      const existing = new Set(prev.map((f) => f.name))
      return [...prev, ...incoming.filter((f) => !existing.has(f.name))]
    })
    e.target.value = ''
  }

  const removeAttachment = (name: string) =>
    setAttachments((prev) => prev.filter((f) => f.name !== name))

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const speechWindow = window as unknown as { SpeechRecognition?: new () => NonNullable<typeof recognitionRef.current>; webkitSpeechRecognition?: new () => NonNullable<typeof recognitionRef.current> }
    const SpeechRecognitionConstructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!SpeechRecognitionConstructor) {
      window.alert('Voice input is not supported in this browser. Please use the text input.')
      return
    }
    let recognition: NonNullable<typeof recognitionRef.current>
    try {
      recognition = new SpeechRecognitionConstructor()
    } catch {
      window.alert('Unable to start voice input. Please check microphone permissions and use text input if needed.')
      return
    }
    recognition.lang = navigator.language || 'en-IN'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0]?.transcript ?? '').join(' ').trim()
      if (transcript) setInput((current) => `${current}${current ? ' ' : ''}${transcript}`)
    }
    recognition.onerror = (event) => {
      setIsListening(false)
      const reason = event?.error
      if (reason === 'not-allowed' || reason === 'service-not-allowed') {
        window.alert('Microphone access is blocked. Allow microphone permission for this site, then try again.')
      } else if (reason === 'audio-capture') {
        window.alert('No microphone was detected. Connect or enable a microphone, or use text input.')
      } else if (reason === 'network') {
        window.alert('Voice recognition needs a network connection. Check your connection or use text input.')
      }
    }
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    setIsListening(true)
    try {
      recognition.start()
    } catch {
      setIsListening(false)
      recognitionRef.current = null
      window.alert('Voice input could not start. Please try again or use text input.')
    }
  }

  /* Listen for prompt injections from suggested-prompt chips elsewhere in the UI */
  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<string>).detail
      if (!detail) return
      setInput(detail)
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
    window.addEventListener('sales-assistant-prompt', handler)
    return () => window.removeEventListener('sales-assistant-prompt', handler)
  }, [])

  return (
    <div className="mx-auto w-full max-w-3xl px-6">

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((file) => (
            <span
              key={file.name}
              className="flex max-w-[200px] items-center gap-1 truncate rounded-full border border-border bg-muted px-3 py-1 text-xs"
            >
              <Paperclip className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(file.name)}
                className="ml-1 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input pill — matches screenshot */}
      <div
        className={cn(
          'flex items-end gap-2 rounded-full border border-border bg-background px-4 py-2.5 shadow-sm',
          'transition-all focus-within:border-border/80 focus-within:shadow-md',
        )}
      >
        {/* Paperclip — left */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach files"
          title="Attach files"
          className="mb-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Paperclip className="size-4" />
        </button>

        {/* Textarea — grows with content */}
        <Textarea
          ref={textareaRef}
          placeholder="Ask Sales Assistant..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          rows={1}
          disabled={isGenerating}
          className="
            min-h-[24px] max-h-[160px] flex-1
            resize-none border-0 bg-transparent p-0
            text-sm shadow-none
            focus-visible:ring-0
          "
          aria-label="Ask Sales Assistant"
        />

        {/* Natural-language voice input */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          disabled={isGenerating}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          title={isListening ? 'Listening… click to stop' : 'Speak naturally'}
          className={cn('mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-full transition-colors', isListening ? 'bg-red-600 text-white' : 'text-muted-foreground hover:text-foreground')}
        >
          <Mic className="size-3.5" />
        </button>

        {/* Send / Stop — right */}
        {isGenerating ? (
          <button
            type="button"
            onClick={stopGeneration}
            aria-label="Stop generating"
            title="Stop"
            className="mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80"
          >
            <Square className="size-3 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
            title="Send"
            className={cn(
              'mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-full transition-all',
              canSend
                ? 'bg-foreground text-background hover:opacity-80'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            <ArrowUp className="size-3.5" />
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Sales Assistant can make mistakes. Check important info.
      </p>
    </div>
  )
}
