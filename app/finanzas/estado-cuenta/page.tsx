import React from "react"
import type { Metadata } from "next"
import { EstadoCuentaEstudiante } from "@/components/finanzas/estado-cuenta-estudiante"
import RouteGuard from "@/permissions/RouteGuard"
import { ROUTES } from "@/constants/routes"

export const metadata: Metadata = {
  title: "Estado de Cuenta",
  description: "Consulta de estado de cuenta y gestión de pagos",
}

export default function AccountStatementPage() {
  return (
    <RouteGuard routePath={ROUTES.accountState} strictMode={false}>
      <div className="container mx-auto py-6 max-w-7xl">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">Mi Estado de Cuenta</h1>
        <EstadoCuentaEstudiante />
      </div>
    </RouteGuard>
  )
}

