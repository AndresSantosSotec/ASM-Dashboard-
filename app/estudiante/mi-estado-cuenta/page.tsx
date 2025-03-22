import type { Metadata } from "next"
import { MiEstadoCuenta } from "@/components/estudiantes/mi-estado-cuenta"

export const metadata: Metadata = {
  title: "Mi Estado de Cuenta",
  description: "Consulta tu estado de cuenta y realiza pagos",
}

export default function MiEstadoCuentaPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <MiEstadoCuenta />
    </div>
  )
}

