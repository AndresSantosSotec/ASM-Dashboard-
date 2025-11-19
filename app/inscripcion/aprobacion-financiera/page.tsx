// app/inscripcion/aprobacion-financiera/page.tsx
import { AprobacionFinanciera } from "@/components/inscripcion/aprobacion-financiera"

export default function AprobacionFinancieraPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Aprobación Financiera</h1>
        <p className="text-muted-foreground mt-2">
          Revisa y aprueba la información financiera de los estudiantes pendientes
        </p>
      </div>
      <AprobacionFinanciera />
    </div>
  )
}
