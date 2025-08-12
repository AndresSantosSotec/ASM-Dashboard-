"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { usePermissions } from "./PermissionsProvider"

type Props = {
  routePath: string
  children: React.ReactNode
  strictMode?: boolean
}

const RouteGuard: React.FC<Props> = ({ routePath, children, strictMode = false }) => {
  const { loading, error, hasView } = usePermissions()
  const router = useRouter()

  if (loading) return <div className="p-6">Cargando permisos…</div>

  if (strictMode) {
    if (error) return <div className="p-6">No se pudieron cargar permisos.</div>
    if (!hasView(routePath)) {
      router.replace("/sin-acceso")
      return null
    }
  }

  return <>{children}</>
}

export default RouteGuard

