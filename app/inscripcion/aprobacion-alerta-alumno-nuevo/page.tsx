"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/utils/apiConfig"
import Swal from "sweetalert2"
import { CheckCircle, Clock, User, Calendar, GraduationCap, Eye, XCircle, ArrowLeft, Loader2, AlertCircle, FileText, ArrowRight, RefreshCw } from "lucide-react"
import { ServerFilePreviewModal } from "@/components/ui/server-file-preview-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  /** Si tiene comprobante de inscripción subido */
  tiene_boleta_inscripcion?: boolean
  /** Recibo American, DPI, recibo de luz y boleta de pago completos */
  documentos_completos?: boolean
  /** Nombre del asesor asignado (creator/updater) cuando la alerta no trae asesor */
  asesor_asignado_nombre?: string | null
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

export default function AprobacionAlertaAlumnoNuevoPage() {
  const router = useRouter()
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todas")
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null)
  const [isModalOpen, setModalOpen] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)

  // Pipeline de aprobación (otros estados)
  const [pipeline, setPipeline] = useState<ProspectoAprobacion[]>([])
  const [loadingPipeline, setLoadingPipeline] = useState(false)
  const [processingPipelineId, setProcessingPipelineId] = useState<number | null>(null)
  const [filtroFase, setFiltroFase] = useState<string>("todas")
  const [filtroDiasPipeline, setFiltroDiasPipeline] = useState<number>(0)
  const [activeTab, setActiveTab] = useState("alertas")

  // Estado para documentos del prospecto
  const [documentosProspecto, setDocumentosProspecto] = useState<any[]>([])
  const [boletaInscripcion, setBoletaInscripcion] = useState<any>(null)
  const [loadingBoleta, setLoadingBoleta] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [documentoToPreview, setDocumentoToPreview] = useState<any | null>(null)
  const [descargandoContrato, setDescargandoContrato] = useState(false)

  useEffect(() => {
    cargarPendientes()
  }, [])

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

  const handleEnviarACredencialesDesdeOtroEstado = async (prospectoId: number, nombre: string) => {
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

    setProcessingPipelineId(prospectoId)
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
      setProcessingPipelineId(null)
    }
  }

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

      // Filtrar prospectos válidos y con estructura correcta
      const prospectosValidos = (data.data || []).filter((p: any) => {
        // Validación nivel 1: Datos básicos
        if (!p || typeof p !== 'object') {
          console.error("❌ Elemento no es un objeto:", p)
          return false
        }

        if (!p.id || !p.nombre_completo) {
          console.error("❌ Prospecto sin ID o nombre:", p)
          return false
        }

        // Validación nivel 2: Estructura de alerta
        if (p.alerta) {
          if (typeof p.alerta !== 'object') {
            console.error("❌ Alerta no es objeto:", p.alerta)
            p.alerta = null
          } else if (!p.alerta.asesor || typeof p.alerta.asesor !== 'object') {
            console.warn("⚠️ Alerta sin asesor válido:", p.alerta)
            p.alerta.asesor = { first_name: 'N/A', last_name: '', email: '' }
          }
        }

        // Validación nivel 3: Estructura de programas (CRÍTICO)
        if (p.programas && Array.isArray(p.programas)) {
          p.programas = p.programas.filter((prog: any) => {
            if (!prog || typeof prog !== 'object') {
              console.error("❌ Programa no es objeto:", prog)
              return false
            }

            // VALIDACIÓN CRÍTICA: programa debe existir y ser objeto
            if (!prog.programa || typeof prog.programa !== 'object') {
              console.error("❌ CRÍTICO: programa.programa no existe o no es objeto:", prog)
              console.error("   Prospecto ID:", p.id, "Nombre:", p.nombre_completo)
              console.error("   Estructura recibida:", JSON.stringify(prog, null, 2))
              return false
            }

            // Validar que tenga al menos nombre o abreviatura
            if (!prog.programa.nombre && !prog.programa.abreviatura) {
              console.warn("⚠️ Programa sin nombre ni abreviatura:", prog.programa)
              prog.programa.nombre = 'Programa sin nombre'
            }

            return true
          })

          // Si no quedó ningún programa válido, advertir
          if (p.programas.length === 0) {
            console.warn("⚠️ Prospecto sin programas válidos:", p.id, p.nombre_completo)
          }
        } else if (p.programas) {
          console.error("❌ programas no es array:", p.programas)
          p.programas = []
        }

        return true
      })

      setProspectos(prospectosValidos)

      if (prospectosValidos.length !== (data.data || []).length) {
        console.warn(`Se filtraron ${(data.data || []).length - prospectosValidos.length} prospectos inválidos`)
      }
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

  const handleViewDetalle = async (prospecto: Prospecto) => {
    setSelectedProspecto(prospecto)
    setModalOpen(true)
    setBoletaInscripcion(null)
    setDocumentosProspecto([])
    setLoadingBoleta(true)

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/documentos/prospecto/${prospecto.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const documentos = await res.json()
        setDocumentosProspecto(Array.isArray(documentos) ? documentos : [])
        const boleta = documentos.find((doc: any) =>
          doc.tipo_documento === "inscripcion" || doc.tipo_documento === "inscripción"
        )
        if (boleta) {
          setBoletaInscripcion(boleta)
        }
      }
    } catch (err) {
      console.error("Error al cargar documentos del prospecto:", err)
    } finally {
      setLoadingBoleta(false)
    }
  }

  const getDocByTipo = (tipo: string) => {
    return documentosProspecto.find((d: any) =>
      d.tipo_documento === tipo || (tipo === "inscripcion" && d.tipo_documento === "inscripción")
    )
  }

  const openPreview = (doc: any) => {
    setDocumentoToPreview(doc)
    setPreviewModalOpen(true)
  }

  const handleDescargarContrato = async (prospectoId: number) => {
    setDescargandoContrato(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/prospectos/${prospectoId}/contrato-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "No se pudo generar el contrato")
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Contrato_${selectedProspecto?.nombre_completo?.replace(/\s+/g, "_") || prospectoId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      Swal.fire({ icon: "success", title: "Contrato descargado", timer: 2000, showConfirmButton: false })
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudo descargar el contrato" })
    } finally {
      setDescargandoContrato(false)
    }
  }

  const handleAprobar = async (alerta: Alerta, prospectoId: number) => {
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

    setProcessingId(prospectoId)
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
    } finally {
      setProcessingId(null)
    }
  }

  /** Aprobar prospecto sin alerta activa: mismo flujo y modal que con alerta, solo otro endpoint */
  const handleAprobarProspecto = async (prospectoId: number) => {
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

    if (comentarios === undefined) return

    setProcessingId(prospectoId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/alerta-alumno-nuevo/prospecto/${prospectoId}/aprobar`, {
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
      setModalOpen(false)
      cargarPendientes()
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo aprobar la alerta",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleSolicitarCorreccion = async (alerta: Alerta, prospectoId: number) => {
    const { value: comentario } = await Swal.fire({
      title: "Rechazar Alerta de Alumno Nuevo",
      html: `
        <p class="mb-4">¿Confirmas que deseas rechazar esta alerta?</p>
        <p class="text-sm text-gray-600 mb-4">El prospecto será regresado a estado "En Seguimiento" y la alerta será anulada.</p>
      `,
      input: "textarea",
      inputLabel: "Motivo del rechazo (obligatorio)",
      inputPlaceholder: "Describe el motivo del rechazo y las correcciones necesarias...",
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "Debes ingresar un motivo para rechazar la alerta"
        }
        if (value.trim().length < 10) {
          return "El motivo debe tener al menos 10 caracteres"
        }
      },
      showCancelButton: true,
      confirmButtonText: "Rechazar Alerta",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    })

    if (!comentario) return

    setProcessingId(prospectoId)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const res = await fetch(`${API_BASE_URL}/api/alerta-alumno-nuevo/${alerta.id}/rechazar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comentarios: comentario.trim() }),
      })

      const data = await res.json().catch(() => ({ message: "Error al procesar respuesta del servidor" }))

      if (!res.ok) {
        const errorMessage = data.message || data.error || "Error al rechazar la alerta"
        console.error("Error rechazando alerta:", data)
        throw new Error(errorMessage)
      }

      await Swal.fire({
        icon: "success",
        title: "Alerta rechazada",
        html: `
          <p>La alerta ha sido rechazada correctamente.</p>
          <p class="text-sm text-gray-600 mt-2">El prospecto ha sido regresado a estado "En Seguimiento" y la alerta ha sido anulada.</p>
        `,
        timer: 3000,
        showConfirmButton: false,
      })

      cargarPendientes()
    } catch (err: any) {
      console.error("Error rechazando alerta:", err)
      Swal.fire({
        icon: "error",
        title: "Error al rechazar alerta",
        text: err.message || "No se pudo rechazar la alerta. Intenta nuevamente.",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleRetroceder = async (prospectoId: number, estadoDestino: string) => {
    const { value: comentario } = await Swal.fire({
      title: `Retroceder a: ${estadoDestino}`,
      input: "textarea",
      inputLabel: "Motivo del retroceso (obligatorio)",
      inputPlaceholder: "Explica por qué retrocedes esta ficha...",
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "Debes ingresar un motivo"
        }
      },
      showCancelButton: true,
      confirmButtonText: "Retroceder",
      cancelButtonText: "Cancelar",
    })

    if (!comentario) return

    setProcessingId(prospectoId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/prospectos/${prospectoId}/retroceder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estado_destino: estadoDestino,
          comentario
        }),
      })
      if (!res.ok) throw new Error("Error al retroceder")

      Swal.fire({
        icon: "info",
        title: "Ficha retrocedida",
        text: `Estado cambiado a: ${estadoDestino}`,
        timer: 2000,
        showConfirmButton: false
      })

      cargarPendientes()
    } catch (err) {
      console.error("Error:", err)
      Swal.fire("Error", "No se pudo retroceder la ficha", "error")
    } finally {
      setProcessingId(null)
    }
  }

  const filteredProspectos = prospectos.filter(p => {
    // Validar que el prospecto tenga los datos mínimos necesarios
    if (!p || !p.id || !p.nombre_completo) return false

    const term = searchTerm.toLowerCase()
    const matchSearch =
      p.nombre_completo.toLowerCase().includes(term) ||
      p.correo_electronico?.toLowerCase().includes(term) ||
      p.id.toString().includes(term) ||
      (p.carnet && p.carnet.toLowerCase().includes(term))

    // Por ahora todos tienen prioridad media, pero preparado para futuro
    const matchPrioridad = filtroPrioridad === "todas" || filtroPrioridad === "media"

    return matchSearch && matchPrioridad
  })

  const getBadgeForDiasRestantes = (dias: number | null) => {
    if (dias === null) return null
    if (dias <= 3) return <Badge className="bg-red-100 text-red-800">Urgente - {dias} días</Badge>
    if (dias <= 5) return <Badge className="bg-yellow-100 text-yellow-800">{dias} días</Badge>
    return <Badge className="bg-blue-100 text-blue-800">{dias} días</Badge>
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Cargando...</div>
      </div>
    )
  }

  const pipelineFiltrado = pipeline.filter((p) => {
    const pasaFase = filtroFase === "todas" || p.fase_aprobacion === filtroFase
    const pasaDias = filtroDiasPipeline === 0 || p.dias_en_fase >= filtroDiasPipeline
    return pasaFase && pasaDias
  })

  const fasesPipeline = ["todas", ...Array.from(new Set(pipeline.map((p) => p.fase_aprobacion)))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Alerta Alumno Nuevo</h1>
              <p className="text-blue-100 text-sm mt-1">
                Vista de aprobación para prospectos en proceso de generación de credenciales
              </p>
            </div>
          </div>
          <Badge className="bg-white text-blue-700 font-semibold px-3 py-1">
            Módulo de Aprobación
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="alertas">
            Alerta Alumno Nuevo
            {filteredProspectos.length > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-white text-xs px-1.5 py-0">
                {filteredProspectos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pipeline">
            Pendientes en Pipeline
            {pipeline.length > 0 && (
              <Badge className="ml-2 bg-purple-500 text-white text-xs px-1.5 py-0">
                {pipeline.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ══════ Tab 1: Alerta Alumno Nuevo ══════ */}
        <TabsContent value="alertas" className="space-y-4 mt-4">

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <Label>Buscar</Label>
          <Input
            placeholder="Nombre, correo, carnet o ID"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label>Prioridad</Label>
          <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Card principal */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Aprobación Alerta Alumno Nuevo</CardTitle>
            <Badge className="bg-yellow-100 text-yellow-800">
              <Calendar className="mr-1 h-3 w-3" /> {filteredProspectos.length} Pendientes
            </Badge>
          </div>
          <CardDescription>
            Prospectos con plan de pagos generado, listos para aprobación y generación de credenciales
          </CardDescription>
        </CardHeader>

        <CardContent>
          {filteredProspectos.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              ✅ No hay alertas pendientes de aprobación
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Carnet</TableHead>
                  <TableHead>Programa</TableHead>
                  <TableHead>Asesor</TableHead>
                  <TableHead>Tiempo Restante</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProspectos.filter(p => p && p.id).map((prospecto) => (
                  <TableRow key={prospecto.id}>
                    <TableCell>{prospecto.id}</TableCell>
                    <TableCell>{prospecto.nombre_completo}</TableCell>
                    <TableCell>{prospecto.carnet || "Sin carnet"}</TableCell>
                    <TableCell>
                      {(() => {
                        const progs = prospecto.programas
                          ?.filter((p: any) => p?.programa && typeof p.programa === "object")
                          .map((p: any) => p.programa.nombre || p.programa.abreviatura || "Sin nombre")
                        if (!progs?.length) return "N/A"
                        return progs.join(", ")
                      })()}
                    </TableCell>
                    <TableCell>
                      {prospecto.alerta?.asesor
                        ? `${prospecto.alerta.asesor.first_name} ${prospecto.alerta.asesor.last_name}`.trim() || prospecto.alerta.asesor.email
                        : prospecto.asesor_asignado_nombre || "N/A"}
                    </TableCell>
                    <TableCell>
                      {prospecto.documentos_completos ? (
                        <Badge className="bg-green-100 text-green-800">DOC COMPLETADOS</Badge>
                      ) : (
                        prospecto.alerta && getBadgeForDiasRestantes(prospecto.alerta.dias_restantes)
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetalle(prospecto)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalle completo</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  prospecto.alerta
                                    ? handleAprobar(prospecto.alerta, prospecto.id)
                                    : handleAprobarProspecto(prospecto.id)
                                }
                                disabled={processingId === prospecto.id}
                              >
                                {processingId === prospecto.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Aprobar y enviar a credenciales</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => prospecto.alerta && handleSolicitarCorreccion(prospecto.alerta, prospecto.id)}
                                disabled={processingId === prospecto.id || !prospecto.alerta}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rechazar alerta</TooltipContent>
                          </Tooltip>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={processingId === prospecto.id}
                              >
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => handleRetroceder(prospecto.id, "Pendiente de Aprobación Financiera")}
                              >
                                Retroceder a Aprobación Financiera
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRetroceder(prospecto.id, "Pendiente de Aprobación Académica")}
                              >
                                Retroceder a Aprobación Académica
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRetroceder(prospecto.id, "Pendiente de Aprobación")}
                              >
                                Retroceder a Pendiente de Aprobación
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredProspectos.length} de {prospectos.length} alertas
          </div>
          <Button onClick={cargarPendientes} variant="outline" size="sm">
            Actualizar
          </Button>
        </CardFooter>
      </Card>

        </TabsContent>

        {/* ══════ Tab 2: Pipeline de Aprobación ══════ */}
        <TabsContent value="pipeline" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Prospectos atascados en aprobación</CardTitle>
                  <CardDescription>
                    Prospectos pendientes en el pipeline Comercial → Académica → Financiera → Credenciales.
                    Puedes enviarlos directamente a Generación de Credenciales.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={cargarPipeline} disabled={loadingPipeline}>
                  {loadingPipeline ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                  Actualizar
                </Button>
              </div>
              {/* Filtros */}
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Fase:</span>
                  {fasesPipeline.map((f) => (
                    <Button key={f} size="sm" variant={filtroFase === f ? "default" : "outline"} onClick={() => setFiltroFase(f)} className="h-7 text-xs px-2">
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm text-muted-foreground">Mín. días:</span>
                  {[0, 3, 5, 7, 10].map((d) => (
                    <Button key={d} size="sm" variant={filtroDiasPipeline === d ? "default" : "outline"} onClick={() => setFiltroDiasPipeline(d)} className="h-7 text-xs px-2">
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prospecto</TableHead>
                        <TableHead>Carnet</TableHead>
                        <TableHead>Asesor</TableHead>
                        <TableHead>Fase Actual</TableHead>
                        <TableHead>Progreso</TableHead>
                        <TableHead className="text-center">Días en Fase</TableHead>
                        <TableHead className="text-center">Fecha Límite</TableHead>
                        <TableHead className="text-center">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pipelineFiltrado.map((item) => {
                        const pct = item.porcentaje_avance ?? 0
                        const isProcessing = processingPipelineId === item.prospecto_id
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="font-medium">{item.prospecto_nombre}</div>
                              <div className="text-xs text-muted-foreground">{item.prospecto_correo}</div>
                            </TableCell>
                            <TableCell>
                              {item.prospecto_carnet ? (
                                <Badge variant="outline" className="font-mono">{item.prospecto_carnet}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">Sin carnet</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{item.asesor_nombre}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={faseBadgeClass(item.fase_aprobacion)}>
                                {item.fase_aprobacion}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${progressColor(pct)}`}
                                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">{pct}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={item.dias_en_fase >= 7 ? "font-semibold text-red-600" : item.dias_en_fase >= 4 ? "font-semibold text-amber-600" : ""}>
                                {item.dias_en_fase} día{item.dias_en_fase !== 1 ? "s" : ""}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground">
                              {item.fecha_limite_fase
                                ? new Date(item.fecha_limite_fase).toLocaleDateString("es-GT")
                                : "Sin límite"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                disabled={isProcessing}
                                onClick={() => handleEnviarACredencialesDesdeOtroEstado(item.prospecto_id, item.prospecto_nombre)}
                              >
                                {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                                {isProcessing ? "..." : "Credenciales"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
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

      {/* Modal de detalle - Simple por ahora */}
      {selectedProspecto && isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>Detalle del Prospecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="detalle" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="detalle">Detalle</TabsTrigger>
                  <TabsTrigger value="documentos">Vista previa de documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="detalle" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre Completo</Label>
                  <p className="text-sm">{selectedProspecto.nombre_completo}</p>
                </div>
                <div>
                  <Label>Carnet</Label>
                  <p className="text-sm">{selectedProspecto.carnet || "Sin carnet"}</p>
                </div>
                <div>
                  <Label>Correo</Label>
                  <p className="text-sm">{selectedProspecto.correo_electronico}</p>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <p className="text-sm">{selectedProspecto.telefono || "N/A"}</p>
                </div>
              </div>

              {selectedProspecto.programas && selectedProspecto.programas.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">
                    Información del Programa{selectedProspecto.programas.length > 1 ? "s" : ""}
                  </h3>
                  <div className="space-y-4">
                    {selectedProspecto.programas.map((prog: any, idx: number) =>
                      prog?.programa ? (
                        <div key={prog.id ?? idx} className="rounded-lg border bg-slate-50/50 p-3">
                          {selectedProspecto.programas.length > 1 && (
                            <p className="text-xs font-medium text-slate-500 mb-2">
                              Programa {idx + 1}
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Programa</Label>
                              <p className="text-sm font-medium">
                                {prog.programa.nombre || prog.programa.abreviatura || "Sin nombre"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs">Duración</Label>
                              <p className="text-sm">{prog.duracion_meses ?? prog.programa?.meses ?? "—"} meses</p>
                            </div>
                            <div>
                              <Label className="text-xs">Inscripción</Label>
                              <p className="text-sm">Q{prog.inscripcion ?? "—"}</p>
                            </div>
                            <div>
                              <Label className="text-xs">Cuota Mensual</Label>
                              <p className="text-sm">Q{prog.cuota_mensual ?? "—"}</p>
                            </div>
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Información de la Alerta</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Asesor / Creado por</Label>
                    <p className="text-sm">
                      {selectedProspecto.alerta?.asesor
                        ? `${selectedProspecto.alerta.asesor.first_name} ${selectedProspecto.alerta.asesor.last_name}`.trim() || selectedProspecto.alerta.asesor.email
                        : selectedProspecto.asesor_asignado_nombre || "N/A"}
                    </p>
                  </div>
                  {selectedProspecto.alerta && (
                    <>
                      <div>
                        <Label>Fecha de Creación</Label>
                        <p className="text-sm">
                          {selectedProspecto.alerta?.fecha_creacion
                            ? new Date(selectedProspecto.alerta.fecha_creacion).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label>Fecha Límite</Label>
                        <p className="text-sm">
                          {selectedProspecto.alerta?.fecha_limite
                            ? new Date(selectedProspecto.alerta.fecha_limite).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </>
                  )}
                  <div>
                    <Label>Tiempo Restante</Label>
                    <p className="text-sm font-semibold">
                      {selectedProspecto.documentos_completos ? (
                        <Badge className="bg-green-100 text-green-800">DOC COMPLETADOS</Badge>
                      ) : selectedProspecto.alerta?.dias_restantes != null && typeof selectedProspecto.alerta.dias_restantes === "number" ? (
                        `${selectedProspecto.alerta.dias_restantes} días`
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {loadingBoleta && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Comprobante de Inscripción</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando comprobante...
                  </div>
                </div>
              )}

              {!loadingBoleta && !boletaInscripcion && (
                <div className="border-t pt-4 bg-amber-50 border border-amber-200 p-4 rounded-md mt-4">
                  <h3 className="font-semibold mb-2 text-amber-800 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Comprobante de Inscripción faltante
                  </h3>
                  <p className="text-sm text-amber-800">
                    Para que aparezca &quot;DOC COMPLETADOS&quot; y se habilite Aprobar, el prospecto debe tener en Gestión de Prospectos: <strong>recibo American, DPI, recibo de luz/teléfono y boleta de pago</strong>.
                  </p>
                </div>
              )}

              {!loadingBoleta && boletaInscripcion && (
                <div className="border-t pt-4 bg-blue-50/30 p-4 rounded-md mt-4">
                  <h3 className="font-semibold mb-2 text-blue-800">Comprobante de Inscripción</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{boletaInscripcion.nombre_archivo || "Boleta adjunta"}</p>
                        <p className="text-xs text-gray-500">
                          Subido el: {new Date(boletaInscripcion.fecha_subida || boletaInscripcion.created_at || boletaInscripcion.subida_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => openPreview(boletaInscripcion)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Comprobante
                    </Button>
                  </div>
                </div>
              )}

              {/* Apartado para generar contrato (Alerta Alumno Nuevo) */}
              {selectedProspecto && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-2 text-[#1e264d]">Contrato de confidencialidad</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Ir a la pantalla de firma con los datos académicos y del estudiante para generar el contrato. Los datos faltantes podrán completarse desde admisión.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        setModalOpen(false)
                        router.push(`/firma/student-details/${selectedProspecto.id}`)
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generar contrato (ir a firma)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDescargarContrato(selectedProspecto.id)}
                      disabled={descargandoContrato}
                    >
                      {descargandoContrato ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      {descargandoContrato ? "Descargando..." : "Solo descargar PDF"}
                    </Button>
                  </div>
                </div>
              )}
                </TabsContent>

                <TabsContent value="documentos" className="space-y-4 mt-4">
                  <h3 className="font-semibold text-[#1e264d]">Documentos requeridos</h3>
                  <p className="text-sm text-gray-600">Vista previa de los documentos completos (recibo American, DPI, recibo de luz, boleta de pago).</p>
                  {loadingBoleta ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando documentos...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { tipo: "american", label: "Recibo American" },
                        { tipo: "dpi", label: "DPI" },
                        { tipo: "recibo", label: "Recibo de luz / teléfono" },
                        { tipo: "inscripcion", label: "Boleta de pago" },
                      ].map(({ tipo, label }) => {
                        const doc = getDocByTipo(tipo)
                        const fecha = doc?.fecha_subida || doc?.created_at || doc?.subida_at
                        return (
                          <div
                            key={tipo}
                            className="flex items-center justify-between py-3 px-4 rounded-lg border bg-slate-50/50"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-slate-500" />
                              <div>
                                <p className="font-medium text-sm">{label}</p>
                                <p className="text-xs text-gray-500">
                                  {doc ? `Subido el: ${fecha ? new Date(fecha).toLocaleDateString() : "—"}` : "No subido"}
                                </p>
                              </div>
                              {doc && (
                                <Badge className="bg-green-100 text-green-800">Completo</Badge>
                              )}
                            </div>
                            {doc && (
                              <Button variant="outline" size="sm" onClick={() => openPreview(doc)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cerrar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setModalOpen(false)
                  selectedProspecto.alerta && handleSolicitarCorreccion(selectedProspecto.alerta, selectedProspecto.id)
                }}
                disabled={processingId === selectedProspecto.id || !selectedProspecto.alerta}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  if (selectedProspecto.alerta) {
                    setModalOpen(false)
                    handleAprobar(selectedProspecto.alerta, selectedProspecto.id)
                  } else {
                    handleAprobarProspecto(selectedProspecto.id)
                  }
                }}
                disabled={processingId === selectedProspecto.id}
              >
                {processingId === selectedProspecto.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Aprobar
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Preview Modal para cualquier documento */}
      {documentoToPreview && (
        <ServerFilePreviewModal
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false)
            setDocumentoToPreview(null)
          }}
          fileUrl={documentoToPreview.id
            ? `${API_BASE_URL.replace(/\/$/, "")}/api/documentos/${documentoToPreview.id}/file`
            : ""}
          fileName={(() => {
            const name = documentoToPreview.nombre_archivo || ""
            const path = documentoToPreview.ruta_archivo || ""
            if (name && name.includes(".")) return name
            const fromPath = path.split("/").pop() || ""
            if (fromPath && fromPath.includes(".")) return fromPath
            const tipo = documentoToPreview.tipo_documento || "documento"
            return `${tipo}.pdf`
          })()}
          tipoDocumento={documentoToPreview.tipo_documento || "inscripcion"}
          authToken={typeof window !== "undefined" ? localStorage.getItem("token") : null}
        />
      )}
    </div>
  )
}
