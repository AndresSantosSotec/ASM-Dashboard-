"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Clock, XCircle, ArrowRight, RefreshCw, Loader2 } from "lucide-react"
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

interface ProspectoAprobacion {
  id: number
  prospecto_id: number
  prospecto_nombre: string
  prospecto_correo: string
  prospecto_carnet: string | null
  asesor_nombre: string
  fase_aprobacion: string
  estado_fase: string
  porcentaje_avance: number
  fecha_ingreso: string
  fecha_limite_fase: string | null
  dias_en_fase: number
  dias_restantes: number
  prioridad: string
}

const faseBadgeClass = (fase: string) => {
  if (fase === "Credenciales") return "bg-emerald-100 text-emerald-800"
  if (fase === "Financiera") return "bg-purple-100 text-purple-800"
  if (fase === "Académica" || fase === "Academica") return "bg-blue-100 text-blue-800"
  return "bg-slate-100 text-slate-800"
}

const progressColor = (pct: number) => {
  if (pct >= 75) return "bg-green-500"
  if (pct >= 50) return "bg-blue-500"
  if (pct >= 25) return "bg-yellow-500"
  return "bg-red-500"
}

export default function AlertaAlumnoNuevoPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<"todos" | "pendiente" | "completado" | "expirado">("todos")

  const [pipeline, setPipeline] = useState<ProspectoAprobacion[]>([])
  const [loadingPipeline, setLoadingPipeline] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [filtroFase, setFiltroFase] = useState<string>("todas")
  const [filtroDias, setFiltroDias] = useState<number>(0)

  const [activeTab, setActiveTab] = useState("alertas")

  useEffect(() => {
    cargarAlertas()
  }, [filtro])

  useEffect(() => {
    if (activeTab === "pipeline") cargarPipeline()
  }, [activeTab])

  const cargarPipeline = async () => {
    setLoadingPipeline(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/dashboard/prospectos-aprobacion`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Error al cargar pipeline")
      const data = await res.json()
      setPipeline(data.prospectos_aprobacion || [])
    } catch (err) {
      console.error("Error:", err)
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la lista de prospectos en aprobación" })
    } finally {
      setLoadingPipeline(false)
    }
  }

  const handleEnviarACredenciales = async (prospectoId: number, nombre: string) => {
    const { value: comentarios } = await Swal.fire({
      title: "Enviar a Generación de Credenciales",
      html: `<p class="mb-3">¿Confirmas el avance de <strong>${nombre}</strong> directamente a <strong>Generación de Credenciales</strong>?</p><p class="text-sm text-gray-500">Esta acción omitirá las aprobaciones pendientes.</p>`,
      input: "textarea",
      inputLabel: "Comentarios (opcional)",
      inputPlaceholder: "Describe el motivo para dar salida a este prospecto...",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#059669",
    })
    if (comentarios === undefined) return

    setProcessingId(prospectoId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(
        `${API_BASE_URL}/api/alerta-alumno-nuevo/prospecto/${prospectoId}/enviar-a-credenciales`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ comentarios: comentarios || null }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Error al procesar")
      await Swal.fire({
        icon: "success",
        title: "¡Listo!",
        text: `${nombre} fue enviado a Generación de Credenciales`,
        timer: 2500,
        showConfirmButton: false,
      })
      cargarPipeline()
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudo completar la acción" })
    } finally {
      setProcessingId(null)
    }
  }

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

  const pipelineFiltrado = pipeline.filter((p) => {
    const pasaFase = filtroFase === "todas" || p.fase_aprobacion === filtroFase
    const pasaDias = filtroDias === 0 || p.dias_en_fase >= filtroDias
    return pasaFase && pasaDias
  })

  const fases = ["todas", ...Array.from(new Set(pipeline.map((p) => p.fase_aprobacion)))]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Alerta Alumno Nuevo</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="alertas">
            Mis Alertas
            {estadisticas.pendientes > 0 && (
              <Badge className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0">
                {estadisticas.pendientes}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pipeline">
            Prospectos en Aprobación
            {pipeline.length > 0 && (
              <Badge className="ml-2 bg-purple-500 text-white text-xs px-1.5 py-0">
                {pipeline.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ══════ Tab 1: Mis Alertas ══════ */}
        <TabsContent value="alertas" className="space-y-4 mt-4">
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
          <div className="flex gap-2 flex-wrap">
            <Button variant={filtro === "todos" ? "default" : "outline"} onClick={() => setFiltro("todos")}>Todos</Button>
            <Button variant={filtro === "pendiente" ? "default" : "outline"} onClick={() => setFiltro("pendiente")}>Pendientes</Button>
            <Button variant={filtro === "completado" ? "default" : "outline"} onClick={() => setFiltro("completado")}>Completados</Button>
            <Button variant={filtro === "expirado" ? "default" : "outline"} onClick={() => setFiltro("expirado")}>Expirados</Button>
            <Button variant="outline" onClick={cargarAlertas}><RefreshCw className="h-3 w-3 mr-1" />Actualizar</Button>
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
                          <h3 className="text-lg font-semibold">{alerta.prospecto.nombre_completo}</h3>
                          {getEstadoBadge(alerta.estado, alerta.dias_restantes)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-4">
                          <div><span className="font-medium">Carnet:</span> {alerta.prospecto.carnet || "Sin carnet"}</div>
                          <div><span className="font-medium">Correo:</span> {alerta.prospecto.correo_electronico}</div>
                          <div><span className="font-medium">Asesor:</span> {alerta.asesor.first_name} {alerta.asesor.last_name}</div>
                          <div><span className="font-medium">Fecha límite:</span> {new Date(alerta.fecha_limite).toLocaleDateString("es-GT")}</div>
                        </div>
                        {alerta.comentarios && (
                          <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                            <span className="font-medium">Comentarios:</span> {alerta.comentarios}
                          </div>
                        )}
                      </div>
                      {alerta.estado === "pendiente" && (
                        <Button onClick={() => handleCompletar(alerta.id)} className="ml-4" variant="default">
                          Completar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══════ Tab 2: Prospectos en Aprobación ══════ */}
        <TabsContent value="pipeline" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Prospectos atascados en aprobación</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Prospectos pendientes en el pipeline Comercial → Académica → Financiera → Credenciales.
                    Puedes darles salida enviándolos directamente a Generación de Credenciales.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={cargarPipeline} disabled={loadingPipeline}>
                  {loadingPipeline ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                  Actualizar
                </Button>
              </div>

              {/* Filtros del pipeline */}
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Fase:</span>
                  {fases.map((f) => (
                    <Button key={f} size="sm" variant={filtroFase === f ? "default" : "outline"} onClick={() => setFiltroFase(f)} className="h-7 text-xs px-2">
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm text-muted-foreground">Mín. días:</span>
                  {[0, 3, 5, 7, 10].map((d) => (
                    <Button key={d} size="sm" variant={filtroDias === d ? "default" : "outline"} onClick={() => setFiltroDias(d)} className="h-7 text-xs px-2">
                      {d === 0 ? "Todos" : `+${d}d`}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingPipeline ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Cargando prospectos...</span>
                </div>
              ) : pipelineFiltrado.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">
                    {pipeline.length === 0
                      ? "No hay prospectos en proceso de aprobación"
                      : "Ningún prospecto coincide con los filtros aplicados"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40">
                      <tr>
                        <th className="text-left p-3 font-semibold">Prospecto</th>
                        <th className="text-left p-3 font-semibold">Carnet</th>
                        <th className="text-left p-3 font-semibold">Asesor</th>
                        <th className="text-left p-3 font-semibold">Fase Actual</th>
                        <th className="text-left p-3 font-semibold">Progreso</th>
                        <th className="text-center p-3 font-semibold">Días en Fase</th>
                        <th className="text-center p-3 font-semibold">Fecha Límite</th>
                        <th className="text-center p-3 font-semibold">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pipelineFiltrado.map((item) => {
                        const pct = item.porcentaje_avance ?? 0
                        const isProcessing = processingId === item.prospecto_id
                        return (
                          <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <div className="font-medium">{item.prospecto_nombre}</div>
                              <div className="text-xs text-muted-foreground">{item.prospecto_correo}</div>
                            </td>
                            <td className="p-3">
                              {item.prospecto_carnet ? (
                                <Badge variant="outline" className="font-mono">{item.prospecto_carnet}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">Sin carnet</span>
                              )}
                            </td>
                            <td className="p-3 text-sm">{item.asesor_nombre}</td>
                            <td className="p-3">
                              <Badge variant="secondary" className={faseBadgeClass(item.fase_aprobacion)}>
                                {item.fase_aprobacion}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${progressColor(pct)}`}
                                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">{pct}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className={item.dias_en_fase >= 7 ? "font-semibold text-red-600" : item.dias_en_fase >= 4 ? "font-semibold text-amber-600" : ""}>
                                {item.dias_en_fase} día{item.dias_en_fase !== 1 ? "s" : ""}
                              </span>
                            </td>
                            <td className="p-3 text-center text-xs text-muted-foreground">
                              {item.fecha_limite_fase
                                ? new Date(item.fecha_limite_fase).toLocaleDateString("es-GT")
                                : "Sin límite"}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                disabled={isProcessing}
                                onClick={() => handleEnviarACredenciales(item.prospecto_id, item.prospecto_nombre)}
                              >
                                {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                                {isProcessing ? "..." : "Credenciales"}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {pipelineFiltrado.length > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                  Mostrando {pipelineFiltrado.length} de {pipeline.length} prospectos en aprobación
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

