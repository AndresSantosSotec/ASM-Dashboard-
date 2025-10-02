import type { Metadata } from "next"
import { KardexSinCuotas } from "@/components/finanzas/kardex-sin-cuotas"

export const metadata: Metadata = {
  title: "Kardex sin Cuotas",
  description: "Gestión de pagos sin cuotas asignadas",
}

export default function KardexSinCuotasPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <KardexSinCuotas />
    </div>
  )
}
