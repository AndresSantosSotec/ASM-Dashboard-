import type { Metadata } from "next"
import { EstadoCuentaEstudiante } from "@/components/estudiantes/estado-cuenta-estudiante"

export const metadata: Metadata = {
  title: "Estado de Cuenta",
  description: "Información financiera del estudiante",
}

export default function EstadoCuentaPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Mi Estado de Cuenta</h1>
      <EstadoCuentaEstudiante />
    </div>
  )
}


