/**
 * Fuzzy search utilities — accent-insensitive, case-insensitive, typo-tolerant.
 * Zero external dependencies.
 */

/**
 * Normalizes text: lowercase + strips diacritics (á→a, ñ→n, etc.)
 */
export function normalize(text: string): string {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Returns true if `target` contains `term` — with:
 *  - case insensitivity
 *  - accent insensitivity  (León = Leon)
 *  - single-char typo tolerance via trigram overlap (fernado ≈ fernando)
 */
export function fuzzyIncludes(target: string, term: string): boolean {
  const t = normalize(target)
  const q = normalize(term)
  if (!q) return true
  // exact (normalized) substring match
  if (t.includes(q)) return true
  // trigram fallback — catches missing/extra/swapped single characters
  if (q.length < 3) return false
  const grams = (s: string) =>
    Array.from({ length: Math.max(0, s.length - 2) }, (_, i) => s.slice(i, i + 3))
  const tGrams = new Set(grams(t))
  const qGrams = grams(q)
  if (qGrams.length === 0) return false
  const hits = qGrams.filter((g) => tGrams.has(g)).length
  return hits / qGrams.length >= 0.5
}

/**
 * Multi-token fuzzy match across one or many fields.
 * ALL space-separated tokens in `query` must fuzzy-match at least one field.
 *
 * @example
 * fuzzyMatch(["Fernando Esteban de León", "carnet-123"], "fernado leon") // true
 * fuzzyMatch("María José", "maria jose") // true
 */
export function fuzzyMatch(fields: string | string[], query: string): boolean {
  if (!query?.trim()) return true
  const targets = Array.isArray(fields) ? fields : [fields]
  return query
    .trim()
    .split(/\s+/)
    .every((token) => targets.some((field) => fuzzyIncludes(field, token)))
}
