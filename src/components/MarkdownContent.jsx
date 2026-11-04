import React from 'react'

function inlineParts(text, keyPrefix = 'i') {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*|_[^_]+_)/g
  const parts = String(text ?? '').split(pattern)
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`
    if (!part) return null
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) return <strong key={key}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>
    if (part.startsWith('[')) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (match) {
        let url
        try { url = new URL(match[2], window.location.origin) } catch { url = null }
        if (url && ['http:', 'https:', 'mailto:'].includes(url.protocol)) return <a key={key} href={url.href} target="_blank" rel="noopener noreferrer">{match[1]}</a>
      }
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) return <em key={key}>{part.slice(1, -1)}</em>
    return part
  })
}

function cleanContent(value) {
  return String(value ?? '').replace(/\[(?:Missing|Not provided|Unavailable)[^\]]*\]/gi, 'Not available')
}

export default function MarkdownContent({ children, className = '' }) {
  const lines = cleanContent(children).replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    if (/^\s*```/.test(line)) {
      const language = line.trim().slice(3).trim()
      i++
      const code = []
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++])
      i++
      blocks.push(<pre key={`code-${i}`}><code className={language ? `language-${language}` : undefined}>{code.join('\n')}</code></pre>)
      continue
    }
    const heading = line.match(/^\s*(#{1,6})\s+(.+)$/)
    if (heading) {
      const level = heading[1].length
      const Tag = `h${level}`
      blocks.push(<Tag key={`h-${i}`}>{inlineParts(heading[2], `h${i}`)}</Tag>); i++; continue
    }
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { blocks.push(<hr key={`hr-${i++}`} />); continue }
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const cells = value => value.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(v => v.trim())
      const headers = cells(line); i += 2
      const rows = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(cells(lines[i++]))
      blocks.push(<div className="agent-markdown-table-wrap" key={`table-${i}`}><table><thead><tr>{headers.map((cell, j) => <th key={j}>{inlineParts(cell, `th${i}-${j}`)}</th>)}</tr></thead><tbody>{rows.map((row, r) => <tr key={r}>{headers.map((_, j) => <td key={j}>{inlineParts(row[j] || '', `td${i}-${r}-${j}`)}</td>)}</tr>)}</tbody></table></div>)
      continue
    }
    const unordered = line.match(/^\s*[-*+]\s+(.+)$/)
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/)
    if (unordered || ordered) {
      const isOrdered = Boolean(ordered), items = []
      while (i < lines.length) {
        const match = lines[i].match(isOrdered ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/)
        if (!match) break
        items.push(match[1]); i++
      }
      const Tag = isOrdered ? 'ol' : 'ul'
      blocks.push(<Tag key={`list-${i}`}>{items.map((item, j) => <li key={j}>{inlineParts(item, `li${i}-${j}`)}</li>)}</Tag>)
      continue
    }
    const paragraph = [line.trim()]; i++
    while (i < lines.length && lines[i].trim() && !/^\s*(#{1,6}\s|```|[-*+]\s+|\d+[.)]\s+|---+\s*$)/.test(lines[i])) paragraph.push(lines[i++].trim())
    blocks.push(<p key={`p-${i}`}>{inlineParts(paragraph.join(' '), `p${i}`)}</p>)
  }
  return <div className={`agent-markdown ${className}`}>{blocks}</div>
}
