"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react"
import { API_BASE_URL } from "@/utils/apiConfig"
import Swal from "sweetalert2"

interface Alerta {
  id: number
  id_prospecto: number
  id_asesor: number
  estado: "pendiente" | "completado" | "expirado"
  timer_dias: number
  fecha_creacion: string
  fecha_limite: string
  fecha_finalizacion: string | null
  comentarios: string | null
  dias_restantes: number | null
  prospecto: {
    id: number
    nombre_completo: string
    carnet: string | null
    correo_electronico: string
  }
  asesor: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
}

export default function AlertaAlumnoNuevoPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<"todos" | "pendiente" | "completado" | "expirado">("todos")

  useEffect(() => {
    cargarAlertas()
  }, [filtro])

  const cargarAlertas = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const url = filtro === "todos" 
        ? `${API_BASE_URL}/api/alerta-alumno-nuevo`
        : `${API_BASE_URL}/api/alerta-alumno-nuevo?estado=${filtro}`

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Error al cargar alertas")

      const data = await res.json()
      setAlertas(data.data || [])
    } catch (err) {
      console.error("Error:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las alertas",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCompletar = async (alertaId: number) => {
    const { value: comentarios } = await Swal.fire({
      title: "Completar alerta",
      input: "textarea",
      inputLabel: "Comentarios (opcional)",
      inputPlaceholder: "Ingresa comentarios sobre la finalización...",
      showCancelButton: true,
      confirmButtonText: "Completar",
      cancelButtonText: "Cancelar",
    })

    if (comentarios === undefined) return // Usuario canceló

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/alerta-alumno-nuevo/${alertaId}/completar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comentarios: comentarios || null }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Error al completar")

      await Swal.fire({
        icon: "success",
        title: "¡Completado!",
        text: "La alerta ha sido marcada como completada",
        timer: 2000,
        showConfirmButton: false,
      })

      cargarAlertas()
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo completar la alerta",
      })
    }
  }

  const getEstadoBadge = (estado: string, diasRestantes: number | null) => {
    switch (estado) {
      case "completado":
        return <Badge className="bg-green-500">Completado</Badge>
      case "expirado":
        return <Badge className="bg-red-500">Expirado</Badge>
      case "pendiente":
        if (diasRestantes !== null) {
          if (diasRestantes <= 3) {
            return <Badge className="bg-red-500">Pendiente ({diasRestantes} días)</Badge>
          } else if (diasRestantes <= 5) {
            return <Badge className="bg-yellow-500">Pendiente ({diasRestantes} días)</Badge>
          }
          return <Badge className="bg-blue-500">Pendiente ({diasRestantes} días)</Badge>
        }
        return <Badge className="bg-blue-500">Pendiente</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "completado":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "expirado":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "pendiente":
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const alertasFiltradas = alertas.filter(a => {
    if (filtro === "todos") return true
    return a.estado === filtro
  })

  const estadisticas = {
    total: alertas.length,
    pendientes: alertas.filter(a => a.estado === "pendiente").length,
    completados: alertas.filter(a => a.estado === "completado").length,
    expirados: alertas.filter(a => a.estado === "expirado").length,
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Alerta Alumno Nuevo</h1>
        <Button onClick={cargarAlertas} variant="outline">
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estadisticas.pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.completados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Expirados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estadisticas.expirados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filtro === "todos" ? "default" : "outline"}
          onClick={() => setFiltro("todos")}
        >
          Todos
        </Button>
        <Button
          variant={filtro === "pendiente" ? "default" : "outline"}
          onClick={() => setFiltro("pendiente")}
        >
          Pendientes
        </Button>
        <Button
          variant={filtro === "completado" ? "default" : "outline"}
          onClick={() => setFiltro("completado")}
        >
          Completados
        </Button>
        <Button
          variant={filtro === "expirado" ? "default" : "outline"}
          onClick={() => setFiltro("expirado")}
        >
          Expirados
        </Button>
      </div>

      {/* Lista de alertas */}
      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : alertasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No hay alertas para mostrar
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alertasFiltradas.map((alerta) => (
            <Card key={alerta.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getEstadoIcon(alerta.estado)}
                      <h3 className="text-lg font-semibold">
                        {alerta.prospecto.nombre_completo}
                      </h3>
                      {getEstadoBadge(alerta.estado, alerta.dias_restantes)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-4">
                      <div>
                        <span className="font-medium">Carnet:</span>{" "}
                        {alerta.prospecto.carnet || "Sin carnet"}
                      </div>
                      <div>
                        <span className="font-medium">Correo:</span>{" "}
                        {alerta.prospecto.correo_electronico}
                      </div>
                      <div>
                        <span className="font-medium">Asesor:</span>{" "}
                        {alerta.asesor.first_name} {alerta.asesor.last_name}
                      </div>
                      <div>
                        <span className="font-medium">Fecha límite:</span>{" "}
                        {new Date(alerta.fecha_limite).toLocaleDateString("es-GT")}
                      </div>
                    </div>
                    {alerta.comentarios && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                        <span className="font-medium">Comentarios:</span> {alerta.comentarios}
                      </div>
                    )}
                  </div>
                  {alerta.estado === "pendiente" && (
                    <Button
                      onClick={() => handleCompletar(alerta.id)}
                      className="ml-4"
                      variant="default"
                    >
                      Completar
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

