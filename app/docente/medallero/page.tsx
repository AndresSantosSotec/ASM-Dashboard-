import type { Metadata } from "next"
import { Award, Share2, Download, ExternalLink, Star, Calendar, Users, BookOpen, BarChart } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Medallero Académico | Portal Docente",
  description: "Reconocimientos y logros del docente",
}

// Datos de ejemplo
const medallas = [
  {
    id: 1,
    nombre: "Excelencia Docente",
    descripcion: "Otorgada por mantener un promedio de evaluación superior al 90% durante tres periodos consecutivos.",
    fecha: "2023-10-15",
    icono: "award",
    color: "text-yellow-500",
  },
  {
    id: 2,
    nombre: "Innovación Pedagógica",
    descripcion: "Reconocimiento por implementar metodologías innovadoras en el aula.",
    fecha: "2023-08-20",
    icono: "star",
    color: "text-blue-500",
  },
  {
    id: 3,
    nombre: "Mentor Destacado",
    descripcion: "Por la excelente labor de acompañamiento a estudiantes en proyectos de investigación.",
    fecha: "2023-06-10",
    icono: "users",
    color: "text-green-500",
  },
  {
    id: 4,
    nombre: "Compromiso Académico",
    descripcion: "Por cumplir con todos los plazos de entrega de actas y evaluaciones.",
    fecha: "2023-05-05",
    icono: "calendar",
    color: "text-purple-500",
  },
  {
    id: 5,
    nombre: "Producción Académica",
    descripcion: "Por la publicación de material didáctico de alta calidad.",
    fecha: "2023-04-15",
    icono: "book-open",
    color: "text-red-500",
  },
]

const cursosImpartidos = [
  {
    id: 1,
    nombre: "Metodología de la Investigación",
    periodo: "2023-B",
    alumnos: 25,
    evaluacion: 4.8,
  },
  {
    id: 2,
    nombre: "Estadística Aplicada",
    periodo: "2023-B",
    alumnos: 20,
    evaluacion: 4.5,
  },
  {
    id: 3,
    nombre: "Taller de Redacción Científica",
    periodo: "2023-A",
    alumnos: 15,
    evaluacion: 4.9,
  },
  {
    id: 4,
    nombre: "Análisis de Datos con R",
    periodo: "2023-A",
    alumnos: 18,
    evaluacion: 4.7,
  },
  {
    id: 5,
    nombre: "Metodología de la Investigación",
    periodo: "2022-B",
    alumnos: 22,
    evaluacion: 4.6,
  },
]

const renderIcono = (icono: string, color: string) => {
  switch (icono) {
    case "award":
      return <Award className={`h-6 w-6 ${color}`} />
    case "star":
      return <Star className={`h-6 w-6 ${color}`} />
    case "users":
      return <Users className={`h-6 w-6 ${color}`} />
    case "calendar":
      return <Calendar className={`h-6 w-6 ${color}`} />
    case "book-open":
      return <BookOpen className={`h-6 w-6 ${color}`} />
    default:
      return <Award className={`h-6 w-6 ${color}`} />
  }
}

export default function Medallero() {
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mi Medallero Académico</h1>
            <p className="text-muted-foreground">Reconocimientos y logros obtenidos en tu trayectoria docente</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Descargar Certificado
            </Button>
            <Button size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Compartir en LinkedIn
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Medallas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{medallas.length}</div>
              <p className="text-xs text-muted-foreground">Reconocimientos obtenidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Evaluación Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.7/5.0</div>
              <div className="flex items-center mt-2">
                <Progress value={94} className="h-2 w-24 mr-2" />
                <span className="text-xs text-muted-foreground">94%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cursos Impartidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursosImpartidos.length}</div>
              <p className="text-xs text-muted-foreground">En los últimos 12 meses</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="medallas" className="w-full">
          <TabsList className="grid grid-cols-2 w-full md:w-auto">
            <TabsTrigger value="medallas">Medallas e Insignias</TabsTrigger>
            <TabsTrigger value="cursos">Historial de Cursos</TabsTrigger>
          </TabsList>

          <TabsContent value="medallas" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medallas.map((medalla) => (
                <Card key={medalla.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="mr-3 p-2 bg-muted rounded-full">
                          {renderIcono(medalla.icono, medalla.color)}
                        </div>
                        <CardTitle>{medalla.nombre}</CardTitle>
                      </div>
                      <Badge variant="outline">{medalla.fecha}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{medalla.descripcion}</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartir
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cursos" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <CardTitle>Historial de Cursos Impartidos</CardTitle>
                  <Button variant="outline" size="sm">
                    <BarChart className="mr-2 h-4 w-4" />
                    Ver Estadísticas Completas
                  </Button>
                </div>
                <CardDescription>Resumen de los cursos impartidos y evaluaciones recibidas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-10 px-4 text-left font-medium">Curso</th>
                          <th className="h-10 px-4 text-left font-medium">Periodo</th>
                          <th className="h-10 px-4 text-left font-medium">Alumnos</th>
                          <th className="h-10 px-4 text-left font-medium">Evaluación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cursosImpartidos.map((curso) => (
                          <tr key={curso.id} className="border-b hover:bg-muted/50">
                            <td className="p-4 align-middle font-medium">{curso.nombre}</td>
                            <td className="p-4 align-middle">{curso.periodo}</td>
                            <td className="p-4 align-middle">{curso.alumnos}</td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center">
                                <div className="flex items-center mr-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-3 w-3 ${
                                        star <= Math.floor(curso.evaluacion)
                                          ? "text-yellow-500 fill-yellow-500"
                                          : star - curso.evaluacion < 1 && star - curso.evaluacion > 0
                                            ? "text-yellow-500 fill-yellow-500"
                                            : "text-muted-foreground"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="font-medium">{curso.evaluacion}/5.0</span>
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
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Certificado Digital</CardTitle>
            <CardDescription>Comparte tus logros y reconocimientos en redes profesionales</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center p-6">
            <div className="bg-muted p-8 rounded-lg mb-4 w-full max-w-md">
              <div className="flex justify-center mb-4">
                <Award className="h-16 w-16 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Dr. Juan Docente</h3>
              <p className="text-sm mb-4">Facultad de Ciencias</p>
              <p className="text-sm mb-6">
                Ha obtenido reconocimiento por su excelente desempeño académico y compromiso con la calidad educativa.
              </p>
              <div className="flex justify-center gap-4">
                {[1, 2, 3, 4, 5].map((id) => (
                  <div key={id} className="p-1 bg-background rounded-full">
                    {renderIcono(medallas[id - 1].icono, medallas[id - 1].color)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
              <Button>
                <ExternalLink className="mr-2 h-4 w-4" />
                Compartir en LinkedIn
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Evaluación del Comité Académico */}
        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5 text-primary" />
                Evaluación del Comité Académico
              </CardTitle>
              <Badge className="bg-green-100 text-green-800">Aprobado</Badge>
            </div>
            <CardDescription>Resultados de la evaluación realizada por el comité académico</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Calificación General</h3>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center mr-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= 4 ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium text-lg">4.0/5.0</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Fecha de evaluación</p>
                  <p className="text-sm">15 de diciembre de 2023</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Comentarios del Comité</h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  El docente ha demostrado un buen desempeño en sus funciones académicas. Se destaca su compromiso con
                  la calidad educativa y su disposición para implementar mejoras en sus metodologías de enseñanza. Se
                  recomienda continuar con su desarrollo profesional en áreas de innovación pedagógica.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <h3 className="font-medium mb-2">Áreas destacadas</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center">
                      <Award className="h-4 w-4 text-green-500 mr-2" />
                      Metodología de enseñanza
                    </li>
                    <li className="flex items-center">
                      <Award className="h-4 w-4 text-green-500 mr-2" />
                      Atención a estudiantes
                    </li>
                    <li className="flex items-center">
                      <Award className="h-4 w-4 text-green-500 mr-2" />
                      Cumplimiento de plazos
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Áreas de mejora</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center">
                      <Calendar className="h-4 w-4 text-amber-500 mr-2" />
                      Uso de tecnologías educativas
                    </li>
                    <li className="flex items-center">
                      <Calendar className="h-4 w-4 text-amber-500 mr-2" />
                      Actualización de contenidos
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Descargar informe completo
            </Button>
            <Button variant="secondary">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver historial de evaluaciones
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}

