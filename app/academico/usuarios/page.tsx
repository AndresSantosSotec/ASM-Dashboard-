"use client"

import { GeneracionCredenciales } from "@/components/inscripcion/gen-credenciales"

export default function GestionUsuarios() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestión de Usuarios Académicos</h1>
        <p className="text-muted-foreground mt-2">
          Estudiantes en estado <strong>gen_credentials</strong>. Genera carnets y edítalos desde la tabla del Paso 1.
        </p>
      </div>
      <GeneracionCredenciales />
    </div>
  )
}
