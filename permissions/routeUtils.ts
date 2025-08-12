export function normalizeRoute(path: string): string {
  try {
    if (path.startsWith('http')) {
      const u = new URL(path)
      path = u.pathname
    }
  } catch {}
  let p = (path || '').trim().toLowerCase()
  p = p.split('?')[0].split('#')[0]
  p = p.replace(/\/{2,}/g, '/')
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p
}

export function matchesRoute(candidate: string, target: string): boolean {
  const c = normalizeRoute(candidate)
  const t = normalizeRoute(target)
  if (c === t) return true
  if (t.startsWith(c + '/')) return true
  return false
}

export default { normalizeRoute, matchesRoute }
