import type { Metadata } from "next"
import { DashboardFinanciero } from "@/components/finanzas/dashboard-financiero"

export const metadata: Metadata = {
  title: "Dashboard Financiero",
  description: "Análisis y métricas financieras de la institución",
}

export default function DashboardFinancieroPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <DashboardFinanciero />
    </div>
  )
}

