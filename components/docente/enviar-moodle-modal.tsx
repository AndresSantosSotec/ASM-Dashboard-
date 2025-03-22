"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ExternalLink, AlertCircle, Info, FileText, Video, File, LinkIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface EnviarMoodleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedMaterials?: any[] // Tipo más específico según tus datos
  allMaterials?: any[] // Todos los materiales disponibles
}

export function EnviarMoodleModal({
  open,
  onOpenChange,
  selectedMaterials = [],
  allMaterials = [],
}: EnviarMoodleModalProps) {
  const [cursoMoodle, setCursoMoodle] = useState("")
  const [seccionMoodle, setSeccionMoodle] = useState("")
  const [tipoRecurso, setTipoRecurso] = useState("archivo")
  const [visibilidad, setVisibilidad] = useState("visible")
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<number[]>(
    selectedMaterials.length > 0 ? selectedMaterials.map((m) => m.id) : [],
  )

  // Datos de ejemplo para los cursos en Moodle
  const cursosMoodle = [
    { id: "curso1", nombre: "Metodología de la Investigación (2023-2)" },
    { id: "curso2", nombre: "Estadística Aplicada (2023-2)" },
    { id: "curso3", nombre: "Análisis de Datos con Python (2024-1)" },
  ]

  // Datos de ejemplo para las secciones de un curso
  const seccionesMoodle = [
    { id: "seccion1", nombre: "Tema 1: Introducción" },
    { id: "seccion2", nombre: "Tema 2: Fundamentos" },
    { id: "seccion3", nombre: "Tema 3: Aplicaciones" },
    { id: "seccion4", nombre: "Tema 4: Evaluación" },
  ]

  // Si no hay materiales seleccionados específicamente, usar todos los disponibles
  const materialesDisponibles = selectedMaterials.length > 0 ? selectedMaterials : allMaterials

  const toggleMaterialSelection = (id: number) => {
    setMaterialesSeleccionados((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]))
  }

  const selectAllMaterials = () => {
    setMaterialesSeleccionados(materialesDisponibles.map((m) => m.id))
  }

  const deselectAllMaterials = () => {
    setMaterialesSeleccionados([])
  }

  const handleEnviar = () => {
    // Aquí iría la lógica para enviar los materiales a Moodle
    console.log("Enviando a Moodle:", {
      cursoMoodle,
      seccionMoodle,
      tipoRecurso,
      visibilidad,
      materiales: materialesDisponibles.filter((m) => materialesSeleccionados.includes(m.id)),
    })
    onOpenChange(false)
  }

  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case "PDF":
        return <FileText className="h-4 w-4 text-red-500" />
      case "PPT":
        return <File className="h-4 w-4 text-orange-500" />
      case "Video":
        return <Video className="h-4 w-4 text-blue-500" />
      case "URL":
        return <LinkIcon className="h-4 w-4 text-green-500" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Enviar Material a Moodle</DialogTitle>
          <DialogDescription>
            Selecciona los materiales y configura cómo deseas enviarlos a la plataforma Moodle.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna izquierda: Configuración */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="curso-moodle">Curso en Moodle</Label>
              <Select value={cursoMoodle} onValueChange={setCursoMoodle}>
                <SelectTrigger id="curso-moodle">
                  <SelectValue placeholder="Selecciona un curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursosMoodle.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id}>
                      {curso.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seccion-moodle">Sección del curso</Label>
              <Select value={seccionMoodle} onValueChange={setSeccionMoodle} disabled={!cursoMoodle}>
                <SelectTrigger id="seccion-moodle">
                  <SelectValue placeholder="Selecciona una sección" />
                </SelectTrigger>
                <SelectContent>
                  {seccionesMoodle.map((seccion) => (
                    <SelectItem key={seccion.id} value={seccion.id}>
                      {seccion.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de recurso en Moodle</Label>
              <RadioGroup value={tipoRecurso} onValueChange={setTipoRecurso} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="archivo" id="recurso-archivo" />
                  <Label htmlFor="recurso-archivo" className="cursor-pointer">
                    Archivo individual (por cada material)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="carpeta" id="recurso-carpeta" />
                  <Label htmlFor="recurso-carpeta" className="cursor-pointer">
                    Carpeta (agrupar todos los materiales)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="recurso-url" />
                  <Label htmlFor="recurso-url" className="cursor-pointer">
                    URL (para enlaces externos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Visibilidad para estudiantes</Label>
              <RadioGroup value={visibilidad} onValueChange={setVisibilidad} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visible" id="visibilidad-visible" />
                  <Label htmlFor="visibilidad-visible" className="cursor-pointer">
                    Visible inmediatamente
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oculto" id="visibilidad-oculto" />
                  <Label htmlFor="visibilidad-oculto" className="cursor-pointer">
                    Oculto (mostrar manualmente después)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="programado" id="visibilidad-programado" />
                  <Label htmlFor="visibilidad-programado" className="cursor-pointer">
                    Programar disponibilidad
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Columna derecha: Selección de materiales */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Materiales a enviar</Label>
              <div className="flex items-center gap-2 text-xs">
                <Button variant="outline" size="sm" onClick={selectAllMaterials}>
                  Seleccionar todos
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllMaterials}>
                  Deseleccionar
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[300px] border rounded-md p-2">
              {materialesDisponibles.length > 0 ? (
                <div className="space-y-2">
                  {materialesDisponibles.map((material) => (
                    <div key={material.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                      <Checkbox
                        id={`material-${material.id}`}
                        checked={materialesSeleccionados.includes(material.id)}
                        onCheckedChange={() => toggleMaterialSelection(material.id)}
                      />
                      <div className="flex items-center flex-1 min-w-0">
                        {getIconForType(material.tipo)}
                        <div className="ml-2 truncate">
                          <p className="text-sm font-medium truncate">{material.nombre}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {material.tipo}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {material.semana}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Info className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No hay materiales disponibles para enviar</p>
                </div>
              )}
            </ScrollArea>

            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <Info className="h-4 w-4 mr-1" />
              <span>
                {materialesSeleccionados.length} de {materialesDisponibles.length} materiales seleccionados
              </span>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <DialogFooter className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="text-xs text-muted-foreground">
              Los materiales se enviarán a Moodle y estarán disponibles según la configuración elegida
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEnviar}
              disabled={!cursoMoodle || !seccionMoodle || materialesSeleccionados.length === 0}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Enviar a Moodle
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

