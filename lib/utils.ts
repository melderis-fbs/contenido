export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Converts an ISO date string or Notion date string to datetime-local input format */
export function toDatetimeLocal(isoString: string | null): string {
  if (!isoString) return ''
  const s = isoString.slice(0, 16) // "YYYY-MM-DDTHH:MM"
  if (s.length === 10) return `${s}T00:00`
  return s
}

/** Chunks text into Notion rich_text blocks (2000-char limit per block) */
export function toRichText(text: string): Array<{ text: { content: string } }> {
  if (!text) return [{ text: { content: '' } }]
  const chunks: Array<{ text: { content: string } }> = []
  for (let i = 0; i < text.length; i += 2000) {
    chunks.push({ text: { content: text.slice(i, i + 2000) } })
  }
  return chunks
}

/** Formats a date for display */
export function formatDisplayDate(isoString: string | null): string {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return d.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatTime(isoString: string | null): string {
  if (!isoString || isoString.length <= 10) return ''
  const d = new Date(isoString)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}
