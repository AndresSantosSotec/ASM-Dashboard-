import type { Metadata } from "next"
import { SeguimientoEstudiantes } from "@/components/finanzas/seguimiento-estudiantes"

export const metadata: Metadata = {
  title: "Seguimiento de Estudiantes",
  description: "Gestión de cuotas por estudiante",
}

export default function SeguimientoEstudiantesPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <SeguimientoEstudiantes />
    </div>
  )
}
