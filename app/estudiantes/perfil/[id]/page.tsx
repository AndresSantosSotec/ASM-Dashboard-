import { PerfilEstudiante } from "@/components/estudiantes/perfil-estudiante"

interface PerfilEstudiantePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PerfilEstudiantePage({ params }: PerfilEstudiantePageProps) {
  const { id } = await params
  return (
    <div className="container mx-auto py-6">
      <PerfilEstudiante estudianteId={id} />
    </div>
  )
}

