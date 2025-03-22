import type { Metadata } from "next"
import { GestionEstadosCuenta } from "@/components/admin/gestion-estados-cuenta"

export const metadata: Metadata = {
  title: "Gestión de Estados de Cuenta",
  description: "Administra los estados de cuenta de los estudiantes",
}

export default function GestionEstadosCuentaPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <GestionEstadosCuenta />
    </div>
  )
}

