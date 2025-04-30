"use client"

import { ApprovalRequest } from "@/components/approval-request"

// ... resto del código existente ...

export default function InscriptionForm() {
  const handleApprovalRequest = (data: {
    approvals: string[]
    message: string
  }) => {
    // Transformar los datos según sea necesario
    const transformedData = {
      commercial: data.approvals.includes("commercial"),
      financial: data.approvals.includes("financial"),
      academic: data.approvals.includes("academic"),
      message: data.message,
    }

    // Aquí iría la lógica para procesar la solicitud de aprobación
    console.log("Solicitud de aprobación:", transformedData)
  }

  return (
    <div className="container py-6 space-y-6">
      {/* ... otros componentes del formulario ... */}

      <ApprovalRequest onSubmit={handleApprovalRequest} />

      {/* ... resto del formulario ... */}
    </div>
  )
}

