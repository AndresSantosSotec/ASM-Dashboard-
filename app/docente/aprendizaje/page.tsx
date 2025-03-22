import type { Metadata } from "next"
import { BookOpen, Download, CheckCircle, ChevronRight, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import DocenteLayout from "@/components/docente/docente-layout"

export const metadata: Metadata = {
  title: "Mi Aprendizaje | Portal Docente",
  description: "Certificaciones internas y capacitaciones para docentes",
}

// Datos de ejemplo
const cursos = [
  {
    id: 1,
    titulo: "Innovación Educativa y Nuevas Tecnologías",
    descripcion: "Curso sobre metodologías innovadoras y uso de tecnología en el aula.",
    fechaInicio: "2023-09-01",
    fechaFin: "2023-10-15",
    progreso: 100,
    estado: "Completado",
    evaluacion: 95,
    certificado: true,
  },
  {
    id: 2,
    titulo: "Evaluación por Competencias",
    descripcion: "Estrategias para evaluar el desarrollo de competencias en estudiantes.",
    fechaInicio: "2023-10-20",
    fechaFin: "2023-11-30",
    progreso: 75,
    estado: "En curso",
    evaluacion: 0,
    certificado: false,
  },
  {
    id: 3,
    titulo: "Diseño de Ambientes Virtuales de Aprendizaje",
    descripcion: "Creación de espacios virtuales efectivos para el aprendizaje.",
    fechaInicio: "2023-12-01",
    fechaFin: "2024-01-15",
    progreso: 0,
    estado: "Pendiente",
    evaluacion: 0,
    certificado: false,
  },
  {
    id: 4,
    titulo: "Metodologías Activas de Enseñanza",
    descripcion: "Técnicas para fomentar la participación activa de los estudiantes.",
    fechaInicio: "2023-07-01",
    fechaFin: "2023-08-15",
    progreso: 100,
    estado: "Completado",
    evaluacion: 90,
    certificado: true,
  },
]

const historialCapacitaciones = [
  {
    id: 1,
    titulo: "Innovación Educativa y Nuevas Tecnologías",
    fecha: "Octubre 2023",
    evaluacion: 95,
    comentarios: ["Excelente participación en todas las actividades", "Proyecto final destacado por su aplicabilidad"],
  },
  {
    id: 2,
    titulo: "Metodologías Activas de Enseñanza",
    fecha: "Agosto 2023",
    evaluacion: 90,
    comentarios: [
      "Buena participación en los foros de discusión",
      "Se recomienda profundizar en técnicas de aprendizaje colaborativo",
    ],
  },
  {
    id: 3,
    titulo: "Herramientas Digitales para la Educación",
    fecha: "Mayo 2023",
    evaluacion: 88,
    comentarios: ["Buen dominio de las herramientas presentadas", "Implementación efectiva en sus cursos regulares"],
  },
]

export default function MiAprendizaje() {
  return (
    <DocenteLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mi Aprendizaje</h1>
            <p className="text-muted-foreground">Gestiona tus capacitaciones y certificaciones internas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Ver Todos los Certificados
            </Button>
            <Button size="sm">
              <BookOpen className="mr-2 h-4 w-4" />
              Explorar Cursos
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <CardTitle className="text-sm font-medium">Cursos Completados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursos.filter((curso) => curso.estado === "Completado").length}</div>
              <p className="text-xs text-muted-foreground">Con certificación obtenida</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Promedio de Evaluación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  cursos.filter((curso) => curso.evaluacion > 0).reduce((acc, curso) => acc + curso.evaluacion, 0) /
                    cursos.filter((curso) => curso.evaluacion > 0).length,
                )}
                %
              </div>
              <div className="flex items-center mt-2">
                <Progress
                  value={Math.round(
                    cursos.filter((curso) => curso.evaluacion > 0).reduce((acc, curso) => acc + curso.evaluacion, 0) /
                      cursos.filter((curso) => curso.evaluacion > 0).length,
                  )}
                  className="h-2 w-24 mr-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 my-4">
          <div className="relative flex-1">
            <Input type="search" placeholder="Buscar cursos o capacitaciones..." className="pl-4" />
          </div>
        </div>

        <Tabs defaultValue="activos" className="w-full">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="activos">Cursos Activos</TabsTrigger>
            <TabsTrigger value="completados">Completados</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="activos" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cursos
                .filter((curso) => curso.estado === "En curso" || curso.estado === "Pendiente")
                .map((curso) => (
                  <Card key={curso.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{curso.titulo}</CardTitle>
                        <Badge variant={curso.estado === "En curso" ? "secondary" : "outline"}>{curso.estado}</Badge>
                      </div>
                      <CardDescription>{curso.descripcion}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progreso</span>
                            <span>{curso.progreso}%</span>
                          </div>
                          <Progress value={curso.progreso} className="h-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Fecha de inicio:</p>
                            <p>{curso.fechaInicio}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha de fin:</p>
                            <p>{curso.fechaFin}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        {curso.estado === "En curso" ? "Continuar Curso" : "Iniciar Curso"}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completados" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cursos
                .filter((curso) => curso.estado === "Completado")
                .map((curso) => (
                  <Card key={curso.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{curso.titulo}</CardTitle>
                        <Badge variant="success">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {curso.estado}
                        </Badge>
                      </div>
                      <CardDescription>{curso.descripcion}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Evaluación final</span>
                            <span className="font-medium">{curso.evaluacion}%</span>
                          </div>
                          <Progress value={curso.evaluacion} className="h-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Fecha de inicio:</p>
                            <p>{curso.fechaInicio}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha de finalización:</p>
                            <p>{curso.fechaFin}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </Button>
                      <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Certificado
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="historial" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Capacitaciones</CardTitle>
                <CardDescription>Registro histórico de todas tus capacitaciones y evaluaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-10 px-4 text-left font-medium">Capacitación</th>
                          <th className="h-10 px-4 text-left font-medium">Fecha</th>
                          <th className="h-10 px-4 text-left font-medium">Evaluación</th>
                          <th className="h-10 px-4 text-left font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialCapacitaciones.map((capacitacion) => (
                          <tr key={capacitacion.id} className="border-b hover:bg-muted/50">
                            <td className="p-4 align-middle font-medium">{capacitacion.titulo}</td>
                            <td className="p-4 align-middle">{capacitacion.fecha}</td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center">
                                <Progress value={capacitacion.evaluacion} className="h-2 w-16 mr-2" />
                                <span>{capacitacion.evaluacion}%</span>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <FileText className="mr-2 h-4 w-4" />
                                  Detalles
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Download className="mr-2 h-4 w-4" />
                                  Certificado
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Retroalimentación y Comentarios</CardTitle>
                <CardDescription>Comentarios destacados de tus capacitaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historialCapacitaciones.map((capacitacion) => (
                    <div key={capacitacion.id} className="border-l-4 border-primary pl-4 py-2">
                      <h4 className="font-medium">{capacitacion.titulo}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{capacitacion.fecha}</p>
                      <ul className="space-y-1">
                        {capacitacion.comentarios.map((comentario, index) => (
                          <li key={index} className="text-sm">
                            • {comentario}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DocenteLayout>
  )
}

