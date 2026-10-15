/**
 * Lightweight semantic-style search used by CRM lists.
 *
 * It is intentionally dependency-free: matching is case-insensitive,
 * punctuation-insensitive, token-aware, and tolerant of small typos.
 */

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9@._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshteinWithinOne(a: string, b: string): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      )
    }

    previous = current
  }

  return previous[b.length] <= 1
}

/** Returns true when query meaningfully matches the supplied searchable text. */
export function semanticMatches(
  query: string,
  values: Array<string | null | undefined>,
): boolean {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return true

  const text = normalize(values.filter(Boolean).join(' '))
  if (!text) return false

  // Fast path for an exact phrase / substring.
  if (text.includes(normalizedQuery)) return true

  const queryTokens = normalizedQuery.split(' ').filter(Boolean)
  const textTokens = text.split(' ').filter(Boolean)

  return queryTokens.every((queryToken) =>
    textTokens.some((textToken) => {
      // Only accept a query token when the record token starts with it or
      // contains it. The reverse check (queryToken.includes(textToken)) made
      // short words such as 'au' match 'Automation', creating false positives.
      if (textToken.includes(queryToken)) {
        return true
      }

      // Only allow fuzzy matching for useful-length words so short terms
      // do not create unrelated matches.
      if (queryToken.length >= 5 && textToken.length >= 5) {
        return levenshteinWithinOne(queryToken, textToken)
      }

      return false
    }),
  )
}
