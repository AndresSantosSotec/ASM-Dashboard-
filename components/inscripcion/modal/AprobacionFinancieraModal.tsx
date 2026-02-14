// components/inscripcion/modal/AprobacionFinancieraModal.tsx
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CheckCircle2, XCircle, Download, ArrowLeft, FileText } from "lucide-react"
import { Label } from "@/components/ui/label"
import { FichaEstudiante } from "../types"
import { API_BASE_URL } from "@/utils/apiConfig"
import fetchFicha from "@/services/fichas"
import type { AsesoriaInfo } from "@/services/fichas"
import fetchDocumentosRevision from "@/services/documentos"
import { formatDate } from "@/utils/formatDate"
import { resolveBackendUrl } from "@/utils/resolveBackendUrl"

interface Props {
  ficha: FichaEstudiante
  isOpen: boolean
  onClose: () => void
  onAprobar: () => void
  onSolicitarCorreccion: () => void
  onRetroceder: (estadoDestino: string) => void
}

export default function AprobacionFinancieraModal({
  ficha,
  isOpen,
  onClose,
  onAprobar,
  onSolicitarCorreccion,
  onRetroceder,
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
  const [asesoria, setAsesoria] = useState<AsesoriaInfo | null>(null)

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

  const pickMostRecent = (a: any, b: any) => {
    const tsA = new Date(a?.updated_at || a?.subida_at || 0).getTime()
    const tsB = new Date(b?.updated_at || b?.subida_at || 0).getTime()
    return tsB > tsA ? b : a
  }

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

  const renderAsesoriaBanner = () => {
    if (!asesoria) return null
    const { responsable, creadoPor, actualizadoPor } = asesoria

    return (
      <div className="mt-2 text-xs text-muted-foreground space-y-1">
        {responsable && (
          <div className="text-sm text-foreground">
            Responsable: <span className="font-semibold">{responsable.nombre}</span>
            {responsable.email ? ` · ${responsable.email}` : ""}
          </div>
        )}
        <div className="flex flex-wrap gap-4">
          {creadoPor && (
            <span>
              Creado por {creadoPor.nombre}
              {creadoPor.fecha ? ` · ${formatDate(creadoPor.fecha)}` : ""}
            </span>
          )}
          {actualizadoPor && (
            <span>
              Última actualización {actualizadoPor.nombre}
              {actualizadoPor.fecha ? ` · ${formatDate(actualizadoPor.fecha)}` : ""}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ✅ Cargar información de contratos con manejo robusto de errores
  const cargarInfoContratos = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/contactos-enviados`, {
        headers: {
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      // ✅ Verificar status HTTP antes de parsear
      if (!res.ok) {
        console.warn(`[Contratos Financiera] Respuesta no exitosa: ${res.status}`)
        setContratoInfo({ enviados: 0, firmados: 0, ultimo: null, ambasFirmas: false })
        return
      }

      const data = await res.json()
      const contratos = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : [])
      console.log("[Contratos Financiera] Total recibidos:", contratos.length)

      const delProspecto = contratos.filter((c: any) => c.prospecto_id === ficha.id)
      console.log("[Contratos Financiera] Del prospecto", ficha.id, ":", delProspecto.length)

      if (delProspecto.length === 0) {
        setContratoInfo({ enviados: 0, firmados: 0, ultimo: null, ambasFirmas: false })
        return
      }

      const firmados = delProspecto.filter((c: any) => c.firma_estudiante && c.firma_estudiante.trim() !== "")
      console.log("[Contratos Financiera] Firmados:", firmados.length)

      const ultimo = delProspecto.reduce((prev: any, curr: any) =>
        new Date(curr.created_at) > new Date(prev.created_at) ? curr : prev
      )

      const ambasFirmas = !!(
        ultimo.firma_asesor && ultimo.firma_asesor.trim() !== "" &&
        ultimo.firma_estudiante && ultimo.firma_estudiante.trim() !== ""
      )

      console.log("[Contratos Financiera] Último contrato ID:", ultimo.id, "Tiene ambas firmas:", ambasFirmas)

      // Detectar nuevos contratos firmados
      const ultimaRevisionKey = `ultima-revision-contratos-${ficha.id}`
      const ultimaRevision = localStorage.getItem(ultimaRevisionKey)
      const ultimaRevisionDate = ultimaRevision ? new Date(ultimaRevision) : new Date(0)
      const nuevos = firmados.filter((c: any) => new Date(c.created_at) > ultimaRevisionDate).length
      setNuevosFirmados(nuevos)

      setContratoInfo({
        enviados: delProspecto.length,
        firmados: firmados.length,
        ultimo,
        ambasFirmas,
      })
    } catch (err) {
      // ✅ Manejo silencioso - no rompe la UX
      console.warn(
        "[Contratos Financiera] No disponibles:",
        err instanceof Error ? err.message : "Error desconocido"
      )
      setContratoInfo({ enviados: 0, firmados: 0, ultimo: null, ambasFirmas: false })
    }
  }

  const marcarContratosRevisados = () => {
    const key = `ultima-revision-contratos-${ficha.id}`
    localStorage.setItem(key, new Date().toISOString())
    setNuevosFirmados(0)
  }

  const handleDescargarContrato = async () => {
    if (!contratoInfo?.ultimo || !contratoInfo.ambasFirmas) {
      await import("sweetalert2").then((Swal) =>
        Swal.default.fire({
          icon: "warning",
          title: "Contrato no disponible",
          text: "No hay contrato con ambas firmas para descargar",
        })
      )
      return
    }

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/contactos-enviados/${contratoInfo.ultimo.id}/pdf`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `contrato-firmado-${ficha.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      marcarContratosRevisados()
      await import("sweetalert2").then((Swal) =>
        Swal.default.fire({
          icon: "success",
          title: "Contrato descargado",
          timer: 1500,
          showConfirmButton: false,
        })
      )
    } catch (err) {
      console.error("[Contratos Financiera] Error al descargar:", err)
      await import("sweetalert2").then((Swal) =>
        Swal.default.fire({
          icon: "error",
          title: "Error al descargar",
          text: "No se pudo descargar el contrato",
        })
      )
    }
  }

  // Carga inicial
  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      try {
        const data = await fetchFicha(ficha.id)

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

        setPersonales(data.personales || {})
        setLaborales(data.laborales || {})
        setAcademicos(data.academicos || {})
        setFinancieros(data.financieros || {})
        setProgramasInscritos(data.programas || [])
        setDocumentos(merged)
        setAsesoria(data.asesoria || null)

        // Cargar información de contratos
        await cargarInfoContratos()
      } catch (err) {
        console.error("Error al cargar detalle de ficha financiera:", err)
      }
    })()
  }, [isOpen, ficha.id])

  const handleDescargarPDF = async () => {
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
      a.download = `ficha-${ficha.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Error al descargar PDF:", err)
    }
  }

  const handleDescargarPlanPagos = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/prospectos/${ficha.id}/plan-pagos-pdf`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `plan-pagos-${ficha.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Error al descargar plan de pagos:", err)
    }
  }

  if (!ficha) return null

  const docsByType: Record<string, any[]> = (Array.isArray(documentos) ? documentos : [])
    .reduce((acc, d) => {
      const tipo = normalizeType(d?.tipo_documento)
      if (!acc[tipo]) acc[tipo] = []
      acc[tipo].push(d)
      return acc
    }, {} as Record<string, any[]>)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Aprobación Financiera - Ficha #{ficha.id}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDescargarPlanPagos}>
                <FileText className="mr-2 h-4 w-4" />
                Plan de Pagos
              </Button>
              <Button variant="outline" size="sm" onClick={handleDescargarPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Descargar Ficha
              </Button>
              {/* ✅ Renderizado condicional - solo muestra si hay contrato válido */}
              {contratoInfo?.ambasFirmas && (
                <Button 
                  variant="default"
                  size="sm" 
                  onClick={handleDescargarContrato}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Contrato
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {personales.nombre || ficha.nombre} - Revisión de información financiera
          </DialogDescription>
          {renderAsesoriaBanner()}
        </DialogHeader>

        {/* ✅ Panel de información de contratos - solo si hay datos */}
        {contratoInfo && contratoInfo.enviados > 0 && (
          <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-md mx-4 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold text-blue-900">Contrato:</span>
                <span>Enviados: {contratoInfo.enviados}</span>
                <span>Firmados: {contratoInfo.firmados}</span>
                <span className={contratoInfo.ambasFirmas ? "text-green-600 font-semibold" : "text-orange-600"}>
                  {contratoInfo.ambasFirmas ? "✓ Completo" : "Pendiente de firmas"}
                </span>
                {nuevosFirmados > 0 && (
                  <Badge variant="default" className="bg-green-500">
                    {nuevosFirmados} nuevo{nuevosFirmados > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              {contratoInfo.ambasFirmas && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleDescargarContrato}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Contrato
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-4 py-2">
          <Tabs defaultValue="financieros">
            <TabsList className="flex space-x-2 overflow-x-auto">
              <TabsTrigger value="financieros">Financieros</TabsTrigger>
              <TabsTrigger value="programas">Programas</TabsTrigger>
              <TabsTrigger value="personales">Personales</TabsTrigger>
              <TabsTrigger value="academicos">Académicos</TabsTrigger>
              <TabsTrigger value="laborales">Laborales</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            {/* FINANCIEROS - Tab Principal */}
            <TabsContent
              value="financieros"
              className="mt-4 space-y-4"
            >
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Información Financiera</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {camposFinancieros.map(([label, val], i) => (
                      <div key={i} className="p-3 bg-white border rounded">
                        <Label className="text-xs text-muted-foreground">{label}</Label>
                        <p className="mt-1 font-medium">
                          {val === null || val === undefined || val === "" ? "—" : val}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PROGRAMAS INSCRITOS */}
            <TabsContent value="programas" className="mt-4 space-y-4">
              {programasInscritos.length === 0 ? (
                <p>Sin programas inscritos.</p>
              ) : (
                programasInscritos.map((p) => (
                  <Card key={p.id} className="p-4 border rounded">
                    <CardContent className="space-y-2">
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

            {/* DOCUMENTOS ADJUNTOS */}
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

        {/* FOOTER - Acciones */}
        <div className="border-t px-4 py-4 space-y-4">
          {/* ✅ NOTIFICACIÓN DE NUEVOS CONTRATOS FIRMADOS - solo si hay nuevos */}
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

          {/* ✅ INFORMACIÓN DE CONTRATOS - solo si hay datos */}
          {contratoInfo && contratoInfo.enviados > 0 && (
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
                  <Badge variant={contratoInfo.ambasFirmas ? "default" : "secondary"}>
                    {contratoInfo.ambasFirmas ? "Firmado completo" : "Pendiente firmas"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retroceder
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onRetroceder("Pendiente de Aprobación Académica")}>
                  Retroceder a Aprobación Académica
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRetroceder("Pendiente Aprobacion")}>
                  Retroceder a Pendiente Aprobacion
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRetroceder("Preinscripción")}>
                  Retroceder a Preinscripción
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={onSolicitarCorreccion}>
              <XCircle className="mr-2 h-4 w-4" />
              Solicitar Corrección
            </Button>

            <Button onClick={onAprobar} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aprobar y Generar Credenciales
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}