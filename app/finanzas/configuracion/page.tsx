import type { Metadata } from "next"
import { ConfiguracionReglas } from "@/components/finanzas/configuracion-reglas"

export const metadata: Metadata = {
  title: "Configuración de Reglas Financieras",
  description: "Administración de reglas de pagos, notificaciones y bloqueos",
}

export default function FinancialConfigPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <ConfiguracionReglas />
    </div>
  )
}

