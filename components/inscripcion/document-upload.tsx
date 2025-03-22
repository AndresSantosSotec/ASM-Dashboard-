"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Document {
  id: string
  name: string
  description: string
  status: "pending" | "uploaded"
  file: File | null
}

export function DocumentUpload() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "dpi",
      name: "DPI (Ambos lados)",
      description: "Documento de identificación personal, ambos lados en un solo archivo.",
      status: "pending",
      file: null,
    },
    {
      id: "utility",
      name: "Recibo de luz o teléfono",
      description: "Comprobante de domicilio reciente (no mayor a 3 meses).",
      status: "pending",
      file: null,
    },
    {
      id: "american",
      name: "Recibo de American",
      description: "Comprobante de pago emitido por American SM.",
      status: "pending",
      file: null,
    },
    {
      id: "registration",
      name: "Boleta de pago de inscripción",
      description: "Comprobante de pago de la cuota de inscripción.",
      status: "pending",
      file: null,
    },
  ])

  const handleFileUpload = (documentId: string, file: File) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === documentId ? { ...doc, file, status: "uploaded" as const } : doc)),
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <Alert className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
        <AlertDescription>
          Todos los documentos deben estar en formato PDF, JPG o PNG y no deben exceder los 5MB.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {documents.map((doc) => (
          <Card key={doc.id} className="border">
            <CardContent className="p-4">
              <div className="mb-4">
                <h3 className="font-medium flex items-center justify-between">
                  {doc.name}
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      doc.status === "uploaded" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {doc.status === "uploaded" ? "Cargado" : "Pendiente"}
                  </span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = ".pdf,.jpg,.jpeg,.png"
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      handleFileUpload(doc.id, file)
                    }
                  }
                  input.click()
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                {doc.file ? doc.file.name : "Subir Archivo"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline">Anterior</Button>
        <Button>Guardar y Continuar</Button>
      </div>
    </div>
  )
}

