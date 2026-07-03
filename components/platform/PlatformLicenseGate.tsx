"use client"

import { useCallback, useEffect, useState } from "react"
import PlatformLicenseScreen from "@/components/platform/PlatformLicenseScreen"
import {
  PLATFORM_LICENSE_EVENT,
  fetchPlatformLicenseStatus,
  type PlatformLicenseStatus,
} from "@/services/platformLicense"

type Props = {
  children: React.ReactNode
}

const POLL_MS = 60_000

export default function PlatformLicenseGate({ children }: Props) {
  const [status, setStatus] = useState<PlatformLicenseStatus | null>(null)
  const [checking, setChecking] = useState(true)

  const refreshStatus = useCallback(async () => {
    try {
      const next = await fetchPlatformLicenseStatus()
      setStatus(next)
    } catch {
      // Fail-safe: si no se puede verificar licencia, tratar como bloqueado
      setStatus({
        locked: true,
        reason: "No se pudo verificar el estado de la licencia. Contacte a soporte.",
      })
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    refreshStatus()
    const interval = window.setInterval(refreshStatus, POLL_MS)
    return () => window.clearInterval(interval)
  }, [refreshStatus])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<PlatformLicenseStatus>).detail
      if (detail?.locked) {
        setStatus(detail)
      } else {
        refreshStatus()
      }
    }

    window.addEventListener(PLATFORM_LICENSE_EVENT, handler)
    return () => window.removeEventListener(PLATFORM_LICENSE_EVENT, handler)
  }, [refreshStatus])

  if (status?.locked) {
    return <PlatformLicenseScreen status={status} />
  }

  return <>{children}</>
}
