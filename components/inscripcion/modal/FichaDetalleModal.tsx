// components/inscripcion/FichaDetalleModal.tsx
"use client"

import React, { useState, useEffect } from "react"

// Función para formatear fechas ISO a dd-mm-aaaa
function formatFecha(fecha: string) {
  if (!fecha) return "—"
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return fecha // Si no es fecha válida, mostrar original
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = String(d.getFullYear())
  return `${day}-${month}-${year}`
}
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
    ["Fecha Nac.", formatFecha(personales.fechaNacimiento)],

    ["Dirección", personales.direccion],
  ]

  const camposAcademicos: [string, any][] = [
    ["Modalidad", academicos.modalidad],
    ["Inicio específico", formatFecha(academicos.fechaInicioEspecifica)],
    ["Taller inducción", formatFecha(academicos.fechaTallerInduccion)],
    ["Taller integración", formatFecha(academicos.fechaTallerIntegracion)],
    ["Institución anterior", academicos.institucionAnterior],
    ["Año graduación", academicos.añoGraduacion],
    ["Medio conoció", academicos.medioConocio],
    ["Cursos aprobados", academicos.cursosAprobados],
    ["Día de estudio", academicos.diaEstudio],
  ]

  // Catálogo de departamentos según el orden proporcionado (1-indexado)
  const departamentos = [
    "Alta Verapaz",
    "Baja Verapaz",
    "Chimaltenango",
    "Chiquimula",
    "El Progreso",
    "Escuintla",
    "Guatemala",
    "Huehuetenango",
    "Izabal",
    "Jalapa",
    "Jutiapa",
    "Petén",
    "Quetzaltenango",
    "Quiché",
    "Retalhuleu",
    "Sacatepéquez",
    "San Marcos",
    "Santa Rosa",
    "Sololá",
    "Suchitepéquez",
    "Totonicapán",
    "Zacapa"
  ];

  function getNombreDepartamento(id: string | number) {
    const idx = Number(id) - 1;
    if (idx >= 0 && idx < departamentos.length) return departamentos[idx];
    return id;
  }

  const camposLaborales: [string, any][] = [
    ["Empresa", laborales.empresa],
    ["Puesto", laborales.puesto],
    ["Teléfono corp.", laborales.telefonoCorporativo],
    ["Departamento", getNombreDepartamento(laborales.departamento)],
    ["Dirección empresa", laborales.direccionEmpresa],
  ]

  const camposFinancieros: [string, any][] = [
    ["Método de pago", financieros.formaPago],

    [
      "Convenio",
      financieros.convenio || "—"
    ],
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

        const json = await resFicha.json()

        setPersonales(json.personales)
        setLaborales(json.laborales)
        setAcademicos(json.academicos)
        setFinancieros(json.financieros)
        setProgramasInscritos(json.programas ?? [])

        // Primero intentamos con los documentos de la ficha
        let docs: any[] = [];
        if (Array.isArray(json)) {
          docs = json;
        } else if (Array.isArray(json.documentos)) {
          docs = json.documentos;
        }

        // Si no hay documentos, buscar en /api/documentos y filtrar por estudiante
        if (!docs || docs.length === 0) {
          const resDocs = await fetch(`${API_BASE_URL}/api/documentos`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (resDocs.ok) {
            const allDocs = await resDocs.json();
            // Filtrar por id de prospecto o ficha
            const idEstudiante = ficha.id || ficha.prospecto?.id;
            docs = allDocs.filter((d: any) => {
              // Puede ser d.prospecto?.id o d.ficha_id o d.estudiante_id según API
              return (
                d.prospecto?.id === idEstudiante ||
                d.ficha_id === idEstudiante ||
                d.estudiante_id === idEstudiante
              );
            });
          }
        }
        setDocumentos(docs || []);


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

                programasInscritos.map((p) => {
                  const meta = catalogoProgramas.find((c) => c.id === p.programa_id)
                  return (
                    <Card key={p.id} className="p-2 border rounded">
                      <CardContent className="space-y-1">
                        <p>
                          <strong>
                            {meta?.abreviatura} – {meta?.nombre_del_programa}
                          </strong>
                        </p>
                        <p>
                          <strong>Inicio:</strong> {formatFecha(p.fecha_inicio)} |{" "}
                          <strong>Fin:</strong> {formatFecha(p.fecha_fin)}
                        </p>
                        <p>
                          <strong>Duración:</strong> {p.duracion_meses} meses
                        </p>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            {/* DOCUMENTOS ADJUNTOS */}
            <TabsContent value="documentos" className="mt-4 space-y-4">
              {documentos.length === 0 ? (
                <p>No hay documentos adjuntos.</p>
              ) : (

                // Agrupar documentos por tipo_documento y mostrar solo el más reciente de cada tipo
                Object.values(
                  documentos.reduce((acc, doc) => {
                    const tipo = doc.tipo_documento;
                    // Si ya hay uno de este tipo, comparar fechas y dejar el más reciente
                    if (!acc[tipo] || new Date(doc.subida_at) > new Date(acc[tipo].subida_at)) {
                      acc[tipo] = doc;
                    }
                    return acc;
                  }, {} as Record<string, any>)
                ).map((doc: any, idx) => {
                  const url = doc.url || `${API_BASE_URL}/storage/${doc.ruta_archivo}`;
                  return (
                    <Card key={doc.id + '-' + doc.tipo_documento} className="p-2 border rounded">
                      <CardContent className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold capitalize">{doc.tipo_documento}</span>
                          <span className={`text-xs rounded px-2 py-0.5 ${doc.estado === 'aprobado' ? 'bg-green-100 text-green-700' : doc.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{doc.estado}</span>
                        </div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm underline"
                        >

                          Ver Documento
                        </a>
                        <div className="text-xs text-muted-foreground">Subido: {formatFecha(doc.subida_at)}</div>
                      </CardContent>
                    </Card>
                  );
                })
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
