import type { Metadata } from "next"
import { BeneficiariesManagement } from "@/components/finanzas/beneficiaries-management"

export const metadata: Metadata = {
  title: "Gestión de Beneficiarios - ASM Dashboard",
  description: "Administración de beneficiarios y cuentas para transferencias financieras",
}

export default function BeneficiariesPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <BeneficiariesManagement />
    </div>
  )
}