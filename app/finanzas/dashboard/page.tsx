import type { Metadata } from "next"
import { DashboardFinancieroHibrido } from "@/components/finanzas/DashboardFinancieroHibrido"

export const metadata: Metadata = {
  title: "Dashboard Financiero - Vista Completa",
  description: "Dashboard financiero con dos perspectivas: estudiantes activos del mes y universo completo de estudiantes.",
}

export default function DashboardFinancieroPage() {
  return (
    <div className="container mx-auto py-6 max-w-[1600px]">
      <DashboardFinancieroHibrido />
    </div>
  )
}

