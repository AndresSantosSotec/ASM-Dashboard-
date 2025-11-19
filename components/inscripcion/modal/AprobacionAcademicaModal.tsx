// components/inscripcion/modal/AprobacionAcademicaModal.tsx
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

export default function AprobacionAcademicaModal({
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

  // Campos para mostrar - énfasis en académicos
  const camposAcademicos: [string, any][] = [
    ["Modalidad", academicos.modalidad],
    ["Inicio específico", formatDate(academicos.fechaInicioEspecifica)],
    ["Taller inducción", formatDate(academicos.fechaTallerInduccion)],
    ["Taller integración", formatDate(academicos.fechaTallerIntegracion)],
    ["Institución anterior", academicos.institucionAnterior],
    ["Año graduación", academicos.añoGraduacion],
    ["Medio conoció", academicos.medioConocio],
    ["Cursos aprobados", academicos.cursosAprobados],
    ["Día de estudio", academicos.diaEstudio],
  ]

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
        const latestByType = dedupeLatestByType(merged)

        setPersonales(data.personales || {})
        setLaborales(data.laborales || {})
        setAcademicos(data.academicos || {})
        setFinancieros(data.financieros || {})
        setProgramasInscritos(data.programas || [])
        setDocumentos(latestByType)
      } catch (err) {
        console.error("Error al cargar detalle de ficha académica:", err)
      }
    })()
  }, [isOpen, ficha.id])

  const handleDescargarPDF = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/prospectos/${ficha.id}/ficha-pdf`, {
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
            <span>Aprobación Académica - Ficha #{ficha.id}</span>
            <Button variant="outline" size="sm" onClick={handleDescargarPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </DialogTitle>
          <DialogDescription>
            {personales.nombre || ficha.nombre} - Revisión académica final
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-4 py-2">
          <Tabs defaultValue="academicos">
            <TabsList className="flex space-x-2 overflow-x-auto">
              <TabsTrigger value="academicos">Académicos</TabsTrigger>
              <TabsTrigger value="programas">Programas</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="financieros">Financieros</TabsTrigger>
              <TabsTrigger value="personales">Personales</TabsTrigger>
              <TabsTrigger value="laborales">Laborales</TabsTrigger>
            </TabsList>

            {/* ACADÉMICOS - Tab Principal */}
            <TabsContent value="academicos" className="mt-4 space-y-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Información Académica</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {camposAcademicos.map(([label, val], i) => (
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
                        <strong>Modalidad:</strong> {academicos.modalidad ?? "—"}
                      </p>
                      <p>
                        <strong>Día de estudio:</strong> {academicos.diaEstudio ?? "—"}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
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
          </Tabs>
        </div>

        {/* FOOTER - Acciones */}
        <div className="border-t px-4 py-4 space-y-4">
          <div className="flex justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retroceder
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onRetroceder("Pendiente de Aprobación Financiera")}>
                  Retroceder a Aprobación Financiera
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRetroceder("Pendiente de Aprobación")}>
                  Retroceder a Pendiente de Aprobación
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
              Aprobar e Inscribir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
