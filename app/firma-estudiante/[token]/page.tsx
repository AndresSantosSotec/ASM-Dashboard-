"use client"

import React, { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"
import Swal from 'sweetalert2'
import { API_BASE_URL } from '@/utils/apiConfig'
import Image from "next/image"

interface DatosContrato {
  prospecto: string
  email: string
  programa: string
  programa_abreviatura: string
  matricula: string
  mensualidad: string | null
  convenio_id: number | null
  asesor: string
  fecha: string
}

interface Contrato {
  id: number
  prospecto_id: number
  estado_firma: string
  fecha_envio: string
  datos_contrato: DatosContrato
  firma_asesor: string
  firma_asesor_url?: string
}

export default function FirmaEstudiantePage() {
  const { token } = useParams()
  const router = useRouter()

  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [prospecto, setProspecto] = useState<any>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [yaFirmado, setYaFirmado] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)

  // Cargar contrato por token
  useEffect(() => {
    if (!token) return

    const cargarContrato = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/contratos/token/${token}`)
        const data = await res.json()

        if (!data.success) {
          if (data.firmado) {
            setYaFirmado(true)
          }
          setError(data.message)
          setLoading(false)
          return
        }

        setContrato(data.contrato)
        setProspecto(data.prospecto)
        setLoading(false)
      } catch (err: any) {
        setError("Error al cargar el contrato")
        setLoading(false)
      }
    }

    cargarContrato()
  }, [token])

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
  }, [])

  // Handlers de dibujo
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

  // Enviar firma del estudiante
  const handleFirmarContrato = async () => {
    if (!signature) {
      Swal.fire({
        icon: 'warning',
        title: 'Firma requerida',
        text: 'Por favor, firme el contrato antes de continuar',
      })
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/contratos/firma-estudiante`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          firma_estudiante: signature,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.message)
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Contrato firmado!',
        text: 'Su firma ha sido registrada exitosamente',
        confirmButtonText: 'Aceptar',
      })

      setYaFirmado(true)

    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo guardar la firma',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Estados de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
      </div>
    )
  }

  if (error || yaFirmado) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {yaFirmado ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Contrato ya firmado
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  Error
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {yaFirmado
                ? "Este contrato ya ha sido firmado anteriormente."
                : error || "No se pudo cargar el contrato"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!contrato || !prospecto) return null

  const datos = contrato.datos_contrato

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Firma de Contrato
          </h1>
          <p className="text-gray-600">
            Por favor revise y firme el contrato de confidencialidad
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contrato de Confidencialidad y Compromiso</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Datos del estudiante */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-semibold text-lg">{prospecto.nombre}</p>
              <p className="text-sm text-gray-600">{datos.email}</p>
            </div>

            {/* Contenido del contrato */}
            <div className="prose prose-sm max-w-none space-y-3 text-sm">
              <p className="font-bold text-center text-base">
                CONTRATO DE CONFIDENCIALIDAD Y COMPROMISO DE ESTUDIANTE
              </p>
              <p className="text-center italic">(Por favor firme en donde corresponde)</p>
              
              <p>En la ciudad de Guatemala, el día: <strong>{datos.fecha}</strong></p>
              
              <p>
                Yo: <strong>{prospecto.nombre}</strong> {datos.email && <span>({datos.email})</span>}
              </p>

              <p>
                Me comprometo a mantener de manera estrictamente confidencial los
                precios corporativos otorgados por American School of Management para
                cursar mi programa de:
              </p>

              <p className="text-center font-bold text-base">
                {datos.programa} ({datos.programa_abreviatura})
              </p>

              <p>
                Asimismo, entiendo y acepto que mi participación en el acto de
                graduación de dicho programa es obligatoria e indispensable.
              </p>

              <div className="bg-gray-50 p-3 rounded">
                <p className="font-semibold">Datos económicos:</p>
                <p>Matrícula: Q{datos.matricula}</p>
                <p>Mensualidad: Q{datos.mensualidad}</p>
              </div>

              {datos.convenio_id != null && datos.mensualidad != null && (
                <p className="bg-amber-50 p-3 rounded">
                  Asimismo, acepto que, en caso de divulgar este precio y las
                  condiciones preferenciales relacionadas con la duración del programa,
                  perderé automáticamente dicho beneficio y deberé asumir el pago de la
                  cuota vigente correspondiente al tiempo establecido.
                </p>
              )}

              <p>
                Deseo que el cobro de mi mensualidad sea de manera automática: (El
                cobro se realizará los primeros días de cada mes).<br />
                Sí: ________
              </p>

              <p>
                Confirmo que he recibido toda la información necesaria sobre los
                requisitos académicos y administrativos para mi programa.
              </p>

              <p>
                Declaro que estoy plenamente informado(a) y de acuerdo con que mi día
                de estudio puede ser modificado durante el transcurso de la carrera.
              </p>

              <p>
                Asimismo, confirmo que estoy consciente de que, debido a la modalidad
                de estudio de mi programa, es indispensable tomar mis clases a través
                de una computadora con conexión a internet estable.
              </p>

              <p>
                Finalmente, autorizo a American School of Management a utilizar mis
                fotografías para fines de colaboración institucional.
              </p>

              <p>
                Reitero mi compromiso de no duplicar ni compartir materiales
                provenientes de la plataforma para fines distintos a la realización
                de los cursos.
              </p>

              <p>
                Con pleno entendimiento y aceptación de las condiciones aquí
                establecidas, firmo en señal de conformidad con este contrato.
              </p>
            </div>

            <Separator />

            {/* Firma del Asesor (ya guardada) */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Firma del Asesor Educativo</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                <Image
                  src={contrato.firma_asesor_url || contrato.firma_asesor}
                  alt="Firma del asesor"
                  width={400}
                  height={200}
                  className="mx-auto"
                />
                <p className="text-center text-sm text-gray-600 mt-2">
                  {datos.asesor}
                </p>
              </div>
            </div>

            <Separator />

            {/* Canvas para firma del estudiante */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Su Firma (Estudiante)</h4>
              <div className="border rounded-lg p-2">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={200}
                  className="border rounded cursor-crosshair bg-white w-full"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                />
                <div className="mt-2 flex justify-between">
                  <Button variant="outline" size="sm" onClick={clearSignature}>
                    Limpiar Firma
                  </Button>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleFirmarContrato}
              disabled={!signature || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Enviando firma...
                </>
              ) : (
                "Firmar y Completar Contrato"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>American School of Management</p>
          <p>Contrato generado el {new Date(contrato.fecha_envio).toLocaleDateString('es-GT')}</p>
        </div>
      </div>
    </div>
  )
}
