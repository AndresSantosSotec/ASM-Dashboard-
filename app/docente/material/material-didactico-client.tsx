"use client"

import {
  Search,
  Filter,
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle,
  Clock,
  File,
  LinkIcon,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DocenteHeader } from "@/components/docente/docente-header"
import { SubirMaterialModal } from "@/components/docente/subir-material-modal"
import { useState } from "react"
import { EnviarMoodleModal } from "@/components/docente/enviar-moodle-modal"

// Datos de ejemplo
const materiales = [
  {
    id: 1,
    nombre: "Introducción a la Metodología de Investigación",
    tipo: "PDF",
    curso: "Metodología de la Investigación",
    tema: "Unidad 1: Fundamentos",
    semana: "Semana 1",
    fechaSubida: "2023-10-15",
    estado: "Publicado",
    url: "#",
  },
  {
    id: 2,
    nombre: "Presentación: Métodos Cualitativos",
    tipo: "PPT",
    curso: "Metodología de la Investigación",
    tema: "Unidad 2: Métodos",
    semana: "Semana 2",
    fechaSubida: "2023-10-20",
    estado: "Publicado",
    url: "#",
  },
  {
    id: 3,
    nombre: "Video: Técnicas de Entrevista",
    tipo: "Video",
    curso: "Metodología de la Investigación",
    tema: "Unidad 3: Técnicas",
    semana: "Semana 3",
    fechaSubida: "2023-10-25",
    estado: "En revisión",
    url: "#",
  },
  {
    id: 4,
    nombre: "Ejercicios Prácticos",
    tipo: "PDF",
    curso: "Estadística Aplicada",
    tema: "Unidad 1: Estadística Descriptiva",
    semana: "Semana 1",
    fechaSubida: "2023-09-10",
    estado: "Publicado",
    url: "#",
  },
  {
    id: 5,
    nombre: "Recursos adicionales: Artículos científicos",
    tipo: "URL",
    curso: "Metodología de la Investigación",
    tema: "Recursos Complementarios",
    semana: "Semana 4",
    fechaSubida: "2023-10-30",
    estado: "Publicado",
    url: "https://ejemplo.com/recursos",
  },
]

const invitaciones = [
  {
    id: 1,
    curso: "Análisis de Datos con Python",
    fechaInicio: "2024-01-15",
    fechaFin: "2024-03-30",
    estado: "Pendiente",
    tipo: "Regular",
  },
  {
    id: 2,
    curso: "Taller de Redacción Científica Avanzada",
    fechaInicio: "2023-12-05",
    fechaFin: "2023-12-15",
    estado: "Aceptada",
    tipo: "Educación Continua",
  },
]

export default function MaterialDidacticoClient() {
  const [modalOpen, setModalOpen] = useState(false)
  const [moodleModalOpen, setMoodleModalOpen] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<any[]>([])

  return (
    <div className="container py-6">
      <DocenteHeader />
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Material Didáctico</h1>
            <p className="text-muted-foreground">Gestiona el material de estudio para tus cursos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setMoodleModalOpen(true)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Enviar a Moodle
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Subir Material
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Materiales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{materiales.length}</div>
              <p className="text-xs text-muted-foreground">Archivos y recursos subidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Materiales Publicados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {materiales.filter((material) => material.estado === "Publicado").length}
              </div>
              <p className="text-xs text-muted-foreground">Disponibles para estudiantes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Invitaciones a Cursos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invitaciones.filter((inv) => inv.estado === "Pendiente").length}
              </div>
              <p className="text-xs text-muted-foreground">Pendientes de respuesta</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="materiales" className="w-full">
          <TabsList className="grid grid-cols-2 w-full md:w-auto">
            <TabsTrigger value="materiales">Materiales</TabsTrigger>
            <TabsTrigger value="invitaciones">Invitaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="materiales" className="mt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Buscar por nombre o curso..." className="pl-8" />
              </div>
              <div className="flex gap-2">
                <Select defaultValue="todos">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los cursos</SelectItem>
                    <SelectItem value="metodologia">Metodología de la Investigación</SelectItem>
                    <SelectItem value="estadistica">Estadística Aplicada</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="todas">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por semana" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las semanas</SelectItem>
                    <SelectItem value="semana1">Semana 1</SelectItem>
                    <SelectItem value="semana2">Semana 2</SelectItem>
                    <SelectItem value="semana3">Semana 3</SelectItem>
                    <SelectItem value="semana4">Semana 4</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Nombre</th>
                      <th className="h-10 px-4 text-left font-medium">Tipo</th>
                      <th className="h-10 px-4 text-left font-medium">Curso / Tema</th>
                      <th className="h-10 px-4 text-left font-medium">Semana</th>
                      <th className="h-10 px-4 text-left font-medium">Fecha</th>
                      <th className="h-10 px-4 text-left font-medium">Estado</th>
                      <th className="h-10 px-4 text-left font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiales.map((material) => (
                      <tr key={material.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          <div className="flex items-center">
                            {material.tipo === "PDF" ? (
                              <FileText className="mr-2 h-4 w-4 text-red-500" />
                            ) : material.tipo === "PPT" ? (
                              <File className="mr-2 h-4 w-4 text-orange-500" />
                            ) : material.tipo === "Video" ? (
                              <File className="mr-2 h-4 w-4 text-blue-500" />
                            ) : (
                              <LinkIcon className="mr-2 h-4 w-4 text-green-500" />
                            )}
                            <span className="font-medium">{material.nombre}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant="outline">{material.tipo}</Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <div>
                            <div className="font-medium">{material.curso}</div>
                            <div className="text-xs text-muted-foreground">{material.tema}</div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant="secondary">{material.semana}</Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="text-xs">{material.fechaSubida}</div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center">
                            {material.estado === "Publicado" ? (
                              <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="mr-1 h-4 w-4 text-yellow-500" />
                            )}
                            <span className={material.estado === "Publicado" ? "text-green-500" : "text-yellow-500"}>
                              {material.estado}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" title="Ver material">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Descargar">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Enviar a Moodle"
                              onClick={() => {
                                setSelectedMaterials([material])
                                setMoodleModalOpen(true)
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invitaciones" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Invitaciones a Impartir Cursos</CardTitle>
                <CardDescription>Gestiona las invitaciones para impartir nuevos cursos o actividades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invitaciones.map((invitacion) => (
                    <div
                      key={invitacion.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{invitacion.curso}</h4>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mt-1">
                          <Badge variant={invitacion.tipo === "Regular" ? "outline" : "secondary"}>
                            {invitacion.tipo}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {invitacion.fechaInicio} al {invitacion.fechaFin}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 md:mt-0">
                        <Badge
                          variant={
                            invitacion.estado === "Pendiente"
                              ? "outline"
                              : invitacion.estado === "Aceptada"
                                ? "success"
                                : "destructive"
                          }
                        >
                          {invitacion.estado}
                        </Badge>
                        {invitacion.estado === "Pendiente" && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Rechazar
                            </Button>
                            <Button size="sm">Aceptar</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <SubirMaterialModal open={modalOpen} onOpenChange={setModalOpen} />
      <EnviarMoodleModal
        open={moodleModalOpen}
        onOpenChange={setMoodleModalOpen}
        selectedMaterials={selectedMaterials}
        allMaterials={materiales}
      />
    </div>
  )
}

