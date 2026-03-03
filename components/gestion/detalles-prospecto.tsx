"use client"

import { useState, useEffect } from "react"
import {
  X, Calendar, MapPin, Globe, BookOpen, User, Briefcase, Building2,
  Download, Loader2, Phone, Mail, CreditCard, GraduationCap, FileText,
  Hash, Clock, Shield, IdCard, Trash2, FolderDown, ChevronDown, ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ServerFilePreviewModal } from "@/components/ui/server-file-preview-modal"
import { API_BASE_URL } from "@/utils/apiConfig"
import Swal from "sweetalert2"
import JSZip from "jszip"

const API_URL = `${API_BASE_URL}/api`

interface DetallesProspectoProps {
  prospectoId: string
  onClose: () => void
}

const formatDate = (dateString?: string | null) => {
  if (!dateString || dateString === "—") return "—"
  try {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return dateString
  }
}

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
    <Icon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900 break-words">{value || "—"}</p>
    </div>
  </div>
)

const SectionTitle = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
    <Icon className="h-4 w-4 text-blue-600" />
    <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
  </div>
)

export default function DetallesProspecto({ prospectoId, onClose }: DetallesProspectoProps) {
  const [descargando, setDescargando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [prospecto, setProspecto] = useState<any>(null)
  const [programas, setProgramas] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const [documentos, setDocumentos] = useState<any[]>([])
  const [descargandoDoc, setDescargandoDoc] = useState<number | null>(null)
  const [descargandoTodo, setDescargandoTodo] = useState(false)
  const [departamentos, setDepartamentos] = useState<{ id: number; nombre: string }[]>([])
  // Vista previa de documentos
  const [previewDoc, setPreviewDoc] = useState<any>(null)
  // Sección Detalle de Cuotas colapsable (comprimible)
  const [detalleCuotasAbierto, setDetalleCuotasAbierto] = useState(false)

  // Cargar datos completos del prospecto
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }

        // Cargar prospecto, programas y documentos en paralelo
        const [resProspecto, resProgramas, resDocs] = await Promise.all([
          fetch(`${API_URL}/prospectos/${prospectoId}`, { headers }),
          fetch(`${API_URL}/programas`, { headers }),
          fetch(`${API_URL}/documentos/prospecto/${prospectoId}`, { headers }).catch(() => null),
        ])

        if (!resProspecto.ok) throw new Error("Error al cargar datos del prospecto")

        const { data } = await resProspecto.json()
        setProspecto(data)

        if (resProgramas.ok) {
          const progsData = await resProgramas.json()
          const map: Record<string, string> = {}
          progsData.forEach((p: any) => {
            map[p.id] = p.nombre_del_programa || p.nombre
          })
          setProgramas(map)
        }

        // Cargar documentos asociados
        if (resDocs && resDocs.ok) {
          const docsData = await resDocs.json()
          setDocumentos(Array.isArray(docsData) ? docsData : docsData.data ? (Array.isArray(docsData.data) ? docsData.data : []) : [])
        }
        // Cargar departamentos
        const resDeptos = await fetch(`${API_URL}/ubicacion/1`, { headers })
        if (resDeptos.ok) {
          const deptosData = await resDeptos.json()
          setDepartamentos(deptosData.departamentos || [])
        }
      } catch (err: any) {
        setError(err.message || "Error inesperado")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [prospectoId])

  const getDepartamentoNombre = (id: string | number) => {
    if (!id) return ""
    const dep = departamentos.find(d => d.id.toString() === id.toString())
    return dep ? dep.nombre : id.toString()
  }

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      "No contactado": "bg-gray-100 text-gray-800",
      "En seguimiento": "bg-blue-100 text-blue-800",
      "Le interesa a futuro": "bg-yellow-100 text-yellow-800",
      Perdido: "bg-red-100 text-red-800",
      Inscrito: "bg-green-100 text-green-800",
      Activo: "bg-green-100 text-green-800",
      "Promesa de pago": "bg-purple-100 text-purple-800",
    }
    return colors[estado] || "bg-gray-100 text-gray-800"
  }

  const handleDescargarReporteConsolidado = async () => {
    setDescargando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/prospectos/${prospectoId}/reporte-consolidado-pdf`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reporte-consolidado-prospecto-${prospectoId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      Swal.fire({
        icon: "success",
        title: "Descarga exitosa",
        text: "El reporte consolidado se descargó correctamente",
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (err) {
      console.error("Error al descargar reporte consolidado:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo descargar el reporte consolidado",
      })
    } finally {
      setDescargando(false)
    }
  }

  // Descargar reporte PDF + todos los documentos asociados en un ZIP
  const handleDescargarTodo = async () => {
    setDescargandoTodo(true)
    try {
      const token = localStorage.getItem("token")
      const headers = { Authorization: token ? `Bearer ${token}` : "" }
      const zip = new JSZip()
      const nombreProspecto = (prospecto?.nombre_completo || "prospecto").replace(/\s+/g, "_")

      // 1. Descargar el reporte consolidado PDF
      const resPDF = await fetch(`${API_URL}/prospectos/${prospectoId}/reporte-consolidado-pdf`, { headers })
      if (resPDF.ok) {
        const pdfBlob = await resPDF.blob()
        zip.file(`Reporte_Consolidado_${nombreProspecto}.pdf`, pdfBlob)
      }

      // 2. Descargar todos los documentos asociados
      if (documentos.length > 0) {
        const carpetaDocs = zip.folder("Documentos")
        const descargas = documentos.map(async (doc: any, idx: number) => {
          try {
            const resDoc = await fetch(`${API_URL}/documentos/${doc.id}/file`, { headers })
            if (resDoc.ok) {
              const blob = await resDoc.blob()
              const nombreArchivo = doc.ruta_archivo
                ? doc.ruta_archivo.split("/").pop()
                : `documento-${doc.id}`
              // Agregar prefijo numérico para evitar colisiones de nombre
              carpetaDocs?.file(`${idx + 1}_${nombreArchivo}`, blob)
            }
          } catch (e) {
            console.warn(`No se pudo descargar documento ${doc.id}:`, e)
          }
        })
        await Promise.all(descargas)
      }

      // 3. Generar y descargar el ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = window.URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Expediente_${nombreProspecto}_${prospectoId}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      Swal.fire({
        icon: "success",
        title: "Descarga exitosa",
        text: `Se descargó el expediente completo (reporte + ${documentos.length} documento${documentos.length !== 1 ? "s" : ""})`,
        timer: 3000,
        showConfirmButton: false,
      })
    } catch (err) {
      console.error("Error al descargar expediente completo:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo descargar el expediente completo",
      })
    } finally {
      setDescargandoTodo(false)
    }
  }

  // Descargar un documento asociado al prospecto
  const handleDescargarDocumento = async (doc: any) => {
    setDescargandoDoc(doc.id)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/documentos/${doc.id}/file`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      // Extraer nombre del archivo de la ruta o usar nombre genérico
      const nombreArchivo = doc.ruta_archivo
        ? doc.ruta_archivo.split("/").pop()
        : `documento-${doc.id}.pdf`
      a.download = nombreArchivo
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Error al descargar documento:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo descargar el documento",
      })
    } finally {
      setDescargandoDoc(null)
    }
  }

  // Eliminar programa con cascada (cuotas + pagos)
  const handleEliminarPrograma = async (ep: any) => {
    const nombrePrograma = ep.programa?.abreviatura
      ? `${ep.programa.abreviatura} ${ep.programa.nombre_del_programa}`
      : `Programa ${ep.programa_id}`

    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar programa?",
      html: `
        <p>Estás a punto de eliminar:</p>
        <p class="font-bold text-lg mt-2">${nombrePrograma}</p>
        <p class="text-sm text-gray-500 mt-2">Se eliminarán también todas las cuotas y pagos asociados a este programa.</p>
        <p class="text-sm text-red-600 mt-1 font-semibold">Esta acción no se puede deshacer.</p>
      `,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/estudiante-programa/${ep.id}/cascade`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `Error HTTP ${res.status}`)
      }

      const data = await res.json()

      // Actualizar lista local de programas
      setProspecto((prev: any) => ({
        ...prev,
        programas: prev.programas.filter((p: any) => p.id !== ep.id),
      }))

      Swal.fire({
        icon: "success",
        title: "Programa eliminado",
        html: `<p>${nombrePrograma} fue eliminado.</p>
               <p class="text-xs text-gray-500 mt-1">${data.cuotas_eliminadas || 0} cuotas y ${data.pagos_eliminados || 0} pagos eliminados.</p>`,
        timer: 3000,
        showConfirmButton: false,
      })
    } catch (err: any) {
      console.error("Error al eliminar programa:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo eliminar el programa",
      })
    }
  }

  // Resolver nombre del programa de interés
  const programaNombre = prospecto?.interes && programas[prospecto.interes]
    ? programas[prospecto.interes]
    : prospecto?.interes
      ? `Programa ${prospecto.interes}`
      : "—"

  // Asesor
  const asesorNombre = prospecto?.creator
    ? `${prospecto.creator.first_name || ""} ${prospecto.creator.last_name || ""}`.trim() || "Sin asignar"
    : "Sin asignar"

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[92vh] overflow-y-auto p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sticky top-0 z-10 bg-white border-b px-6 py-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-600" />
              <span>Información Completa del Prospecto</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={onClose}>Cerrar</Button>
          </div>
        ) : prospecto ? (
          <div className="px-6 pb-6 space-y-4 pt-4">
            {/* Header con nombre, estado y botón PDF */}
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{prospecto.nombre_completo}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-gray-600">ID: {prospecto.id}</p>
                    {prospecto.carnet && (
                      <p className="text-sm text-gray-600">Carnet: {prospecto.carnet}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getEstadoColor(prospecto.status || "")}>
                    {prospecto.status || "—"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDescargarReporteConsolidado}
                    disabled={descargando || descargandoTodo}
                    className="gap-1.5 text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    {descargando ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {descargando ? "Descargando..." : "Reporte PDF"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDescargarTodo}
                    disabled={descargandoTodo || descargando}
                    className="gap-1.5 text-green-700 border-green-300 hover:bg-green-100"
                    title={documentos.length > 0 ? `Descargar reporte PDF + ${documentos.length} documento${documentos.length !== 1 ? 's' : ''} en un ZIP` : 'Descargar reporte PDF en ZIP'}
                  >
                    {descargandoTodo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FolderDown className="h-4 w-4" />
                    )}
                    {descargandoTodo ? "Empaquetando..." : documentos.length > 0 ? `Todo (${documentos.length + 1})` : "Expediente ZIP"}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Tabs con toda la info */}
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-6 h-auto">
                <TabsTrigger value="personal" className="text-xs py-2">Personal</TabsTrigger>
                <TabsTrigger value="laboral" className="text-xs py-2">Laboral</TabsTrigger>
                <TabsTrigger value="academico" className="text-xs py-2">Académico</TabsTrigger>
                <TabsTrigger value="financiero" className="text-xs py-2">Financiero</TabsTrigger>
                <TabsTrigger value="documentos" className="text-xs py-2">
                  Documentos
                  {documentos.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 py-0">{documentos.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="notas" className="text-xs py-2">Notas</TabsTrigger>
              </TabsList>

              {/* ══════ TAB: DATOS PERSONALES ══════ */}
              <TabsContent value="personal" className="space-y-4 mt-4">
                <SectionTitle icon={User} title="Datos Personales" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow icon={User} label="Nombre Completo" value={prospecto.nombre_completo || "—"} />
                  <InfoRow icon={IdCard} label="DPI / Identificación" value={prospecto.numero_identificacion || "—"} />
                  <InfoRow icon={User} label="Género" value={prospecto.genero || "—"} />
                  <InfoRow icon={Calendar} label="Fecha de Nacimiento" value={formatDate(prospecto.fecha_nacimiento)} />
                  {prospecto.carnet && (
                    <InfoRow icon={Hash} label="Carnet" value={prospecto.carnet} />
                  )}
                </div>

                <SectionTitle icon={Phone} title="Contacto" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow icon={Phone} label="Teléfono" value={prospecto.telefono || "—"} />
                  <InfoRow icon={Mail} label="Correo Electrónico" value={prospecto.correo_electronico || "—"} />
                  <InfoRow icon={Mail} label="Correo Corporativo" value={prospecto.correo_corporativo || "—"} />
                  <InfoRow icon={Phone} label="Teléfono Corporativo" value={prospecto.telefono_corporativo || "—"} />
                </div>

                <SectionTitle icon={MapPin} title="Ubicación" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow icon={Globe} label="País" value={prospecto.pais_nombre || prospecto.pais_origen || "—"} />
                  <InfoRow icon={MapPin} label="Departamento" value={prospecto.departamento_nombre || getDepartamentoNombre(prospecto.departamento)} />
                  <InfoRow icon={MapPin} label="Municipio" value={prospecto.municipio_nombre || prospecto.municipio || "—"} />
                  <InfoRow icon={MapPin} label="Dirección de Residencia" value={prospecto.direccion_residencia || "—"} />
                </div>

                <SectionTitle icon={Clock} title="Registro" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow icon={User} label="Asesor / Creado por" value={asesorNombre} />
                  <InfoRow icon={Calendar} label="Fecha de Captura" value={formatDate(prospecto.created_at)} />
                  <InfoRow icon={User} label="Medio de Conocimiento" value={prospecto.medio_conocimiento_institucion || "—"} />
                  <InfoRow icon={Calendar} label="Última Actualización" value={formatDate(prospecto.updated_at)} />
                </div>
              </TabsContent>

              {/* ══════ TAB: DATOS LABORALES ══════ */}
              <TabsContent value="laboral" className="space-y-4 mt-4">
                <SectionTitle icon={Briefcase} title="Información Laboral" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow icon={Building2} label="Empresa Actual" value={prospecto.empresa_donde_labora_actualmente || "—"} />
                  <InfoRow icon={Briefcase} label="Puesto" value={prospecto.puesto || "—"} />
                  <InfoRow icon={MapPin} label="Departamento" value={prospecto.departamento_nombre || getDepartamentoNombre(prospecto.departamento)} />
                  <InfoRow icon={Phone} label="Teléfono Corporativo" value={prospecto.telefono_corporativo || "—"} />
                  <InfoRow icon={Mail} label="Correo Corporativo" value={prospecto.correo_corporativo || "—"} />
                  <InfoRow icon={MapPin} label="Dirección de la Empresa" value={prospecto.direccion_empresa || "—"} />
                </div>
              </TabsContent>

              {/* ══════ TAB: DATOS ACADÉMICOS ══════ */}
              <TabsContent value="academico" className="space-y-4 mt-4">
                <SectionTitle icon={GraduationCap} title="Formación Académica Previa" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow icon={GraduationCap} label="Último Título Obtenido" value={prospecto.ultimo_titulo_obtenido || "—"} />
                  <InfoRow icon={Building2} label="Institución Anterior" value={prospecto.institucion_titulo || "—"} />
                  <InfoRow icon={BookOpen} label="Carrera del Último Título" value={prospecto.carrera_ultimo_titulo || "—"} />
                  <InfoRow icon={Calendar} label="Año de Graduación" value={prospecto.anio_graduacion || "—"} />
                  <InfoRow icon={Hash} label="Cursos Aprobados" value={prospecto.cantidad_cursos_aprobados?.toString() || "—"} />
                </div>

                <SectionTitle icon={BookOpen} title="Programa de Interés en ASM" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow icon={BookOpen} label="Programa de Interés" value={programaNombre} />
                  <InfoRow icon={Clock} label="Modalidad" value={prospecto.modalidad || "—"} />
                  <InfoRow icon={Calendar} label="Día de Estudio" value={prospecto.dia_estudio || "—"} />
                  <InfoRow icon={Calendar} label="Fecha Inicio Específica" value={formatDate(prospecto.fecha_inicio_especifica)} />
                  <InfoRow icon={Calendar} label="Fecha Taller Inducción" value={formatDate(prospecto.fecha_taller_reduccion)} />
                  <InfoRow icon={Calendar} label="Fecha Taller Integración" value={formatDate(prospecto.fecha_taller_integracion)} />
                </div>

                {/* Programas inscritos (si tiene relación programas) */}
                {prospecto.programas && prospecto.programas.length > 0 && (
                  <>
                    <SectionTitle icon={Shield} title="Programas Inscritos" />
                    {prospecto.programas.map((ep: any, idx: number) => (
                      <Card key={ep.id || idx} className="p-4 bg-gray-50 border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-semibold text-gray-800">
                            {ep.programa?.abreviatura || ""} {ep.programa?.nombre_del_programa || `Programa ${ep.programa_id}`}
                          </h5>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {ep.estado || "Activo"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar programa"
                              onClick={() => handleEliminarPrograma(ep)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          <div><span className="text-gray-500">Inicio:</span> {formatDate(ep.fecha_inicio)}</div>
                          <div><span className="text-gray-500">Fin:</span> {formatDate(ep.fecha_fin)}</div>
                          <div><span className="text-gray-500">Duración:</span> {ep.duracion_meses || "—"} meses</div>
                        </div>
                      </Card>
                    ))}
                  </>
                )}
              </TabsContent>

              {/* ══════ TAB: DATOS FINANCIEROS ══════ */}
              <TabsContent value="financiero" className="space-y-4 mt-4">
                <SectionTitle icon={CreditCard} title="Información Financiera" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow icon={CreditCard} label="Método de Pago" value={
                    (prospecto.metodo_pago || prospecto.forma_pago || "").toString().trim() || "—"
                  } />
                  <InfoRow icon={CreditCard} label="Monto Inscripción" value={
                    (prospecto.monto_inscripcion != null && prospecto.monto_inscripcion !== "" && Number(prospecto.monto_inscripcion) >= 0)
                      ? `Q ${Number(prospecto.monto_inscripcion).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
                      : (prospecto.programas?.[0]?.inscripcion != null && prospecto.programas[0].inscripcion !== "")
                        ? `Q ${Number(prospecto.programas[0].inscripcion).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
                        : "—"
                  } />
                  {(prospecto.convenio || prospecto.programas?.[0]?.convenio) && (
                    <InfoRow icon={FileText} label="Convenio de Pago" value={
                      prospecto.convenio?.nombre ?? prospecto.programas?.[0]?.convenio?.nombre ?? "—"
                    } />
                  )}
                </div>

                {/* Programas inscritos con montos (inscripción, cuota, duración) — Alerta Alumno Nuevo e inscripción normal */}
                {prospecto.programas && prospecto.programas.length > 0 && (
                  <>
                    <SectionTitle icon={CreditCard} title="Programas inscritos (montos)" />
                    <div className="grid grid-cols-1 gap-3">
                      {prospecto.programas.map((ep: any, idx: number) => (
                        <Card key={idx} className="p-4 border-gray-200">
                          <h5 className="text-sm font-semibold text-gray-800 mb-3">
                            {ep.programa?.abreviatura ? `${ep.programa.abreviatura} – ` : ""}{ep.programa?.nombre_del_programa || "Programa"}
                          </h5>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div className="bg-slate-50 rounded-lg p-2">
                              <p className="text-xs text-gray-500">Inscripción</p>
                              <p className="font-semibold text-gray-900">
                                Q {(Number(ep.inscripcion) || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2">
                              <p className="text-xs text-gray-500">Cuota mensual</p>
                              <p className="font-semibold text-gray-900">
                                Q {(Number(ep.cuota_mensual) || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2">
                              <p className="text-xs text-gray-500">Duración</p>
                              <p className="font-semibold text-gray-900">{ep.duracion_meses ?? "—"} meses</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2">
                              <p className="text-xs text-gray-500">Inversión total</p>
                              <p className="font-semibold text-gray-900">
                                Q {(Number(ep.inversion_total) || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                {/* Detalle de Cuotas por programa — comprimible; considera todos los planes (1 o 2 programas) */}
                {prospecto.programas && prospecto.programas.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setDetalleCuotasAbierto(!detalleCuotasAbierto)}
                      className="w-full flex items-center justify-between gap-2 p-3 bg-gray-50 hover:bg-gray-100 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-800">
                          Detalle de Cuotas {prospecto.programas.length > 1 ? `(${prospecto.programas.length} planes)` : ""}
                        </span>
                      </div>
                      {detalleCuotasAbierto ? (
                        <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    {detalleCuotasAbierto && (
                      <div className="p-4 space-y-4 bg-white">
                        {prospecto.programas.map((ep: any, idx: number) => {
                          const tieneCuotas = ep.cuotas && ep.cuotas.length > 0
                          const totalCuotas = tieneCuotas
                            ? ep.cuotas.reduce((s: number, c: any) => s + (Number(c.monto) || 0), 0)
                            : 0
                          const totalPagado = tieneCuotas
                            ? ep.cuotas.filter((c: any) => c.estado?.toLowerCase() === "pagado").reduce((s: number, c: any) => s + (Number(c.monto) || 0), 0)
                            : 0

                          return (
                            <Card key={idx} className="p-4 border-gray-200">
                              <h5 className="text-sm font-semibold text-gray-800 mb-3">
                                {ep.programa?.abreviatura ? `${ep.programa.abreviatura} – ` : ""}{ep.programa?.nombre_del_programa || "Programa"}
                              </h5>
                              {tieneCuotas ? (
                                <>
                                  <div className="grid grid-cols-3 gap-3 mb-3">
                                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                                      <p className="text-xs text-gray-500">Total</p>
                                      <p className="text-sm font-bold text-blue-800">Q {totalCuotas.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-2 text-center">
                                      <p className="text-xs text-gray-500">Pagado</p>
                                      <p className="text-sm font-bold text-green-800">Q {totalPagado.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-2 text-center">
                                      <p className="text-xs text-gray-500">Pendiente</p>
                                      <p className="text-sm font-bold text-red-800">Q {(totalCuotas - totalPagado).toLocaleString("es-GT", { minimumFractionDigits: 2 })}</p>
                                    </div>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="bg-gray-100 text-gray-600">
                                          <th className="text-left p-2">#</th>
                                          <th className="text-left p-2">Concepto</th>
                                          <th className="text-left p-2">Vencimiento</th>
                                          <th className="text-right p-2">Monto</th>
                                          <th className="text-center p-2">Estado</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {ep.cuotas.map((cuota: any, ci: number) => (
                                          <tr key={ci} className="border-b border-gray-100">
                                            <td className="p-2">{cuota.numero_cuota}</td>
                                            <td className="p-2">{cuota.concepto || `Cuota ${cuota.numero_cuota}`}</td>
                                            <td className="p-2">{cuota.fecha_vencimiento ? new Date(cuota.fecha_vencimiento).toLocaleDateString("es-GT") : "—"}</td>
                                            <td className="p-2 text-right">Q {Number(cuota.monto || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}</td>
                                            <td className="p-2 text-center">
                                              <Badge
                                                variant="outline"
                                                className={`text-[10px] ${cuota.estado?.toLowerCase() === "pagado"
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : cuota.estado?.toLowerCase() === "vencido"
                                                      ? "bg-red-50 text-red-700 border-red-200"
                                                      : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                  }`}
                                              >
                                                {cuota.estado || "Pendiente"}
                                              </Badge>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-500 py-2">
                                  Sin plan de cuotas generado. Inscripción: Q {(Number(ep.inscripcion) || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })} · Cuota mensual: Q {(Number(ep.cuota_mensual) || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })} · {ep.duracion_meses ?? "—"} meses.
                                </div>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* ══════ TAB: DOCUMENTOS ══════ */}
              <TabsContent value="documentos" className="space-y-4 mt-4">
                <SectionTitle icon={FileText} title="Documentos Asociados" />

                {documentos.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No hay documentos asociados a este prospecto.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documentos.map((doc: any) => {
                      const nombreArchivo = doc.ruta_archivo
                        ? doc.ruta_archivo.split("/").pop()
                        : `documento-${doc.id}`
                      const extension = nombreArchivo?.split(".").pop()?.toLowerCase() || ""
                      const esImagen = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension)
                      const esPDF = extension === "pdf"

                      const estadoColor =
                        doc.estado === "aprobado"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : doc.estado === "rechazado"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200"

                      return (
                        <Card key={doc.id} className="p-4 border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`p-2 rounded-lg ${esImagen ? "bg-purple-100" : esPDF ? "bg-red-100" : "bg-blue-100"
                                }`}>
                                <FileText className={`h-5 w-5 ${esImagen ? "text-purple-600" : esPDF ? "text-red-600" : "text-blue-600"
                                  }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {nombreArchivo}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500">
                                    {doc.tipo_documento || "Documento"}
                                  </span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <Badge variant="outline" className={`text-[10px] ${estadoColor}`}>
                                    {doc.estado || "pendiente"}
                                  </Badge>
                                  {doc.subida_at && (
                                    <>
                                      <span className="text-xs text-gray-400">•</span>
                                      <span className="text-xs text-gray-500">
                                        {formatDate(doc.subida_at)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewDoc(doc)}
                                className="gap-1.5 text-indigo-700 border-indigo-300 hover:bg-indigo-100"
                                title="Vista previa"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Ver
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDescargarDocumento(doc)}
                                disabled={descargandoDoc === doc.id}
                                className="gap-1.5 text-blue-700 border-blue-300 hover:bg-blue-100"
                              >
                                {descargandoDoc === doc.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                                Descargar
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Modal de vista previa de documentos */}
              <ServerFilePreviewModal
                isOpen={!!previewDoc}
                onClose={() => setPreviewDoc(null)}
                fileUrl={previewDoc ? `${API_URL}/documentos/${previewDoc.id}/file` : null}
                fileName={previewDoc?.ruta_archivo?.split("/").pop() || `documento-${previewDoc?.id}`}
                tipoDocumento={previewDoc?.tipo_documento}
                estado={previewDoc?.estado}
                authToken={typeof window !== "undefined" ? localStorage.getItem("token") : null}
              />

              {/* ══════ TAB: NOTAS ══════ */}
              <TabsContent value="notas" className="space-y-4 mt-4">
                <SectionTitle icon={FileText} title="Notas y Observaciones" />

                {prospecto.notas_generales ? (
                  <Card className="p-4 bg-amber-50 border-amber-200">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Notas Generales</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-amber-200">
                      {prospecto.notas_generales}
                    </p>
                  </Card>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sin notas generales.</p>
                )}

                {prospecto.observaciones && (
                  <Card className="p-4 bg-amber-50 border-amber-200">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Observaciones</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-amber-200">
                      {prospecto.observaciones}
                    </p>
                  </Card>
                )}

                {prospecto.nota1 && (
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Nota 1</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-blue-200">
                      {prospecto.nota1}
                    </p>
                  </Card>
                )}

                {prospecto.nota2 && (
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Nota 2</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-blue-200">
                      {prospecto.nota2}
                    </p>
                  </Card>
                )}

                {prospecto.nota3 && (
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Nota 3</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-blue-200">
                      {prospecto.nota3}
                    </p>
                  </Card>
                )}

                {prospecto.cierre && (
                  <Card className="p-4 bg-green-50 border-green-200">
                    <p className="text-xs font-semibold text-green-700 mb-1">Cierre</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-green-200">
                      {prospecto.cierre}
                    </p>
                  </Card>
                )}

                {!prospecto.notas_generales && !prospecto.observaciones && !prospecto.nota1 && !prospecto.nota2 && !prospecto.nota3 && !prospecto.cierre && (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No hay notas registradas para este prospecto.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
