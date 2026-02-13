import MiPerfilView from "@/components/mi-perfil/mi-perfil-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mi Perfil | ASM Dashboard",
  description: "Gestión de perfil y seguridad de cuenta",
}

export default function MiPerfilPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
      <MiPerfilView />
    </div>
  )
}
