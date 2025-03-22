import type { Metadata } from "next"
import { ReportesFinancieros } from "@/components/finanzas/reportes-financieros"

export const metadata: Metadata = {
  title: "Reportes Financieros",
  description: "Generación de reportes financieros, estados de cuenta y libros contables",
}

export default function ReportesFinancierosPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <ReportesFinancieros />
    </div>
  )
}

