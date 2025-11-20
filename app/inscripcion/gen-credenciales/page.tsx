// app/inscripcion/gen-credenciales/page.tsx
import { GeneracionCredenciales } from "@/components/inscripcion/gen-credenciales"

export default function GeneracionCredencialesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Generación de Credenciales</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la generación de carnets y credenciales para estudiantes aprobados
        </p>
      </div>
      <GeneracionCredenciales />
    </div>
  )
}
