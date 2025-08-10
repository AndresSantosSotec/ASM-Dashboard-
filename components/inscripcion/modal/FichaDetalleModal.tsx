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
import { CheckCircle2, XCircle, Send } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { FichaEstudiante } from "../types"
import { API_BASE_URL } from "@/utils/apiConfig"
import fetchFicha from "@/services/fichas"
import { formatDate } from "@/utils/formatDate"

interface Props {
  ficha: FichaEstudiante
  isOpen: boolean
  onClose: () => void
  onMarcarRevisada: () => void
  onSolicitarCorreccion: () => void
  comentarioRevision: string
  showSuccessMessage: boolean
}

export default function FichaDetalleModal({
  ficha,
  isOpen,
  onClose,
  onMarcarRevisada,
  onSolicitarCorreccion,
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
    ["Taller inducción", formatDate(academicos.tallerInduccion)],
    ["Taller integración", formatDate(academicos.tallerIntegracion)],
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
    ["Departamento", laborales.departamento],
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

  // Carga inicial
  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      try {
        const data = await fetchFicha(ficha.id)
        console.log(
          `[FichaDetalleModal] datos recibidos para prospecto ${ficha.id}:`,
          data,
        )
        if (!data.documentos?.length) {
          console.warn(
            `[FichaDetalleModal] sin documentos. Verificar GET /api/documentos/prospecto/${ficha.id}`,
          )
        }
        if (data.financieros?.convenioId && !data.financieros?.convenioNombre) {
          console.warn(
            `[FichaDetalleModal] convenio ${data.financieros.convenioId} sin nombre. Revisar GET /api/convenios/${data.financieros.convenioId}`,
          )
        }
        if (!data.laborales?.departamento) {
          console.warn(
            "[FichaDetalleModal] departamento no resuelto. El backend debe enviar 'departamento_nombre' o usar /api/ubicacion/{paisId}",
          )
        }
        setPersonales(data.personales || {})
        setLaborales(data.laborales || {})
        setAcademicos(data.academicos || {})
        setFinancieros(data.financieros || {})
        setProgramasInscritos(data.programas || [])
        setDocumentos(data.documentos || [])

        // Leer estado 'revisada' de localStorage
        setIsRevisada(
          localStorage.getItem(`ficha-${ficha.id}-revisada`) === "true"
        )
      } catch (err) {
        console.error("Error al cargar detalle de ficha:", err)
      }
    })()
  }, [isOpen, ficha.id])

  // Marcar como revisada
  const marcarRevisada = () => {
    localStorage.setItem(`ficha-${ficha.id}-revisada`, "true")
    setIsRevisada(true)
    onMarcarRevisada()
  }

  if (!ficha) return null

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
                  <p className="mt-1">{val === null || val === undefined || val === "" ? "—" : val}</p>
                </div>
              ))}
            </TabsContent>

            {/* ACADÉMICOS */}
            <TabsContent value="academicos" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {camposAcademicos.map(([label, val], i) => (
                  <div key={i} className="p-2 border rounded">
                    <Label>{label}</Label>
                    <p className="mt-1">{val === null || val === undefined || val === "" ? "—" : val}</p>
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
                  <p className="mt-1">{val === null || val === undefined || val === "" ? "—" : val}</p>
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
                  <p className="mt-1">{val === null || val === undefined || val === "" ? "—" : val}</p>
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
                        <strong>Inicio:</strong> {formatDate(p.fecha_inicio)} | <strong>Fin:</strong> {formatDate(p.fecha_fin)}
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

            {/* DOCUMENTOS ADJUNTOS */}
            <TabsContent value="documentos" className="mt-4 space-y-4">
              {documentos.length === 0 ? (
                <p>No hay documentos adjuntos.</p>
              ) : (
                documentos.map((d) => (
                  <Card key={d.id} className="p-2 border rounded">
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <p>
                          <strong>{d.nombre}</strong>
                        </p>
                        <p className="text-sm capitalize">
                          {d.estado || (d.url ? "cargado" : "pendiente")}
                        </p>
                      </div>
                      {d.url ? (
                        <a
                          href={d.url || `${API_BASE_URL}/api/documentos/${d.id}/file`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm underline"
                        >
                          Ver/Descargar
                        </a>
                      ) : null}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* FOOTER */}
        <div className="border-t px-4 py-4 space-y-4">
          <div className="flex justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="text-green-600" />
              <span>{isRevisada ? "Revisada" : "Pendiente de revisión"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="text-red-600" />
              <span>{programasInscritos.length + documentos.length} campos</span>
            </div>
          </div>

          {/* Comentario de revisión */}
          <div>
            <Label>Comentario de Revisión</Label>
            <Textarea
              readOnly={!correctionMode}
              value={comentarioRevision}
              className="h-24 bg-gray-100"
            />
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCorrectionMode(true)
                onSolicitarCorreccion()
              }}
              disabled={correctionMode}
            >
              <Send className="mr-1" /> Solicitar Corrección
            </Button>
            <Button onClick={marcarRevisada} disabled={isRevisada}>
              <CheckCircle2 className="mr-1" />{" "}
              {isRevisada ? "Revisada" : "Marcar como Revisada"}
            </Button>
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
