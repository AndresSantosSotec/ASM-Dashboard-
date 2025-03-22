import type { Metadata } from "next"
import { Search, Filter, FileText, Upload, BookOpen, Eye, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Mis Cursos | Portal Docente",
  description: "Gestión de cursos asignados para docentes",
}

// Datos de ejemplo
const cursos = [
  {
    id: 1,
    nombre: "Metodología de la Investigación",
    codigo: "MI-2023",
    fechaInicio: "2023-09-01",
    fechaFin: "2023-11-30",
    tipo: "Regular",
    estado: "En curso",
    estadoActa: "Pendiente",
    estadoFactura: "Pendiente",
  },
  {
    id: 2,
    nombre: "Estadística Aplicada",
    codigo: "EA-2023",
    fechaInicio: "2023-08-15",
    fechaFin: "2023-11-15",
    tipo: "Regular",
    estado: "Finalizado",
    estadoActa: "Pendiente",
    estadoFactura: "Pendiente",
  },
  {
    id: 3,
    nombre: "Taller de Redacción Científica",
    codigo: "TRC-2023",
    fechaInicio: "2023-10-01",
    fechaFin: "2023-12-15",
    tipo: "Educación Continua",
    estado: "En curso",
    estadoActa: "Pendiente",
    estadoFactura: "Pendiente",
  },
  {
    id: 4,
    nombre: "Análisis de Datos con R",
    codigo: "ADR-2023",
    fechaInicio: "2023-07-01",
    fechaFin: "2023-10-30",
    tipo: "Educación Continua",
    estado: "Finalizado",
    estadoActa: "Entregada",
    estadoFactura: "Pagada",
  },
  {
    id: 5,
    nombre: "Introducción a la Programación",
    codigo: "IP-2023",
    fechaInicio: "2023-12-01",
    fechaFin: "2024-03-30",
    tipo: "Regular",
    estado: "Pendiente",
    estadoActa: "Pendiente",
    estadoFactura: "Pendiente",
  },
]

export default function MisCursos() {
  return (
    <div className="container py-6">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mis Cursos</h1>
            <p className="text-muted-foreground">Gestiona tus cursos asignados, actas y facturas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Subir Acta
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursos.length}</div>
              <p className="text-xs text-muted-foreground">Periodo académico actual</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursos.filter((curso) => curso.estado === "En curso").length}</div>
              <p className="text-xs text-muted-foreground">En progreso actualmente</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Actas Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cursos.filter((curso) => curso.estado === "Finalizado" && curso.estadoActa === "Pendiente").length}
              </div>
              <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="activos">Activos</TabsTrigger>
            <TabsTrigger value="finalizados">Finalizados</TabsTrigger>
            <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-4 my-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por nombre o código..." className="pl-8" />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="todos">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="continua">Educación Continua</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="todos" className="mt-0">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Curso / Código</th>
                      <th className="h-10 px-4 text-left font-medium">Fechas</th>
                      <th className="h-10 px-4 text-left font-medium">Tipo</th>
                      <th className="h-10 px-4 text-left font-medium">Estado</th>
                      <th className="h-10 px-4 text-left font-medium">Acta</th>
                      <th className="h-10 px-4 text-left font-medium">Factura</th>
                      <th className="h-10 px-4 text-left font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cursos.map((curso) => (
                      <tr key={curso.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          <div>
                            <div className="font-medium">{curso.nombre}</div>
                            <div className="text-xs text-muted-foreground">{curso.codigo}</div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="text-xs">
                            <div>Inicio: {curso.fechaInicio}</div>
                            <div>Fin: {curso.fechaFin}</div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={curso.tipo === "Regular" ? "outline" : "secondary"}>{curso.tipo}</Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center">
                            {curso.estado === "En curso" ? (
                              <Clock className="mr-1 h-4 w-4 text-blue-500" />
                            ) : curso.estado === "Finalizado" ? (
                              <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="mr-1 h-4 w-4 text-yellow-500" />
                            )}
                            <span
                              className={
                                curso.estado === "En curso"
                                  ? "text-blue-500"
                                  : curso.estado === "Finalizado"
                                    ? "text-green-500"
                                    : "text-yellow-500"
                              }
                            >
                              {curso.estado}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={curso.estadoActa === "Pendiente" ? "outline" : "success"}>
                            {curso.estadoActa}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge
                            variant={
                              curso.estadoFactura === "Pendiente"
                                ? "outline"
                                : curso.estadoFactura === "Subida"
                                  ? "secondary"
                                  : "success"
                            }
                          >
                            {curso.estadoFactura}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Link href={`/docente/cursos/${curso.id}`}>
                              <Button variant="ghost" size="icon" title="Ver detalle">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {curso.estado === "Finalizado" && curso.estadoActa === "Pendiente" && (
                              <Button variant="ghost" size="icon" title="Subir acta">
                                <Upload className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" title="Material didáctico">
                              <BookOpen className="h-4 w-4" />
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

          <TabsContent value="activos" className="mt-0">
            {/* Contenido similar pero filtrado para cursos activos */}
            <div className="rounded-md border">
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium">Cursos Activos</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Mostrando solo los cursos que están actualmente en progreso.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="finalizados" className="mt-0">
            {/* Contenido similar pero filtrado para cursos finalizados */}
            <div className="rounded-md border">
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium">Cursos Finalizados</h3>
                <p className="text-sm text-muted-foreground mt-2">Mostrando solo los cursos que han finalizado.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pendientes" className="mt-0">
            {/* Contenido similar pero filtrado para cursos pendientes */}
            <div className="rounded-md border">
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium">Cursos Pendientes</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Mostrando solo los cursos que están programados pero aún no han iniciado.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

