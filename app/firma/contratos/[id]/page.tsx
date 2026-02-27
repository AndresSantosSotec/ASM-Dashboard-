"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"
import { API_BASE_URL } from '@/utils/apiConfig'

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
  fecha_firma_estudiante: string | null
  datos_contrato: DatosContrato
  firma_asesor: string | null
  firma_asesor_url?: string
  firma_estudiante: string | null
  firma_estudiante_url?: string
  token_firma: string
  resultado: string
}

interface Prospecto {
  id: number
  nombre: string
  email: string
  telefono: string
}

interface Asesor {
  id: number
  nombre: string
  email: string
}

export default function ContratoPreviewPage() {
  const { id } = useParams()
  const router = useRouter()

  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [prospecto, setProspecto] = useState<Prospecto | null>(null)
  const [asesor, setAsesor] = useState<Asesor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarContrato = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/api/contratos/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        if (!data.success) {
          setError(data.message)
          setLoading(false)
          return
        }

        setContrato(data.contrato)
        setProspecto(data.prospecto)
        setAsesor(data.asesor)
        setLoading(false)
      } catch (err: any) {
        setError("Error al cargar el contrato")
        setLoading(false)
      }
    }

    if (id) {
      cargarContrato()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
      </div>
    )
  }

  if (error || !contrato || !prospecto) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-600" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error || "No se pudo cargar el contrato"}</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const datos = contrato.datos_contrato
  const estadoBadge = {
    pendiente: { color: "bg-gray-500", texto: "Pendiente", icon: Clock },
    firmado_asesor: { color: "bg-yellow-500", texto: "Firmado por Asesor", icon: Clock },
    firmado_completo: { color: "bg-green-500", texto: "Firmado Completo", icon: CheckCircle2 },
  }[contrato.estado_firma ?? ""] || { color: "bg-gray-500", texto: "Desconocido", icon: Clock }

  const IconEstado = estadoBadge.icon

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary">
                Vista Previa del Contrato
              </h1>
              <p className="text-gray-600 text-sm">ID: {contrato.id}</p>
            </div>
          </div>
          <Badge className={`${estadoBadge.color} text-white`}>
            <IconEstado className="h-4 w-4 mr-1" />
            {estadoBadge.texto}
          </Badge>
        </div>

        {/* Información General */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Prospecto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{prospecto.nombre}</p>
              <p className="text-sm text-gray-600">{prospecto.email}</p>
              {prospecto.telefono && <p className="text-sm text-gray-600">{prospecto.telefono}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Asesor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{asesor?.nombre || "No disponible"}</p>
              {asesor?.email && <p className="text-sm text-gray-600">{asesor.email}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Fechas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                <span className="font-medium">Enviado:</span>{" "}
                {new Date(contrato.fecha_envio).toLocaleDateString("es-GT")}
              </p>
              {contrato.fecha_firma_estudiante && (
                <p className="text-sm">
                  <span className="font-medium">Firmado:</span>{" "}
                  {new Date(contrato.fecha_firma_estudiante).toLocaleDateString("es-GT")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contrato */}
        <Card>
          <CardHeader>
            <CardTitle>Contrato de Confidencialidad</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Contenido del contrato */}
            <div className="prose prose-sm max-w-none space-y-3 text-sm">
              <p className="font-bold text-center text-base">
                CONTRATO DE CONFIDENCIALIDAD Y COMPROMISO DE ESTUDIANTE
              </p>
              
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

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">Datos económicos:</p>
                <p>Matrícula: Q{datos.matricula}</p>
                <p>Mensualidad: Q{datos.mensualidad}</p>
              </div>

              {datos.convenio_id != null && datos.mensualidad != null && (
                <p className="bg-amber-50 p-3 rounded">
                  Asimismo, acepto que, en caso de divulgar este precio y las
                  condiciones preferenciales relacionadas con la duración del programa,
                  perderé automáticamente dicho beneficio.
                </p>
              )}

              <p className="text-sm text-gray-600 italic">
                [Resto del contenido del contrato...]
              </p>
            </div>

            <Separator />

            {/* Firmas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Firma del Asesor */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  Firma del Asesor
                  {contrato.firma_asesor && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </h4>
                <div className="border rounded-lg p-4 bg-gray-50 min-h-[150px] flex items-center justify-center">
                  {contrato.firma_asesor ? (
                    <div className="text-center">
                      <img
                        src={contrato.firma_asesor_url || contrato.firma_asesor}
                        alt="Firma del asesor"
                        width={300}
                        height={150}
                        className="mx-auto max-h-[150px] w-auto object-contain"
                      />
                      <p className="text-xs text-gray-600 mt-2">{datos.asesor}</p>
                    </div>
                  ) : (
                    <p className="text-gray-400">Sin firma</p>
                  )}
                </div>
              </div>

              {/* Firma del Estudiante */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  Firma del Estudiante
                  {contrato.firma_estudiante && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </h4>
                <div className="border rounded-lg p-4 bg-gray-50 min-h-[150px] flex items-center justify-center">
                  {contrato.firma_estudiante ? (
                    <div className="text-center">
                      <img
                        src={contrato.firma_estudiante_url || contrato.firma_estudiante}
                        alt="Firma del estudiante"
                        width={300}
                        height={150}
                        className="mx-auto max-h-[150px] w-auto object-contain"
                      />
                      <p className="text-xs text-gray-600 mt-2">{prospecto.nombre}</p>
                    </div>
                  ) : (
                    <p className="text-gray-400">Pendiente de firma</p>
                  )}
                </div>
              </div>
            </div>

            {/* Información adicional */}
            {contrato.estado_firma !== 'firmado_completo' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Este contrato aún no ha sido completamente firmado.
                  {contrato.token_firma && (
                    <>
                      {" "}El estudiante puede firmar usando este enlace:{" "}
                      <a
                        href={`/firma-estudiante/${contrato.token_firma}`}
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver enlace de firma
                      </a>
                    </>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
