import { API_BASE_URL } from "@/utils/apiConfig"

export interface PlatformLicenseStatus {
  locked: boolean
  enforced?: boolean
  code?: string
  message?: string | null
  reason?: string | null
  locked_at?: string | null
  tamper_detected?: boolean
  contact_phones?: string[]
}

export async function fetchPlatformLicenseStatus(): Promise<PlatformLicenseStatus> {
  const res = await fetch(`${API_BASE_URL}/api/platform/license-status`, {
    method: "GET",
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`No se pudo consultar licencia (${res.status})`)
  }

  return res.json()
}

export const PLATFORM_LICENSE_EVENT = "platform:license-locked"

export function dispatchPlatformLicenseLocked(detail: PlatformLicenseStatus) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PLATFORM_LICENSE_EVENT, { detail }))
}

export function isPlatformLicenseLockedPayload(data: unknown): data is PlatformLicenseStatus {
  return typeof data === "object" && data !== null && (data as PlatformLicenseStatus).locked === true
}
