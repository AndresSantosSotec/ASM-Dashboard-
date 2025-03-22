import type { Metadata } from "next"
import { SubirBoleta } from "@/components/finanzas/subir-boleta"

export const metadata: Metadata = {
  title: "Subir Boleta de Pago",
  description: "Cargue boletas de pago para su posterior conciliación",
}

export default function SubirBoletaPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <SubirBoleta />
    </div>
  )
}

