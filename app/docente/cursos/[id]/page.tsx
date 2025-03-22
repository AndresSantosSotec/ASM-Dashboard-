import type { Metadata } from "next"
import { ArrowLeft, Download, Upload, Users, FileText, MessageSquare, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import DocenteLayout from "@/components/docente/docente-layout"

export const metadata: Metadata = {
  title: "Detalle de Curso | Portal Docente",
  description: "Información detallada del curso y listado de alumnos",
}

// Datos de ejemplo
const curso = {
  id: 1,
  nombre: "Metodología de la Investigación",
  codigo: "MI-2023",
  fechaInicio: "2023-09-01",
  fechaFin: "2023-11-30",
  tipo: "Regular",
  estado: "En curso",
  estadoActa: "Pendiente",
  estadoFactura: "Pendiente",
  modalidad: "Presencial",
  horario: "Lunes y Miércoles, 10:00 - 12:00",
  aula: "A-203",
  totalAlumnos: 25,
  promedioEvaluacion: 4.5,
}

const alumnos = [
  {
    id: 1,
    nombre: "Ana García Martínez",
    identificacion: "A2023001",
    calificacion: 85,
    estado: "Activo",
    asistencia: 90,
  },
  {
    id: 2,
    nombre: "Carlos Rodríguez López",
    identificacion: "A2023002",
    calificacion: 78,
    estado: "Activo",
    asistencia: 85,
  },
  {
    id: 3,
    nombre: "María Fernández Sánchez",
    identificacion: "A2023003",
    calificacion: 92,
    estado: "Activo",
    asistencia: 95,
  },
  {
    id: 4,
    nombre: "Juan Pérez Torres",
    identificacion: "A2023004",
    calificacion: 65,
    estado: "En riesgo",
    asistencia: 70,
  },
  {
    id: 5,
    nombre: "Laura Martín Gómez",
    identificacion: "A2023005",
    calificacion: 88,
    estado: "Activo",
    asistencia: 92,
  },
]

const evaluaciones = [
  {
    id: 1,
    tipo: "Estudiantes",
    promedio: 4.5,
    comentarios: [
      "Excelente metodología de enseñanza",
      "Muy claro en sus explicaciones",
      "Siempre disponible para resolver dudas",
    ],
  },
  {
    id: 2,
    tipo: "Comité Académico",
    promedio: 4.7,
    comentarios: [
      "Cumple con los objetivos del programa",
      "Excelente dominio de la materia",
      "Se recomienda continuar con el docente",
    ],
  },
]

export default function DetalleCurso({ params }: { params: { id: string } }) {
  return (
    <DocenteLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/docente/cursos">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{curso.nombre}</h1>
              <p className="text-muted-foreground">
                {curso.codigo} | {curso.modalidad}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Enviar mensaje
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
              <CardTitle className="text-sm font-medium">Estado del Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {curso.estado === "En curso" ? (
                  <Clock className="mr-2 h-5 w-5 text-blue-500" />
                ) : curso.estado === "Finalizado" ? (
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="mr-2 h-5 w-5 text-yellow-500" />
                )}
                <span
                  className={
                    curso.estado === "En curso"
                      ? "text-blue-500 font-medium"
                      : curso.estado === "Finalizado"
                        ? "text-green-500 font-medium"
                        : "text-yellow-500 font-medium"
                  }
                >
                  {curso.estado}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <div>Inicio: {curso.fechaInicio}</div>
                <div>Fin: {curso.fechaFin}</div>
                <div>Horario: {curso.horario}</div>
                <div>Aula: {curso.aula}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Alumnos Inscritos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{curso.totalAlumnos}</div>
              <div className="flex items-center mt-2">
                <div className="text-xs text-muted-foreground mr-2">Asistencia promedio:</div>
                <Progress value={85} className="h-2 w-24" />
                <div className="text-xs ml-2">85%</div>
              </div>
              <div className="flex items-center mt-2">
                <div className="text-xs text-muted-foreground mr-2">Aprobación estimada:</div>
                <Progress value={90} className="h-2 w-24" />
                <div className="text-xs ml-2">90%</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Evaluación Docente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{curso.promedioEvaluacion}/5.0</div>
              <div className="flex items-center mt-2">
                <div className="text-xs text-muted-foreground mr-2">Estudiantes:</div>
                <Progress value={90} className="h-2 w-24" />
                <div className="text-xs ml-2">4.5/5.0</div>
              </div>
              <div className="flex items-center mt-2">
                <div className="text-xs text-muted-foreground mr-2">Comité Académico:</div>
                <Progress value={94} className="h-2 w-24" />
                <div className="text-xs ml-2">4.7/5.0</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="alumnos" className="w-full">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="alumnos">Listado de Alumnos</TabsTrigger>
            <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
            <TabsTrigger value="asistencia">Registro de Asistencia</TabsTrigger>
          </TabsList>

          <TabsContent value="alumnos" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Listado de Alumnos
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Lista
                    </Button>
                    <Button size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Actualizar Notas
                    </Button>
                  </div>
                </div>
                <CardDescription>Total: {alumnos.length} alumnos inscritos en el curso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-10 px-4 text-left font-medium">Nombre</th>
                          <th className="h-10 px-4 text-left font-medium">ID</th>
                          <th className="h-10 px-4 text-left font-medium">Calificación</th>
                          <th className="h-10 px-4 text-left font-medium">Estado</th>
                          <th className="h-10 px-4 text-left font-medium">% Asistencia</th>
                          <th className="h-10 px-4 text-left font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alumnos.map((alumno) => (
                          <tr key={alumno.id} className="border-b hover:bg-muted/50">
                            <td className="p-4 align-middle font-medium">{alumno.nombre}</td>
                            <td className="p-4 align-middle">{alumno.identificacion}</td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center">
                                <span
                                  className={
                                    alumno.calificacion >= 80
                                      ? "text-green-500 font-medium"
                                      : alumno.calificacion >= 70
                                        ? "text-yellow-500 font-medium"
                                        : "text-red-500 font-medium"
                                  }
                                >
                                  {alumno.calificacion}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <Badge variant={alumno.estado === "Activo" ? "outline" : "destructive"}>
                                {alumno.estado}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center">
                                <Progress value={alumno.asistencia} className="h-2 w-16 mr-2" />
                                <span>{alumno.asistencia}%</span>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  Actualizar
                                </Button>
                                <Button variant="ghost" size="sm">
                                  Mensaje
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
          </TabsContent>

          <TabsContent value="evaluaciones" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {evaluaciones.map((evaluacion) => (
                <Card key={evaluacion.id}>
                  <CardHeader>
                    <CardTitle>Evaluación de {evaluacion.tipo}</CardTitle>
                    <CardDescription>
                      Promedio: <span className="font-medium">{evaluacion.promedio}/5.0</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Comentarios destacados:</h4>
                        <ul className="space-y-2">
                          {evaluacion.comentarios.map((comentario, index) => (
                            <li key={index} className="text-sm bg-muted p-2 rounded-md">
                              "{comentario}"
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar reporte completo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="asistencia" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <CardTitle>Registro de Asistencia</CardTitle>
                  <Button size="sm">Registrar Asistencia</Button>
                </div>
                <CardDescription>Gestiona la asistencia de los alumnos por sesión</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center">
                  <h3 className="text-lg font-medium">Registro de Asistencia</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Aquí podrás registrar y gestionar la asistencia de los alumnos por cada sesión del curso.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DocenteLayout>
  )
}

