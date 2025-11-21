"use client"

import { DatosCrudos } from "@/components/inscripcion/datos-crudos"

export default function DatosCrudosPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Datos Crudos - Prospectos</h1>
        <p className="text-muted-foreground mt-2">
          Vista tipo Excel con toda la información de prospectos pendientes de generación de credenciales
        </p>
      </div>
      <DatosCrudos />
    </div>
  )
}
