import type { Metadata } from "next"
import { EstadoCuenta } from "@/components/estudiantes/estado-cuenta"

export const metadata: Metadata = {
  title: "Estado de Cuenta",
  description: "Información financiera del estudiante",
}

export default function EstadoCuentaPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <EstadoCuenta estudianteId="est-001" nombreEstudiante="Juan Pérez" />
    </div>
  )
}

