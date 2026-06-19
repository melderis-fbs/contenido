export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Parse a post date string into a local-time Date.
 * Date-only strings like "2026-06-18" are parsed by JS as UTC midnight,
 * which shifts to the previous day in UTC-3 (Argentina). Appending T00:00
 * forces local-time parsing per the ISO 8601 spec.
 */
export function parsePostDate(fecha: string): Date {
  return new Date(fecha.length === 10 ? `${fecha}T00:00` : fecha)
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
