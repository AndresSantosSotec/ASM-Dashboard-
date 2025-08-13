// utils/resolveBackendUrl.ts
export const resolveBackendUrl = (input: string, API_BASE_URL: string) => {
  const join = (base: string, path: string) =>
    base.replace(/\/+$/, "") + "/" + String(path || "").replace(/^\/+/, "")

  try {
    // Si es absoluta, la forzamos al mismo origen del API_BASE_URL
    const u = new URL(input)
    const base = new URL(API_BASE_URL)
    u.protocol = base.protocol
    u.host = base.host // incluye puerto si lo hay (localhost:8000)
    return u.toString()
  } catch {
    // Si es relativa, la pegamos al API_BASE_URL
    return join(API_BASE_URL, input)
  }
}
