import { format, parseISO } from 'date-fns'

/**
 * Formats an ISO date string into dd/MM/yyyy.
 * Returns "—" when value is falsy or invalid.
 */
export function formatDate(value?: string): string {
  if (!value) return '—'
  try {
    const date = parseISO(value)
    if (isNaN(date.getTime())) return '—'
    return format(date, 'dd/MM/yyyy')
  } catch {
    return '—'
  }
}

export default formatDate
