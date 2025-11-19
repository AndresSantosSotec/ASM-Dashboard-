// app/inscripcion/aprobacion-academica/page.tsx
import { AprobacionAcademica } from "@/components/inscripcion/aprobacion-academica"

export default function AprobacionAcademicaPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Aprobación Académica</h1>
        <p className="text-muted-foreground mt-2">
          Revisa y aprueba la información académica para completar el proceso de inscripción
        </p>
      </div>
      <AprobacionAcademica />
    </div>
  )
}
