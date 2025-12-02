"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/utils/apiConfig"
import Swal from "sweetalert2"
import { CheckCircle, Clock, User, Calendar, GraduationCap } from "lucide-react"

interface Alerta {
  id: number
  id_prospecto: number
  id_asesor: number
  estado: string
  fecha_creacion: string
  fecha_limite: string
  dias_restantes: number | null
  asesor: {
    first_name: string
    last_name: string
    email: string
  }
}

interface Prospecto {
  id: number
  nombre_completo: string
  carnet: string | null
  correo_electronico: string
  telefono: string
  status: string
  alerta: Alerta | null
  programas?: Array<{
    programa: {
      nombre: string
      abreviatura: string
    }
    cuota_mensual: number
    inscripcion: number
    duracion_meses: number
  }>
}

export default function AprobacionAlertaAlumnoNuevoPage() {
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarPendientes()
  }, [])

  const cargarPendientes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/alerta-alumno-nuevo/pendientes-aprobacion`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Error al cargar prospectos pendientes")

      const data = await res.json()
      setProspectos(data.data || [])
    } catch (err) {
      console.error("Error:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los prospectos pendientes",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAprobar = async (alerta: Alerta) => {
    const { value: comentarios } = await Swal.fire({
      title: "Aprobar Alerta de Alumno Nuevo",
      html: `
        <p class="mb-4">¿Confirmas que deseas aprobar esta alerta?</p>
        <p class="text-sm text-gray-600">El prospecto pasará al módulo de Generación de Credenciales.</p>
      `,
      input: "textarea",
      inputLabel: "Comentarios (opcional)",
      inputPlaceholder: "Agrega comentarios sobre la aprobación...",
      showCancelButton: true,
      confirmButtonText: "Aprobar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#059669",
    })

    if (comentarios === undefined) return // Usuario canceló

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/alerta-alumno-nuevo/${alerta.id}/aprobar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comentarios: comentarios || null }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Error al aprobar")

      await Swal.fire({
        icon: "success",
        title: "¡Aprobado!",
        text: "La alerta ha sido aprobada. El prospecto puede proceder a generar credenciales.",
        timer: 2000,
        showConfirmButton: false,
      })

      cargarPendientes()
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo aprobar la alerta",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Aprobación de Alerta Alumno Nuevo</h1>
          <p className="text-gray-600 mt-1">
            Prospectos pendientes de aprobación para generar credenciales
          </p>
        </div>
        <Button onClick={cargarPendientes} variant="outline">
          Actualizar
        </Button>
      </div>

      {/* Estadística */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-600">
            Pendientes de Aprobación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{prospectos.length}</div>
        </CardContent>
      </Card>

      {/* Lista de prospectos */}
      {prospectos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            ✅ No hay alertas pendientes de aprobación
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prospectos.map((prospecto) => (
            <Card key={prospecto.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold">{prospecto.nombre_completo}</h3>
                      <Badge className="bg-yellow-500">Pendiente Aprobación</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Datos del Prospecto */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold">Carnet:</span>
                          <span>{prospecto.carnet || "Sin carnet"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold">Correo:</span>
                          <span className="text-gray-600">{prospecto.correo_electronico}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold">Teléfono:</span>
                          <span className="text-gray-600">{prospecto.telefono || "N/A"}</span>
                        </div>
                      </div>

                      {/* Datos del Programa */}
                      {prospecto.programas && prospecto.programas.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <GraduationCap className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold">Programa:</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {prospecto.programas[0].programa.nombre}
                          </div>
                          <div className="text-xs text-gray-500">
                            Duración: {prospecto.programas[0].duracion_meses} meses
                          </div>
                          <div className="text-xs text-gray-500">
                            Inscripción: Q{prospecto.programas[0].inscripcion} | 
                            Mensualidad: Q{prospecto.programas[0].cuota_mensual}
                          </div>
                        </div>
                      )}

                      {/* Datos de la Alerta */}
                      {prospecto.alerta && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold">Alerta:</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Creado por: {prospecto.alerta.asesor.first_name}{" "}
                            {prospecto.alerta.asesor.last_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Fecha: {new Date(prospecto.alerta.fecha_creacion).toLocaleDateString()}
                          </div>
                          {prospecto.alerta.dias_restantes !== null && (
                            <div className={`text-xs font-semibold ${
                              prospecto.alerta.dias_restantes <= 3 
                                ? "text-red-600" 
                                : prospecto.alerta.dias_restantes <= 5 
                                ? "text-yellow-600" 
                                : "text-blue-600"
                            }`}>
                              {prospecto.alerta.dias_restantes} días restantes
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Información adicional */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">
                        ✅ Plan de pagos generado | ✅ Primera boleta creada (Cuota 0)
                      </p>
                    </div>
                  </div>

                  {/* Botón de Aprobación */}
                  {prospecto.alerta && (
                    <Button
                      onClick={() => handleAprobar(prospecto.alerta!)}
                      className="ml-4 bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprobar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
