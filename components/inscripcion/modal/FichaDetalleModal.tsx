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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FichaEstudiante } from "../types"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Send } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  ficha: FichaEstudiante
  isOpen: boolean
  onClose: () => void
  onMarcarRevisada: () => void
  onSolicitarCorreccion: () => void
  comentarioRevision: string
  setComentarioRevision: (text: string) => void
  camposValidados: Record<string, boolean>
  handleToggleValidacion: (campo: string, valor: boolean) => void
  showSuccessMessage: boolean
}

export default function FichaDetalleModal({
  ficha,
  isOpen,
  onClose,
  onMarcarRevisada,
  onSolicitarCorreccion,
  comentarioRevision,
  setComentarioRevision,
  camposValidados,
  handleToggleValidacion,
  showSuccessMessage,
}: Props) {
  // Estados para datos detallados
  const [personales, setPersonales] = useState<any>({})
  const [laborales, setLaborales] = useState<any>({})
  const [academicos, setAcademicos] = useState<any>({})
  const [financieros, setFinancieros] = useState<any>({})
  const [programas, setProgramas] = useState<any[]>([])
  const [documentos, setDocumentos] = useState<any[]>([])

  // Al abrir, cargar datos con logs para depuración
  useEffect(() => {
    if (!isOpen) return
    const fetchDetalle = async () => {
      try {
        const token = localStorage.getItem("token")
        console.log(`⇨ fetchDetalle — GET /api/fichas/${ficha.id}`)
        const res = await fetch(`http://localhost:8000/api/fichas/${ficha.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        console.log("⇨ fetchDetalle — status:", res.status, res.statusText)
        const text = await res.text()
        console.log("⇨ fetchDetalle — cuerpo bruto:", text)
        const json = JSON.parse(text)
        console.log("⇨ fetchDetalle — JSON parseado:", json)
        setPersonales(json.personales)
        setLaborales(json.laborales)
        setAcademicos(json.academicos)
        setFinancieros(json.financieros)
        setProgramas(json.programas)
        setDocumentos(json.documentos || [])
      } catch (err) {
        console.error("❌ fetchDetalle — ERROR", err)
      }
    }
    fetchDetalle()
  }, [isOpen, ficha.id])

  if (!ficha) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Ficha de Inscripción - {ficha.id}</DialogTitle>
          <DialogDescription>
            Detalles de la ficha de inscripción de {personales.nombre || ficha.nombre}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="personales" className="mt-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="personales">Datos Personales</TabsTrigger>
            <TabsTrigger value="academicos">Datos Académicos</TabsTrigger>
            <TabsTrigger value="laborales">Datos Laborales</TabsTrigger>
            <TabsTrigger value="financieros">Datos Financieros</TabsTrigger>
          </TabsList>

          {/* Reemplaza estos con tu contenido detallado */}
          <TabsContent value="personales" className="p-4">
            {/* Campos personales en modo solo lectura */}
          </TabsContent>
          <TabsContent value="academicos" className="p-4">
            {/* Campos académicos */}
          </TabsContent>
          <TabsContent value="laborales" className="p-4">
            {/* Campos laborales */}
          </TabsContent>
          <TabsContent value="financieros" className="p-4">
            {/* Campos financieros */}
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex flex-col space-y-3">
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>
                  Validados: {Object.values(camposValidados).filter(Boolean).length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>Pendientes: {ficha.camposIncompletos?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentario-revision">Comentario de Revisión</Label>
            <Textarea
              id="comentario-revision"
              readOnly
              value={comentarioRevision}
              className="h-24 bg-gray-100"
            />
          </div>

          {showSuccessMessage && (
            <div className="bg-green-50 p-3 rounded-md">
              <p className="flex items-center text-green-600">
                <CheckCircle2 className="mr-2" /> Acción realizada con éxito
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onSolicitarCorreccion}>
              <Send className="mr-2" /> Solicitar Corrección
            </Button>
            <Button onClick={onMarcarRevisada}>
              <CheckCircle2 className="mr-2" /> Marcar como Revisada
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
