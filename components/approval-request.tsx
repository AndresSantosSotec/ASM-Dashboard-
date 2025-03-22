"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface ApprovalType {
  id: string
  label: string
  description: string
}

interface ApprovalRequestProps {
  onSubmit: (data: {
    approvals: string[]
    message: string
  }) => void
}

const APPROVAL_TYPES: ApprovalType[] = [
  {
    id: "commercial",
    label: "Aprobación Comercial",
    description: "Validación de condiciones comerciales y descuentos aplicados",
  },
  {
    id: "financial",
    label: "Aprobación Financiera",
    description: "Verificación de plan de pagos y condiciones financieras",
  },
  {
    id: "academic",
    label: "Aprobación Académica",
    description: "Validación de requisitos académicos y documentación",
  },
]

export function ApprovalRequest({ onSubmit }: ApprovalRequestProps) {
  const [selectedApprovals, setSelectedApprovals] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleApprovalChange = (approval: string, checked: boolean) => {
    if (checked) {
      setSelectedApprovals([...selectedApprovals, approval])
    } else {
      setSelectedApprovals(selectedApprovals.filter((a) => a !== approval))
    }
  }

  const handleSubmit = () => {
    onSubmit({
      approvals: selectedApprovals,
      message,
    })
    setSubmitted(true)
  }

  const isValid = selectedApprovals.length > 0 && message.trim().length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitud de Aprobaciones</CardTitle>
        <CardDescription>
          Seleccione los tipos de aprobación requeridos para continuar con el proceso de inscripción
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            El proceso de inscripción no podrá continuar hasta que todas las aprobaciones seleccionadas sean
            completadas.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {APPROVAL_TYPES.map((approval) => (
            <div key={approval.id} className="flex items-start space-x-2">
              <Checkbox
                id={approval.id}
                checked={selectedApprovals.includes(approval.id)}
                onCheckedChange={(checked) => handleApprovalChange(approval.id, checked === true)}
                disabled={submitted}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor={approval.id} className="text-sm font-medium">
                  {approval.label}
                </Label>
                <p className="text-sm text-muted-foreground">{approval.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Mensaje para los aprobadores</Label>
          <Textarea
            id="message"
            placeholder="Describa los detalles o consideraciones especiales para esta solicitud de aprobación..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            disabled={submitted}
          />
        </div>

        {submitted && (
          <div className="flex items-center p-3 text-sm rounded-md bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>Solicitud de aprobación enviada correctamente</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={!isValid || submitted} className="w-full">
          {submitted ? "Solicitud Enviada" : "Enviar Solicitud de Aprobación"}
        </Button>
      </CardFooter>
    </Card>
  )
}

