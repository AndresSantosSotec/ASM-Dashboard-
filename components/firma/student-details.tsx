"use client"

import React, { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, CheckCircle } from "lucide-react"
import { API_BASE_URL } from "@/utils/apiConfig"
import { getSignatureDataUri } from "@/utils/getSignatureDataUri"
import { fetchWithAuth } from "@/utils/fetchWithAuth"

interface PreviewData {
  prospecto: { id: number; nombre: string; correo: string }
  asesor: { id: number; nombre: string; correo: string }
  programa: { id: number; abreviatura: string; nombre: string }
  montos: { inscripcion: number; mensualidad: number; convenio_id: number | null }
  fecha: string
}

interface SuccessResponse {
  message: string
  pdf_url: string
  signature_url: string
  contract_id: number
}

export function StudentDetails() {
  const { id } = useParams()
  const router = useRouter()

  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)
  const [signature, setSignature] = useState<string | null>(null)

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successData, setSuccessData] = useState<SuccessResponse | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch preview data
  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const res = await fetchWithAuth(
          `${API_BASE_URL}/api/prospectos/${id}/contrato/preview`
        )
        if (!res.ok) {
          switch (res.status) {
            case 401:
              throw new Error("No autorizado")
            case 404:
              throw new Error("Prospecto no encontrado")
            default:
              throw new Error("Error al cargar el contrato")
          }
        }
        const data: PreviewData = await res.json()
        setPreview(data)
      } catch (err: any) {
        setError(err.message || "Error desconocido")
      } finally {
        setLoadingPreview(false)
      }
    })()
  }, [id])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
  }, [])

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setLastX(x)
    setLastY(y)
    const ctx = canvas.getContext("2d")
    ctx?.beginPath()
    ctx?.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.lineTo(x, y)
    ctx.stroke()
    setLastX(x)
    setLastY(y)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    setSignature(getSignatureDataUri(canvasRef.current))
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setSignature(null)
    }
  }

  const handleSendContract = () => {
    if (!signature) {
      alert("Por favor, firme el contrato antes de enviarlo.")
      return
    }
    setShowConfirmDialog(true)
  }

  const confirmSendContract = async () => {
    setShowConfirmDialog(false)
    setLoading(true)
    setError(null)
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/prospectos/${id}/enviar-contrato`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signature }),
        }
      )
      if (res.status === 409) {
        setError("Este prospecto ya recibió el contrato hoy.")
        return
      }
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Error al enviar contrato")
      }
      const data: SuccessResponse = await res.json()
      setSuccessData(data)
      setShowSuccessDialog(true)
    } catch (err: any) {
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessDialog(false)
    router.push("/firma")
  }

  if (loadingPreview) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
      </div>
    )
  }

  if (error && !preview) {
    return <p className="text-red-500 text-center">{error}</p>
  }

  if (!preview) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contrato de Confidencialidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p>
              Yo: <strong>{preview.prospecto.nombre}</strong> ({preview.prospecto.correo}) y
              Asesor: <strong>{preview.asesor.nombre}</strong> ({preview.asesor.correo})
            </p>
            <p>
              Programa: <strong>{preview.programa.nombre}</strong> ({preview.programa.abreviatura})
            </p>
            <p>Matrícula: Q{preview.montos.inscripcion}</p>
            <p>Mensualidad: Q{preview.montos.mensualidad}</p>
            <p>Fecha: {preview.fecha}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Firma del Asesor</h4>
            <div className="border rounded-lg p-2">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="border rounded cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={clearSignature}>
                  Limpiar Firma
                </Button>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button
            className="w-full"
            onClick={handleSendContract}
            disabled={!signature || loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" /> Enviando...
              </>
            ) : (
              "Enviar Contrato"
            )}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envío</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Desea enviar este contrato firmado? No podrá deshacerlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSendContract}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center">
            <div className="mb-2">
              <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
            </div>
            <AlertDialogTitle>¡Enviado con éxito!</AlertDialogTitle>
            {successData && (
              <AlertDialogDescription className="space-y-2">
                <p>{successData.message}</p>
                <p>
                  <a
                    href={successData.pdf_url}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    Ver contrato PDF
                  </a>
                </p>
                <p>
                  <a
                    href={successData.signature_url}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    Ver firma
                  </a>
                </p>
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center">
            <AlertDialogAction onClick={handleSuccessClose}>
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default StudentDetails
