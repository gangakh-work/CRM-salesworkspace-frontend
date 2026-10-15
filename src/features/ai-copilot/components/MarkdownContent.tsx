import { cn } from '@/lib/utils'

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const blocks = parseMarkdownBlocks(content)

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none space-y-3', className)}>
      {blocks.map((block, i) => {
        if (block.type === 'code') {
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg border bg-muted/50 p-3 text-xs leading-relaxed"
            >
              <code>{block.content}</code>
            </pre>
          )
        }
        if (block.type === 'table') {
          return (
            <div key={i} className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {block.headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, ri) => (
                    <tr key={ri} className="border-b last:border-0">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2">{formatInline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (block.type === 'blockquote') {
          return (
            <blockquote key={i} className="border-l-4 border-primary/40 pl-3 italic text-muted-foreground">
              {formatInline(block.content)}
            </blockquote>
          )
        }
        if (block.type === 'h2') {
          return <h2 key={i} className="text-base font-semibold">{formatInline(block.content)}</h2>
        }
        if (block.type === 'h3') {
          return <h3 key={i} className="text-sm font-semibold">{formatInline(block.content)}</h3>
        }
        if (block.type === 'ul') {
          return (
            <ul key={i} className="list-disc space-y-1 pl-4">
              {block.items.map((item) => (
                <li key={item}>{formatInline(item)}</li>
              ))}
            </ul>
          )
        }
        if (block.type === 'ol') {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-4">
              {block.items.map((item) => (
                <li key={item}>{formatInline(item)}</li>
              ))}
            </ol>
          )
        }
        return (
          <p key={i} className="leading-relaxed text-sm">
            {formatInline(block.content)}
          </p>
        )
      })}
    </div>
  )
}

type Block =
  | { type: 'p'; content: string }
  | { type: 'h2'; content: string }
  | { type: 'h3'; content: string }
  | { type: 'code'; content: string }
  | { type: 'blockquote'; content: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }

function parseMarkdownBlocks(md: string): Block[] {
  const blocks: Block[] = []
  const lines = md.split('\n')
  let i = 0
  let inCode = false
  let codeBuf: string[] = []

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', content: codeBuf.join('\n') })
        codeBuf = []
        inCode = false
      } else {
        inCode = true
      }
      i += 1
      continue
    }

    if (inCode) {
      codeBuf.push(line)
      i += 1
      continue
    }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', content: line.slice(3) })
      i += 1
      continue
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', content: line.slice(4) })
      i += 1
      continue
    }
    if (line.startsWith('> ')) {
      blocks.push({ type: 'blockquote', content: line.slice(2) })
      i += 1
      continue
    }
    if (line.startsWith('| ') && lines[i + 1]?.includes('---')) {
      const headers = line.split('|').filter(Boolean).map((c) => c.trim())
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i].split('|').filter(Boolean).map((c) => c.trim()))
        i += 1
      }
      blocks.push({ type: 'table', headers, rows })
      continue
    }
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i += 1
      }
      blocks.push({ type: 'ul', items })
      continue
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i += 1
      }
      blocks.push({ type: 'ol', items })
      continue
    }
    if (line.trim() === '---') {
      i += 1
      continue
    }
    if (line.trim()) {
      blocks.push({ type: 'p', content: line })
    }
    i += 1
  }

  return blocks
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    if (link) {
      const href = link[2].trim()
      // Only real web links; anything else (javascript:, data:, …) stays text.
      if (/^https?:\/\//i.test(href)) {
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {link[1]}
          </a>
        )
      }
      return link[1]
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 text-xs">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}
