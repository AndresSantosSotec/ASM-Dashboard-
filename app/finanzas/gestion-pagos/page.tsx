import type { Metadata } from "next"
import { GestionPagos } from "@/components/finanzas/gestion-pagos"

export const metadata: Metadata = {
  title: "Gestión de Pagos",
  description: "Control de morosidad y seguimiento de pagos",
}

export default function PaymentManagementPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <GestionPagos />
    </div>
  )
}

