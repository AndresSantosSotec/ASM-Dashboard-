"use client"

import { ApprovalRequest } from "@/components/approval-request"

// ... resto del código existente ...

export default function InscriptionForm() {
  const handleApprovalRequest = async (data: {
    commercial: boolean
    financial: boolean
    academic: boolean
    message: string
  }) => {
    // Aquí iría la lógica para procesar la solicitud de aprobación
    console.log("Solicitud de aprobación:", data)
  }

  return (
    <div className="container py-6 space-y-6">
      {/* ... otros componentes del formulario ... */}

      <ApprovalRequest onSubmit={handleApprovalRequest} />

      {/* ... resto del formulario ... */}
    </div>
  )
}

