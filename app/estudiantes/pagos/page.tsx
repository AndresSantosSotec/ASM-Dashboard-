import type { Metadata } from "next"
import { PaymentsView } from "@/components/estudiantes/payments-view"

export const metadata: Metadata = {
  title: "Gestión de Pagos",
  description: "Realiza y gestiona tus pagos académicos",
}

export default function PaymentsPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Gestión de Pagos</h1>
      <PaymentsView />
    </div>
  )
}

