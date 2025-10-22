import type { Metadata } from "next"
import { MantenimientosFinancieros } from "@/components/finanzas/reportes-financieros"

export const metadata: Metadata = {
  title: "Mantenimientos Financieros",
  description:
    "Administre el kardex de pagos, las cuotas de estudiantes y la generación de reportes financieros oficiales",
}

export default function MantenimientosFinancierosPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <MantenimientosFinancieros />
    </div>
  )
}
