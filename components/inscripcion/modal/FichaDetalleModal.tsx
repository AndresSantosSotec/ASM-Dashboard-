// components/inscripcion/FichaDetalleModal.tsx
"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Send, Download, FileText, ArrowLeft, ThumbsUp } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { FichaEstudiante } from "../types"
import { API_BASE_URL } from "@/utils/apiConfig"
import fetchFicha from "@/services/fichas"
import fetchDocumentosRevision from "@/services/documentos"
import { formatDate } from "@/utils/formatDate"
import { resolveBackendUrl } from "@/utils/resolveBackendUrl" // ⬅️ NUEVO
import Swal from "sweetalert2"

interface Props {
  ficha: FichaEstudiante
  isOpen: boolean
  onClose: () => void
  onMarcarRevisada: () => void
  onSolicitarCorreccion: () => void
  onAprobar?: () => void
  onRetroceder?: () => void
  comentarioRevision: string
  showSuccessMessage: boolean
}

export default function FichaDetalleModal({
  ficha,
  isOpen,
  onClose,
  onMarcarRevisada,
  onSolicitarCorreccion,
  onAprobar,
  onRetroceder,
  comentarioRevision,
  showSuccessMessage,
}: Props) {
  // Estados de datos
  const [personales, setPersonales] = useState<any>({})
  const [laborales, setLaborales] = useState<any>({})
  const [academicos, setAcademicos] = useState<any>({})
  const [financieros, setFinancieros] = useState<any>({})
  const [programasInscritos, setProgramasInscritos] = useState<any[]>([])
  const [documentos, setDocumentos] = useState<any[]>([])
  const [contratoInfo, setContratoInfo] = useState<any>(null)
  const [nuevosFirmados, setNuevosFirmados] = useState(0)

  // Campos para mostrar
  const camposPersonales: [string, any][] = [
    ["Nombre completo", personales.nombre],
    ["País origen", personales.paisOrigen],
    ["País residencia", personales.paisResidencia],
    ["Teléfono", personales.telefono],
    ["DPI", personales.dpi],
    ["Email personal", personales.emailPersonal],
    ["Email corporativo", personales.emailCorporativo],
    ["Fecha Nac.", formatDate(personales.fechaNacimiento)],
    ["Dirección", personales.direccion],
  ]

  const camposAcademicos: [string, any][] = [
    ["Modalidad", academicos.modalidad],
    ["Inicio específico", formatDate(academicos.fechaInicioEspecifica)],
    ["Taller inducción", formatDate(academicos.fechaTallerInduccion)],
    ["Taller integración", formatDate(academicos.fechaTallerIntegracion)],
    ["Último título obtenido", academicos.ultimoTitulo],
    ["Carrera del título", academicos.carrera],
    ["Institución anterior", academicos.institucionAnterior],
    ["Año graduación", academicos.añoGraduacion],
    ["Medio conoció", academicos.medioConocio],
    ["Cursos aprobados", academicos.cursosAprobados],
    ["Día de estudio", academicos.diaEstudio],
  ]

  const camposLaborales: [string, any][] = [
    ["Empresa", laborales.empresa],
    ["Puesto", laborales.puesto],
    ["Teléfono corp.", laborales.telefonoCorporativo],
    ["Dirección empresa", laborales.direccionEmpresa],
  ]

  const camposFinancieros: [string, any][] = [
    ["Método de pago", financieros.formaPago],
    ["Convenio", financieros.convenioNombre],
    ["Inscripción", financieros.inscripcion],
    ["Cuota mensual", financieros.cuotaMensual],
    ["Inversión total", financieros.inversionTotal],
  ]

  // Estados de UI
  const [isRevisada, setIsRevisada] = useState(false)
  const [correctionMode, setCorrectionMode] = useState(false)

  // ===== Helpers =====

  // ⬇️ Reemplazado: versión estricta que ignora d.url y siempre genera URL en el mismo origen que API_BASE_URL
  const getDocUrl = (d: any) =>
    resolveBackendUrl(
      d?.ruta_archivo ? `/storage/${d.ruta_archivo}` : `/api/documentos/${d.id}/file`,
      API_BASE_URL
    )

  const normalizeType = (t?: string) => (t || "otros").trim().toLowerCase()
  const prettyType = (tipo: string) => {
    const n = normalizeType(tipo)
    const map: Record<string, string> = {
      dpi: "DPI",
      inscripcion: "Inscripción",
      recibo: "Recibo",
      foto: "Foto",
      otros: "Otros",
    }
    return map[n] ?? (n.charAt(0).toUpperCase() + n.slice(1))
  }

  const estadoToVariant = (estado?: string) => {
    const e = (estado || "").toLowerCase()
    if (e === "aprobado") return "default" as const
    if (e === "rechazado") return "destructive" as const
    return "secondary" as const
  }

  const fileNameFromPath = (ruta?: string) =>
    (ruta || "").split("/").pop() || "archivo.pdf"

  // elige el doc más reciente (por updated_at o subida_at)
  const pickMostRecent = (a: any, b: any) => {
    const tsA = new Date(a?.updated_at || a?.subida_at || 0).getTime()
    const tsB = new Date(b?.updated_at || b?.subida_at || 0).getTime()
    return tsB > tsA ? b : a
  }

  // dedupe: deja 1 doc (el más nuevo) por tipo_documento
  const dedupeLatestByType = (docs: any[]) => {
    const byType: Record<string, any> = {}
    for (const d of docs) {
      const k = normalizeType(d?.tipo_documento)
      byType[k] = byType[k] ? pickMostRecent(byType[k], d) : d
    }
    return Object.entries(byType)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, doc]) => doc)
  }

  // ===== Carga inicial =====
  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      try {
        const data = await fetchFicha(ficha.id)
        console.log("[FichaDetalleModal] detalle:", data)

        const fromFicha = Array.isArray((data as any)?.documentos)
          ? (data as any).documentos
          : []

        let fromRevision: any[] = []
        try {
          const res = await fetchDocumentosRevision(ficha.id)
          fromRevision = Array.isArray(res) ? res : []
        } catch {
          fromRevision = []
        }

        const byId = new Map<number, any>()
        for (const d of fromFicha) byId.set(d.id, d)
        for (const d of fromRevision) {
          const existing = byId.get(d.id)
          byId.set(d.id, existing ? pickMostRecent(existing, d) : d)
        }
        const merged = Array.from(byId.values())
        const latestByType = dedupeLatestByType(merged)

        setPersonales(data.personales || {})
        setLaborales(data.laborales || {})
        setAcademicos(data.academicos || {})
        setFinancieros(data.financieros || {})
        setProgramasInscritos(data.programas || [])
        setDocumentos(latestByType)

        // 🔥 CARGAR INFORMACIÓN DE CONTRATOS
        await cargarInfoContratos(ficha.id)

        if (data.financieros?.convenioId && !data.financieros?.convenioNombre) {
          console.warn(
            `[FichaDetalleModal] convenio ${data.financieros.convenioId} sin nombre. Revisar GET /api/convenios/${data.financieros.convenioId}`,
          )
        }

        setIsRevisada(
          localStorage.getItem(`ficha-${ficha.id}-revisada`) === "true",
        )
      } catch (err) {
        console.error("Error al cargar detalle de ficha:", err)
      }
    })()
  }, [isOpen, ficha.id])

  // 🔥 CARGAR INFORMACIÓN DE CONTRATOS DEL PROSPECTO
  const cargarInfoContratos = async (prospectoId: number) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/contactos-enviados`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
      
      if (!res.ok) return
      
      const data = await res.json()
      // El backend retorna directamente el array, no envuelto en data.data
      const contratos = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : [])
      
      console.log(`[Contratos] Total recibidos: ${contratos.length}`)
      
      // Filtrar contratos de este prospecto
      const contratosProspecto = contratos.filter((c: any) => c.prospecto_id === prospectoId)
      
      console.log(`[Contratos] Del prospecto ${prospectoId}: ${contratosProspecto.length}`)
      
      if (contratosProspecto.length === 0) {
        setContratoInfo(null)
        return
      }

      // Buscar el último contrato (más reciente)
      const ultimoContrato = contratosProspecto.reduce((prev: any, curr: any) => {
        const prevDate = new Date(prev.created_at || 0).getTime()
        const currDate = new Date(curr.created_at || 0).getTime()
        return currDate > prevDate ? curr : prev
      })

      // Contar contratos firmados (con firma de estudiante)
      const contratosFirmados = contratosProspecto.filter((c: any) => 
        c.firma_estudiante && c.firma_estudiante.trim() !== ''
      )

      console.log(`[Contratos] Firmados: ${contratosFirmados.length}`)

      // Verificar si hay nuevos firmados desde la última revisión
      const ultimaRevision = localStorage.getItem(`ultima-revision-contratos-${prospectoId}`)
      const fechaUltimaRevision = ultimaRevision ? new Date(ultimaRevision).getTime() : 0
      
      const nuevosFirmadosCount = contratosFirmados.filter((c: any) => {
        const fechaFirma = new Date(c.updated_at || c.created_at).getTime()
        return fechaFirma > fechaUltimaRevision
      }).length

      setNuevosFirmados(nuevosFirmadosCount)

      // Verificar si el último contrato tiene ambas firmas
      const tieneAmbas = ultimoContrato.firma_asesor && 
                        ultimoContrato.firma_asesor.trim() !== '' && 
                        ultimoContrato.firma_estudiante && 
                        ultimoContrato.firma_estudiante.trim() !== ''

      console.log(`[Contratos] Último contrato ID: ${ultimoContrato.id}, Tiene ambas firmas: ${tieneAmbas}`)

      setContratoInfo({
        total: contratosProspecto.length,
        firmados: contratosFirmados.length,
        enviados: contratosProspecto.length,
        ultimoContrato: ultimoContrato,
        hayFirmas: tieneAmbas
      })

    } catch (err) {
      console.error("Error cargando info de contratos:", err)
      setContratoInfo(null)
    }
  }

  // 🔥 MARCAR CONTRATOS COMO REVISADOS
  const marcarContratosRevisados = () => {
    localStorage.setItem(`ultima-revision-contratos-${ficha.id}`, new Date().toISOString())
    setNuevosFirmados(0)
  }

  // Marcar como revisada
  const marcarRevisada = () => {
    localStorage.setItem(`ficha-${ficha.id}-revisada`, "true")
    setIsRevisada(true)
    onMarcarRevisada()
  }

  // Descargar ficha de inscripción en PDF
  const handleDescargarFicha = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/prospectos/${ficha.id}/ficha-pdf`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ficha-inscripcion-${ficha.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      Swal.fire({
        icon: "success",
        title: "Descarga exitosa",
        text: "La ficha de inscripción se descargó correctamente",
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (err) {
      console.error("Error al descargar ficha:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo descargar la ficha de inscripción",
      })
    }
  }

  // Descargar contrato de confidencialidad
  const handleDescargarContrato = async () => {
    try {
      // 🔥 VALIDAR QUE HAYA CONTRATO CON AMBAS FIRMAS
      if (!contratoInfo || !contratoInfo.hayFirmas) {
        await Swal.fire({
          icon: "warning",
          title: "Contrato no disponible",
          text: "El contrato debe estar firmado por el asesor y el estudiante para poder descargarlo.",
        })
        return
      }

      const token = localStorage.getItem("token")
      
      // 🔥 DESCARGAR EL ÚLTIMO CONTRATO CON FIRMAS
      const contratoId = contratoInfo.ultimoContrato.id
      const res = await fetch(`${API_BASE_URL}/api/contactos-enviados/${contratoId}/pdf`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `contrato-firmado-${ficha.id}-${contratoId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Marcar contratos como revisados
      marcarContratosRevisados()
      
      Swal.fire({
        icon: "success",
        title: "Descarga exitosa",
        text: "El contrato firmado se descargó correctamente",
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (err) {
      console.error("Error al descargar contrato:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo descargar el contrato firmado",
      })
    }
  }

  if (!ficha) return null

  // (Opcional) Agrupar por tipo para encabezados "DPI, Recibo, ..."
  const docsByType: Record<string, any[]> = (Array.isArray(documentos) ? documentos : [])
    .reduce((acc, d) => {
      const tipo = normalizeType(d?.tipo_documento)
      if (!acc[tipo]) acc[tipo] = []
      acc[tipo].push(d)
      return acc
    }, {} as Record<string, any[]>)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ficha #{ficha.id}</DialogTitle>
          <DialogDescription>
            {personales.nombre || ficha.nombre}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-4 py-2">
          <Tabs defaultValue="personales">
            <TabsList className="flex space-x-2 overflow-x-auto">
              <TabsTrigger value="personales">Personales</TabsTrigger>
              <TabsTrigger value="academicos">Académicos</TabsTrigger>
              <TabsTrigger value="laborales">Laborales</TabsTrigger>
              <TabsTrigger value="financieros">Financieros</TabsTrigger>
              <TabsTrigger value="programas">Programas</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            {/* PERSONALES */}
            <TabsContent
              value="personales"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
            >
              {camposPersonales.map(([label, val], i) => (
                <div key={i} className="p-2 border rounded">
                  <Label>{label}</Label>
                  <p className="mt-1">
                    {val === null || val === undefined || val === "" ? "—" : val}
                  </p>
                </div>
              ))}
            </TabsContent>

            {/* ACADÉMICOS */}
            <TabsContent value="academicos" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {camposAcademicos.map(([label, val], i) => (
                  <div key={i} className="p-2 border rounded">
                    <Label>{label}</Label>
                    <p className="mt-1">
                      {val === null || val === undefined || val === "" ? "—" : val}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* LABORALES */}
            <TabsContent
              value="laborales"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
            >
              {camposLaborales.map(([label, val], i) => (
                <div key={i} className="p-2 border rounded">
                  <Label>{label}</Label>
                  <p className="mt-1">
                    {val === null || val === undefined || val === "" ? "—" : val}
                  </p>
                </div>
              ))}
            </TabsContent>

            {/* FINANCIEROS */}
            <TabsContent
              value="financieros"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
            >
              {camposFinancieros.map(([label, val], i) => (
                <div key={i} className="p-2 border rounded">
                  <Label>{label}</Label>
                  <p className="mt-1">
                    {val === null || val === undefined || val === "" ? "—" : val}
                  </p>
                </div>
              ))}
            </TabsContent>

            {/* PROGRAMAS INSCRITOS */}
            <TabsContent value="programas" className="mt-4 space-y-4">
              {programasInscritos.length === 0 ? (
                <p>Sin programas inscritos.</p>
              ) : (
                programasInscritos.map((p) => (
                  <Card key={p.id} className="p-2 border rounded">
                    <CardContent className="space-y-1">
                      <p>
                        <strong>
                          {p.programa?.abreviatura} – {p.programa?.nombre_del_programa}
                        </strong>
                      </p>
                      <p>
                        <strong>Inicio:</strong> {formatDate(p.fecha_inicio)} |{" "}
                        <strong>Fin:</strong> {formatDate(p.fecha_fin)}
                      </p>
                      <p>
                        <strong>Duración:</strong> {p.duracion_meses} meses
                      </p>
                      <p>
                        <strong>Inscripción:</strong> {p.inscripcion ?? "—"}
                      </p>
                      <p>
                        <strong>Cuota mensual:</strong> {p.cuota_mensual ?? "—"}
                      </p>
                      <p>
                        <strong>Inversión total:</strong> {p.inversion_total ?? "—"}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* DOCUMENTOS ADJUNTOS (1 por tipo, el más reciente) */}
            <TabsContent value="documentos" className="mt-4 space-y-6">
              {!Array.isArray(documentos) || documentos.length === 0 ? (
                <p>No hay documentos adjuntos.</p>
              ) : (
                Object.entries(docsByType).map(([tipo, list]) => (
                  <div key={tipo} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold">
                        {prettyType(tipo)}
                      </h4>
                      <Badge variant="outline">{list.length}</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {list.map((d) => {
                        const url = getDocUrl(d)
                        const filename = fileNameFromPath(d.ruta_archivo)
                        return (
                          <Card key={d.id} className="p-3 border rounded">
                            <CardContent className="space-y-2 p-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">
                                  {filename}
                                </span>
                                <Badge variant={estadoToVariant(d.estado)}>
                                  {d.estado ?? "—"}
                                </Badge>
                              </div>

                              <div className="text-xs text-muted-foreground">
                                Subido: {formatDate(d.subida_at)}
                              </div>

                              <div className="flex gap-2 pt-1">
                                <Button asChild size="sm">
                                  <a href={url} target="_blank" rel="noreferrer">
                                    Ver
                                  </a>
                                </Button>
                                <Button asChild size="sm" variant="outline">
                                  <a href={url} download={filename}>
                                    <Download className="w-4 h-4 mr-1" />
                                    Descargar
                                  </a>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* FOOTER */}
        <div className="border-t px-4 py-4 space-y-4">
          {/* 🔥 NOTIFICACIÓN DE NUEVOS CONTRATOS FIRMADOS */}
          {nuevosFirmados > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
              <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {nuevosFirmados}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  {nuevosFirmados === 1 
                    ? "¡Nuevo contrato firmado!" 
                    : `¡${nuevosFirmados} nuevos contratos firmados!`}
                </p>
                <p className="text-xs text-green-600">
                  Descarga el contrato para marcar como revisado
                </p>
              </div>
            </div>
          )}

          {/* 🔥 INFORMACIÓN DE CONTRATOS */}
          {contratoInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-semibold text-blue-900">Estado de Contratos</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-600">Enviados</p>
                  <p className="font-bold text-blue-900">{contratoInfo.enviados}</p>
                </div>
                <div>
                  <p className="text-blue-600">Firmados</p>
                  <p className="font-bold text-blue-900">{contratoInfo.firmados}</p>
                </div>
                <div>
                  <p className="text-blue-600">Estado</p>
                  <Badge variant={contratoInfo.hayFirmas ? "default" : "secondary"}>
                    {contratoInfo.hayFirmas ? "Firmado completo" : "Pendiente firmas"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="text-green-600" />
              <span>{isRevisada ? "Revisada" : "Pendiente de revisión"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="text-red-600" />
              <span>
                {programasInscritos.length + (Array.isArray(documentos) ? documentos.length : 0)} documentos
              </span>
            </div>
          </div>

          {/* Comentario de Revisión */}
          <div>
            <Label>Comentario de Revisión</Label>
            <Textarea
              readOnly={!correctionMode}
              value={comentarioRevision}
              className="h-24 bg-gray-100"
            />
          </div>

          {/* Botones de descarga */}
          <div className="flex justify-between items-center gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDescargarFicha}
              >
                <FileText className="mr-2 h-4 w-4" />
                Descargar Ficha
              </Button>
              <Button
                variant={contratoInfo?.hayFirmas ? "default" : "outline"}
                size="sm"
                onClick={handleDescargarContrato}
                disabled={!contratoInfo?.hayFirmas}
                className={contratoInfo?.hayFirmas ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                <FileText className="mr-2 h-4 w-4" />
                {contratoInfo?.hayFirmas ? "Descargar Contrato Firmado" : "Contrato sin firmas"}
              </Button>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-between gap-2">
            <div className="flex gap-2">
              {onRetroceder && (
                <Button
                  variant="outline"
                  onClick={onRetroceder}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Retroceder a Preinscripción
                </Button>
              )}
            </div>
            <div className="flex gap-2">

              {onAprobar && (
                <Button
                  onClick={onAprobar}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ThumbsUp className="mr-1 h-4 w-4" />
                  Aprobar y Enviar a Aprobación Académica
                </Button>
              )}
            </div>
          </div>

          {showSuccessMessage && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 /> Acción realizada con éxito
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
