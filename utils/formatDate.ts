/**
 * Formats an ISO date string into dd/MM/yyyy without timezone shifts.
 * Returns "—" when the value is falsy or cannot be parsed.
 */
export function formatDate(value?: string): string {
  if (!value) return '—'
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(value)
  if (!match) return '—'
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

export default formatDate
