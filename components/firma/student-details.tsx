"use client"

import React, { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
import { CheckCircle, ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface Student {
  id: string
  name: string
}

export function StudentDetails() {
  const { id: studentId } = useParams()
  const router = useRouter()

  const [student, setStudent] = useState<Student | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // 1) Traer prospecto
  useEffect(() => {
    if (!studentId) return
    ;(async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`http://127.0.0.1:8000/api/prospectos/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        setStudent({
          id: String(json.data.id),
          name: json.data.nombre_completo,
        })
      } catch (err) {
        console.error(err)
      }
    })()
  }, [studentId])

  // 2) Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.strokeStyle = "#000"
        ctx.lineWidth   = 2
        ctx.lineCap     = "round"
      }
    }
  }, [])

  // Dibujo
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
    ctx?.lineTo(x, y)
    ctx?.stroke()
  }
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.stroke()
    setLastX(x)
    setLastY(y)
  }
  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) setSignature(canvas.toDataURL())
  }
  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setSignature(null)
    }
  }

  // Zoom
  const increaseZoom = () => zoomLevel < 200 && setZoomLevel(z => z + 10)
  const decreaseZoom = () => zoomLevel > 50  && setZoomLevel(z => z - 10)
  const resetZoom    = () => setZoomLevel(100)

  // Mostrar diálogo de confirmación
  const handleSendContract = () => {
    if (!signature) {
      alert("Por favor, firme el contrato antes de enviarlo.")
      return
    }
    setShowConfirmDialog(true)
  }

  // Llamada real al backend
  const confirmSendContract = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    setError(null);
  
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://127.0.0.1:8000/api/prospectos/${studentId}/enviar-contrato`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":  "application/json",
            Accept:          "application/json",       // <-- importante
          },
          body: JSON.stringify({ signature }),
        }
      );
  
      // Si no es 2xx, lee texto y lánzalo como error
      if (!res.ok) {
        const text = await res.text();
        console.error("❌ enviarContrato fallo, body:", text);
        throw new Error(text || res.statusText);
      }
  
      // Aquí ya sabemos que viene JSON válido
      const json = await res.json();
      console.log("✅ enviarContrato respuesta:", json);
      setShowSuccessDialog(true);
  
    } catch (err: any) {
      console.error("❌ confirmSendContract ERROR:", err);
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };
  

  const handleSuccessClose = () => {
    setShowSuccessDialog(false)
    router.push("/firma")
  }

  if (!student) return <div>Cargando datos del prospecto…</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Contrato de Confidencialidad</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={decreaseZoom}><ZoomOut /></Button>
            <span>{zoomLevel}%</span>
            <Button variant="outline" size="icon" onClick={increaseZoom}><ZoomIn /></Button>
            <Button variant="outline" size="icon" onClick={resetZoom}><RotateCw /></Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ... tu contrato estático aquí ... */}
          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Firma del Prospecto</h4>
            <div className="border rounded-lg p-2">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="border rounded cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
              />
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={clearSignature}>
                  Limpiar Firma
                </Button>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSendContract}
            disabled={!signature || loading}
          >
            {loading ? "Enviando..." : "Enviar Contrato"}
          </Button>
          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
        </CardContent>
      </Card>

      {/* Confirmación */}
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
            <AlertDialogAction onClick={confirmSendContract}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Éxito */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center">
            <div className="mb-2">
              <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
            </div>
            <AlertDialogTitle>¡Enviado con éxito!</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center">
            <AlertDialogAction onClick={handleSuccessClose}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
