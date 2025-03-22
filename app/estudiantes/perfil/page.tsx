import type { Metadata } from "next"
import ProfileView from "@/components/estudiantes/profile-view"

export const metadata: Metadata = {
  title: "Mi Perfil | Portal Estudiantil",
  description: "Gestiona tu información personal y académica",
}

export default function PerfilPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
      <ProfileView />
    </div>
  )
}

