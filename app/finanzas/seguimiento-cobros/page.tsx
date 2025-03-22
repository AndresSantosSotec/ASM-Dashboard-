import type { Metadata } from "next"
import { SeguimientoCobros } from "@/components/finanzas/seguimiento-cobros"

export const metadata: Metadata = {
  title: "Seguimiento de Cobros",
  description: "Gestión y seguimiento de alumnos con pagos pendientes",
}

export default function CollectionFollowUpPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <SeguimientoCobros />
    </div>
  )
}

