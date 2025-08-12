"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { usePermissions } from "./PermissionsProvider"

type Props = {
  routePath?: string
  children: React.ReactNode
  strictMode?: boolean
}

const RouteGuard: React.FC<Props> = ({ routePath, children, strictMode = false }) => {
  const { loading, error, hasView } = usePermissions()
  const router = useRouter()
  const pathname = usePathname()
  const checkPath = routePath ?? pathname

  if (loading) return <div className="p-6">Cargando permisos…</div>

  if (strictMode) {
    if (error) return <div className="p-6">No se pudieron cargar permisos.</div>
    if (!hasView(checkPath)) {
      router.replace("/sin-acceso")
      return null
    }
  }

  return <>{children}</>
}

export default RouteGuard

