"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Video, FileImage, Link, Plus, X, Check, AlertCircle, Info } from "lucide-react"

interface SubirMaterialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type MaterialType = "documento" | "video" | "imagen" | "enlace" | "otro"

interface MaterialItem {
  id: string
  nombre: string
  tipo: MaterialType
  descripcion: string
  archivo?: File
  url?: string
  seccion: string
}

const tiposMaterial = [
  { value: "documento", label: "Documento", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "imagen", label: "Imagen", icon: FileImage },
  { value: "enlace", label: "Enlace", icon: Link },
  { value: "otro", label: "Otro", icon: FileText },
]

const secciones = [
  { value: "teoria", label: "Material Teórico" },
  { value: "practica", label: "Ejercicios Prácticos" },
  { value: "evaluacion", label: "Evaluación" },
  { value: "complementario", label: "Material Complementario" },
]

export function SubirMaterialModal({ open, onOpenChange }: SubirMaterialModalProps) {
  const [activeTab, setActiveTab] = useState("semana1")
  const [tipoMaterial, setTipoMaterial] = useState<MaterialType>("documento")
  const [seccionSeleccionada, setSeccionSeleccionada] = useState("teoria")
  const [nombreMaterial, setNombreMaterial] = useState("")
  const [descripcionMaterial, setDescripcionMaterial] = useState("")
  const [urlMaterial, setUrlMaterial] = useState("")
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [materialesPorSemana, setMaterialesPorSemana] = useState<Record<string, MaterialItem[]>>({
    semana1: [],
    semana2: [],
    semana3: [],
    semana4: [],
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoSeleccionado(e.target.files[0])
    }
  }

  const agregarMaterial = () => {
    if (!nombreMaterial) return

    const nuevoMaterial: MaterialItem = {
      id: Date.now().toString(),
      nombre: nombreMaterial,
      tipo: tipoMaterial,
      descripcion: descripcionMaterial,
      seccion: seccionSeleccionada,
    }

    if (tipoMaterial === "enlace") {
      nuevoMaterial.url = urlMaterial
    } else if (archivoSeleccionado) {
      nuevoMaterial.archivo = archivoSeleccionado
    }

    setMaterialesPorSemana((prev) => ({
      ...prev,
      [activeTab]: [...prev[activeTab], nuevoMaterial],
    }))

    // Limpiar formulario
    setNombreMaterial("")
    setDescripcionMaterial("")
    setUrlMaterial("")
    setArchivoSeleccionado(null)
    setTipoMaterial("documento")
    setSeccionSeleccionada("teoria")
  }

  const eliminarMaterial = (semana: string, id: string) => {
    setMaterialesPorSemana((prev) => ({
      ...prev,
      [semana]: prev[semana].filter((item) => item.id !== id),
    }))
  }

  const guardarTodo = () => {
    // Aquí iría la lógica para guardar todos los materiales
    console.log("Materiales a guardar:", materialesPorSemana)
    onOpenChange(false)
  }

  const getIconForType = (tipo: MaterialType) => {
    const found = tiposMaterial.find((t) => t.value === tipo)
    const IconComponent = found?.icon || FileText
    return <IconComponent className="h-4 w-4" />
  }

  const totalMateriales = Object.values(materialesPorSemana).reduce((total, materiales) => total + materiales.length, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Subir Material Didáctico</DialogTitle>
          <DialogDescription>
            Organiza y sube el material didáctico por semanas y secciones para tus cursos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="semana1" value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid grid-cols-4 w-[400px]">
                <TabsTrigger value="semana1">Semana 1</TabsTrigger>
                <TabsTrigger value="semana2">Semana 2</TabsTrigger>
                <TabsTrigger value="semana3">Semana 3</TabsTrigger>
                <TabsTrigger value="semana4">Semana 4</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="ml-2">
                  {totalMateriales} materiales en total
                </Badge>
              </div>
            </div>

            {["semana1", "semana2", "semana3", "semana4"].map((semana) => (
              <TabsContent key={semana} value={semana} className="h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  {/* Formulario para agregar material */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Agregar Material</CardTitle>
                      <CardDescription>
                        Completa el formulario para agregar material a la {semana.replace("semana", "Semana ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre-material">Nombre del material</Label>
                        <Input
                          id="nombre-material"
                          placeholder="Ej: Introducción a la metodología"
                          value={nombreMaterial}
                          onChange={(e) => setNombreMaterial(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tipo-material">Tipo de material</Label>
                        <Select value={tipoMaterial} onValueChange={(value) => setTipoMaterial(value as MaterialType)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo de material" />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposMaterial.map((tipo) => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                <div className="flex items-center">
                                  <tipo.icon className="mr-2 h-4 w-4" />
                                  {tipo.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="seccion-material">Sección</Label>
                        <Select value={seccionSeleccionada} onValueChange={setSeccionSeleccionada}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la sección" />
                          </SelectTrigger>
                          <SelectContent>
                            {secciones.map((seccion) => (
                              <SelectItem key={seccion.value} value={seccion.value}>
                                {seccion.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {tipoMaterial === "enlace" ? (
                        <div className="space-y-2">
                          <Label htmlFor="url-material">URL del recurso</Label>
                          <Input
                            id="url-material"
                            placeholder="https://ejemplo.com/recurso"
                            value={urlMaterial}
                            onChange={(e) => setUrlMaterial(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="archivo-material">Archivo</Label>
                          <div className="flex items-center gap-2">
                            <Input id="archivo-material" type="file" onChange={handleFileChange} className="flex-1" />
                            {archivoSeleccionado && (
                              <Badge variant="outline" className="gap-1">
                                {archivoSeleccionado.name.slice(0, 15)}...
                                <X className="h-3 w-3 cursor-pointer" onClick={() => setArchivoSeleccionado(null)} />
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="descripcion-material">Descripción</Label>
                        <Textarea
                          id="descripcion-material"
                          placeholder="Describe brevemente este material..."
                          value={descripcionMaterial}
                          onChange={(e) => setDescripcionMaterial(e.target.value)}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={agregarMaterial}
                        disabled={!nombreMaterial || (tipoMaterial !== "enlace" && !archivoSeleccionado)}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar a {semana.replace("semana", "Semana ")}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Lista de materiales agregados */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Materiales de {semana.replace("semana", "Semana ")}</CardTitle>
                      <CardDescription>
                        {materialesPorSemana[semana].length > 0
                          ? `${materialesPorSemana[semana].length} materiales agregados`
                          : "No hay materiales agregados aún"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[350px] pr-4">
                        {materialesPorSemana[semana].length > 0 ? (
                          <Accordion type="multiple" className="w-full">
                            {secciones.map((seccion) => {
                              const materialesSeccion = materialesPorSemana[semana].filter(
                                (m) => m.seccion === seccion.value,
                              )

                              if (materialesSeccion.length === 0) return null

                              return (
                                <AccordionItem key={seccion.value} value={seccion.value}>
                                  <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center">
                                      <span>{seccion.label}</span>
                                      <Badge variant="secondary" className="ml-2">
                                        {materialesSeccion.length}
                                      </Badge>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-2">
                                      {materialesSeccion.map((material) => (
                                        <div
                                          key={material.id}
                                          className="flex items-center justify-between p-2 rounded-md border"
                                        >
                                          <div className="flex items-center gap-2">
                                            {getIconForType(material.tipo)}
                                            <div>
                                              <p className="font-medium text-sm">{material.nombre}</p>
                                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {material.descripcion || "Sin descripción"}
                                              </p>
                                            </div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => eliminarMaterial(semana, material.id)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              )
                            })}
                          </Accordion>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <Info className="h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">
                              Agrega materiales utilizando el formulario de la izquierda
                            </p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <Separator className="my-4" />

        <DialogFooter className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="text-xs text-muted-foreground">
              Los materiales se guardarán en el servidor al hacer clic en Guardar
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarTodo} disabled={totalMateriales === 0}>
              <Check className="mr-2 h-4 w-4" />
              Guardar Todo
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

