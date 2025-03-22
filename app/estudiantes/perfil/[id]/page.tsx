import { PerfilEstudiante } from "@/components/estudiantes/perfil-estudiante"

interface PerfilEstudiantePageProps {
  params: {
    id: string
  }
}

export default function PerfilEstudiantePage({ params }: PerfilEstudiantePageProps) {
  return (
    <div className="container mx-auto py-6">
      <PerfilEstudiante estudianteId={params.id} />
    </div>
  )
}

