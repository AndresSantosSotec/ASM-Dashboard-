import type { Metadata } from "next"
import { EstadoCuentaEstudiante } from "@/components/finanzas/estado-cuenta-estudiante"

export const metadata: Metadata = {
  title: "Estado de Cuenta",
  description: "Consulta de estado de cuenta y gestión de pagos",
}

export default function AccountStatementPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Mi Estado de Cuenta</h1>
      <EstadoCuentaEstudiante />
    </div>
  )
}

