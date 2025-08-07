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

import { ProspectoDetalle } from "@/types/prospecto"
import { API_BASE_URL } from "@/utils/apiConfig"

interface Props {
  ficha: ProspectoDetalle
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
  const cuotaMensual = ficha.paymentPlans?.length
    ? (
        parseFloat(ficha.monto_inscripcion ?? "0") /
        ficha.paymentPlans.length
      ).toFixed(2)
    : ficha.monto_inscripcion

  const camposPersonales: [string, any][] = [
    ["Nombre completo", ficha.nombre_completo],
    ["País origen", ficha.pais_origen],
    ["País residencia", ficha.pais_residencia],
    ["Teléfono", ficha.telefono],
    ["Correo electrónico", ficha.correo_electronico],
    ["Dirección", ficha.direccion_residencia],
    ["Departamento", ficha.departamento?.nombre],
    ["Municipio", ficha.municipio?.nombre],
  ]

  const programa = ficha.programas[0]
  const camposAcademicos: [string, any][] = programa
    ? [
        ["Programa", programa.programa.nombre],
        ["Modalidad", programa.modalidad],
        ["Inicio específico", programa.fecha_inicio_especifica],
        ["Año graduación", programa.anio_graduacion],
        ["Cursos aprobados", programa.cantidad_cursos_aprobados],
        ["Día de estudio", programa.dia_estudio],
      ]
    : []

  const camposLaborales: [string, any][] = [
    ["Empresa", ficha.empresa_donde_labora_actualmente],
    ["Puesto", ficha.puesto],
    ["Teléfono corp.", ficha.telefono_corporativo],
    ["Dirección empresa", ficha.direccion_empresa],
  ]

  const camposFinancieros: [string, any][] = [
    ["Método de pago", ficha.metodo_pago],
    ["Inscripción", ficha.monto_inscripcion],
    ["Cuota mensual", cuotaMensual],
    ["Convenio", ficha.convenio?.nombre],
  ]

  const programasInscritos = ficha.courses ?? []
  const documentos = (ficha.documentos ?? []).map(d => ({
    id: d.id,
    nombre: d.tipo_documento,
    url: `${API_BASE_URL}/storage/${d.ruta_archivo}`,
  }))

  // Estados de UI
  const [isRevisada, setIsRevisada] = useState(false)
  const [correctionMode, setCorrectionMode] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsRevisada(localStorage.getItem(`ficha-${ficha.id}-revisada`) === 'true')
    }
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
            {ficha.nombre_completo}
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
                  <p className="mt-1">{val ?? "—"}</p>
                </div>
              ))}
            </TabsContent>

            {/* ACADÉMICOS */}
            <TabsContent value="academicos" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {camposAcademicos.map(([label, val], i) => (
                  <div key={i} className="p-2 border rounded">
                    <Label>{label}</Label>
                    <p className="mt-1">{val ?? "—"}</p>
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
                  <p className="mt-1">{val ?? "—"}</p>
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
                  <p className="mt-1">{val ?? "—"}</p>
                </div>
              ))}
            </TabsContent>

            {/* PROGRAMAS INSCRITOS */}
            <TabsContent value="programas" className="mt-4 space-y-4">
              {programasInscritos.length === 0 ? (
                <p>Sin programas inscritos.</p>
              ) : (
                programasInscritos.map(p => (
                  <Card key={p.id} className="p-2 border rounded">
                    <CardContent className="space-y-1">
                      <p>{p.fullname}</p>
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
                    <CardContent className="space-y-1">
                      <p>
                        <strong>{d.nombre}</strong>
                      </p>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm underline"
                      >
                        Ver archivo
                      </a>
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
