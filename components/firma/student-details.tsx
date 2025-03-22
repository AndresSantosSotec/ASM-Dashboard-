"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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

const initialStudents: { [key: string]: Student } = {
  "1": {
    id: "1",
    name: "Juan Pérez",
  },
  "2": {
    id: "2",
    name: "María García",
  },
  "3": {
    id: "3",
    name: "Carlos López",
  },
  "4": {
    id: "4",
    name: "Ana Martínez",
  },
}

export function StudentDetails() {
  const params = useParams()
  const router = useRouter()
  const studentId = params?.id as string
  const [student, setStudent] = useState<Student | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100) // 100% is default zoom

  useEffect(() => {
    if (studentId && initialStudents[studentId]) {
      setStudent(initialStudents[studentId])
    }
  }, [studentId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.strokeStyle = "#000"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
      }
    }
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (canvas) {
      setIsDrawing(true)
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setLastX(x)
      setLastY(y)

      // Initialize the path properly
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) {
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
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      if (canvasRef.current) {
        setSignature(canvasRef.current.toDataURL())
      }
    }
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
    // Show confirmation dialog
    setShowConfirmDialog(true)
  }

  const confirmSendContract = () => {
    // Close confirmation dialog
    setShowConfirmDialog(false)

    // Here would be the actual contract sending logic
    console.log("Contrato enviado con firma:", signature)

    // Show success dialog
    setShowSuccessDialog(true)
  }

  const handleSuccessClose = () => {
    setShowSuccessDialog(false)
    // Navigate back to the firma page
    router.push("/firma")
  }

  const increaseZoom = () => {
    if (zoomLevel < 200) {
      // Max zoom 200%
      setZoomLevel((prev) => prev + 10)
    }
  }

  const decreaseZoom = () => {
    if (zoomLevel > 50) {
      // Min zoom 50%
      setZoomLevel((prev) => prev - 10)
    }
  }

  const resetZoom = () => {
    setZoomLevel(100) // Reset to 100%
  }

  if (!student) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contrato de Confidencialidad</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={decreaseZoom} title="Reducir">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{zoomLevel}%</span>
            <Button variant="outline" size="icon" onClick={increaseZoom} title="Ampliar">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={resetZoom} title="Restablecer">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="p-6 border rounded-lg bg-white text-sm space-y-4 overflow-auto max-h-[70vh]"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top left",
              width: `${10000 / zoomLevel}%`, // This ensures content width adjusts with zoom
            }}
          >
            <h2 className="text-center font-bold text-lg mb-4">
              CONTRATO DE CONFIDENCIALIDAD Y COMPROMISO DE ESTUDIANTE
            </h2>
            <p className="text-center text-sm text-muted-foreground">
              (Por favor firme ambas páginas en donde corresponde)
            </p>

            <div className="space-y-4">
              <p>
                En la ciudad de Guatemala, el día: martes, 31 de diciembre de 2024
                <br />
                Yo: {student.name}
                <br />
              </p>

              <p>
                Me comprometo a mantener de manera estrictamente confidencial los precios corporativos otorgados por
                American School of Management para cursar mi programa de:
                <br />
                MPM - Master of Project Management
              </p>

              <p>
                Asimismo, entiendo y acepto que mi participación en el acto de graduación de dicho programa es
                obligatoria e indispensable.
              </p>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/10 rounded-lg">
                <div>Matrícula: Q1,000.00</div>
                <div>Mensualidad: Q1,400.00</div>
              </div>

              <p className="text-sm">
                Asimismo, acepto que, en caso de divulgar este precio y las condiciones preferenciales relacionadas con
                la duración del programa, perderé automáticamente dicho beneficio y deberé asumir el pago de la cuota
                vigente correspondiente al tiempo establecido.
              </p>

              <p className="text-sm">
                Cabe destacar que el porcentaje de beca aplica únicamente si el pago se realiza mediante depósito o
                transferencia bancaria, y no se aplica con otros medios de pago. Si el pago se efectúa por otros medios
                distintos a los mencionados, la cuota se ajustará de la siguiente manera:
              </p>

              <div className="p-2 bg-muted/10 rounded-lg">Mensualidad: Q1,498.00</div>

              <div className="space-y-2">
                <p className="font-medium">Menciones Honoríficas:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Cum Laude: promedio de 96 puntos.</li>
                  <li>Magna Cum Laude: promedio de 97 a 98 puntos.</li>
                  <li>Summa Cum Laude: promedio de 99 a 100 puntos.</li>
                </ul>
              </div>

              <p className="text-sm">
                Con pleno entendimiento y aceptación de las condiciones aquí establecidas, firmo en señal de conformidad
                con este contrato.
              </p>
            </div>
          </div>

          <Separator />

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
                onMouseOut={stopDrawing}
              />
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={clearSignature}>
                  Limpiar Firma
                </Button>
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={handleSendContract} disabled={!signature}>
            Enviar Contrato
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envío de contrato</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea enviar este contrato firmado? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSendContract}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <AlertDialogTitle className="mb-2">¡Contrato enviado con éxito!</AlertDialogTitle>
              <AlertDialogDescription>
                El contrato ha sido firmado y enviado correctamente. Se ha notificado al estudiante.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction onClick={handleSuccessClose}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

