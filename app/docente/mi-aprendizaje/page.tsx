import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, GraduationCap, Award, Clock, Calendar, ChevronRight, Download, ExternalLink } from "lucide-react"

export default function MiAprendizajePage() {
  return (
    <div className="container py-6">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mi Aprendizaje</h1>
            <p className="text-muted-foreground">Gestiona tu desarrollo profesional y formación continua</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar Historial
            </Button>
            <Button size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Explorar Cursos
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cursos Completados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">En los últimos 12 meses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Horas de Formación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">120</div>
              <p className="text-xs text-muted-foreground">Acumuladas este año</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Certificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Obtenidas en tu carrera</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="en-progreso" className="w-full">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="en-progreso">En Progreso</TabsTrigger>
            <TabsTrigger value="completados">Completados</TabsTrigger>
            <TabsTrigger value="recomendados">Recomendados</TabsTrigger>
          </TabsList>

          <TabsContent value="en-progreso" className="mt-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>
                          {
                            [
                              "Metodologías Activas de Enseñanza",
                              "Diseño de Evaluaciones por Competencias",
                              "Tecnologías Educativas Avanzadas",
                            ][i]
                          }
                        </CardTitle>
                        <CardDescription>
                          {
                            [
                              "Facultad de Pedagogía",
                              "Departamento de Evaluación Educativa",
                              "Centro de Innovación Tecnológica",
                            ][i]
                          }
                        </CardDescription>
                      </div>
                      <Badge>{["65% Completado", "30% Completado", "45% Completado"][i]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Progreso</span>
                          <span className="font-medium">{["65%", "30%", "45%"][i]}</span>
                        </div>
                        <Progress value={[65, 30, 45][i]} className="h-2" />
                      </div>

                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{["20 horas restantes", "35 horas restantes", "25 horas restantes"][i]}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {["Fecha límite: 30/06/2024", "Fecha límite: 15/07/2024", "Fecha límite: 10/07/2024"][i]}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">
                          Continuar <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completados" className="mt-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <Award className="h-5 w-5 mr-2 text-yellow-500" />
                          {
                            [
                              "Competencias Digitales Docentes",
                              "Tutoría Académica Efectiva",
                              "Diseño de Cursos en Línea",
                            ][i]
                          }
                        </CardTitle>
                        <CardDescription>
                          {
                            [
                              "Centro de Innovación Educativa",
                              "Departamento de Orientación",
                              "Unidad de Educación Virtual",
                            ][i]
                          }
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Completado
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {["Completado: 10/03/2024", "Completado: 15/12/2023", "Completado: 20/08/2023"][i]}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{["40 horas", "30 horas", "50 horas"][i]}</span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Certificado
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recomendados" className="mt-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>
                          {
                            [
                              "Inteligencia Artificial en Educación",
                              "Evaluación de Competencias STEM",
                              "Neurociencia Aplicada al Aprendizaje",
                            ][i]
                          }
                        </CardTitle>
                        <CardDescription>
                          {
                            ["Centro de Innovación Tecnológica", "Facultad de Ciencias", "Instituto de Neurociencias"][
                              i
                            ]
                          }
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{["Nivel Intermedio", "Nivel Avanzado", "Nivel Básico"][i]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {
                          [
                            "Aprende a utilizar herramientas de IA para mejorar tus clases y optimizar el aprendizaje de tus estudiantes.",
                            "Metodologías de evaluación específicas para ciencias, tecnología, ingeniería y matemáticas.",
                            "Fundamentos neurocientíficos del aprendizaje y su aplicación en el aula.",
                          ][i]
                        }
                      </p>

                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{["40 horas", "35 horas", "50 horas"][i]}</span>
                      </div>

                      <div className="flex justify-end">
                        <Button size="sm">Ver Detalles</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Aprendizaje</CardTitle>
            <CardDescription>Resumen de tu actividad formativa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Distribución por Áreas</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Pedagogía</span>
                      <span className="font-medium">40%</span>
                    </div>
                    <Progress value={40} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Tecnología Educativa</span>
                      <span className="font-medium">30%</span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Evaluación</span>
                      <span className="font-medium">20%</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Otros</span>
                      <span className="font-medium">10%</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Logros Destacados</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="p-2 bg-primary/10 rounded-full mr-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Aprendiz Constante</h4>
                      <p className="text-xs text-muted-foreground">
                        Has completado al menos un curso cada trimestre durante el último año.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="p-2 bg-primary/10 rounded-full mr-3">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Especialista en Formación</h4>
                      <p className="text-xs text-muted-foreground">
                        Has acumulado más de 100 horas de formación en un área específica.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="p-2 bg-primary/10 rounded-full mr-3">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Docente Certificado</h4>
                      <p className="text-xs text-muted-foreground">
                        Has obtenido 5 certificaciones reconocidas en tu área de especialidad.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

