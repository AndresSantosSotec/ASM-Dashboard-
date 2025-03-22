import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Award, Download, ExternalLink, Clock, Calendar, CheckCircle } from "lucide-react"

export default function CertificacionesPage() {
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Certificaciones</h1>
            <p className="text-muted-foreground">Gestiona tus certificaciones y desarrollo profesional</p>
          </div>
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Explorar Catálogo
          </Button>
        </div>

        <Tabs defaultValue="activas">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activas">En Progreso</TabsTrigger>
            <TabsTrigger value="completadas">Completadas</TabsTrigger>
            <TabsTrigger value="recomendadas">Recomendadas</TabsTrigger>
          </TabsList>

          <TabsContent value="activas" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-3 bg-primary"></div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>
                          {["Metodologías Activas de Enseñanza", "Diseño de Evaluaciones por Competencias"][i]}
                        </CardTitle>
                        <CardDescription>
                          {["Facultad de Pedagogía", "Departamento de Evaluación Educativa"][i]}
                        </CardDescription>
                      </div>
                      <Badge>{["En progreso", "En progreso"][i]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Progreso</span>
                        <span className="font-medium">{["65%", "30%"][i]}</span>
                      </div>
                      <Progress value={[65, 30][i]} className="h-2" />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{["20 horas restantes", "35 horas restantes"][i]}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{["Fecha límite: 30/06/2024", "Fecha límite: 15/07/2024"][i]}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-medium mb-2">Módulos completados</h4>
                      <div className="space-y-1">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="flex items-center text-sm">
                            <CheckCircle
                              className={`h-4 w-4 mr-2 ${j < [2, 1][i] ? "text-green-500" : "text-gray-300"}`}
                            />
                            <span className={j < [2, 1][i] ? "" : "text-muted-foreground"}>
                              {
                                [
                                  ["Fundamentos pedagógicos", "Aprendizaje basado en proyectos", "Aula invertida"],
                                  ["Principios de evaluación", "Rúbricas y matrices", "Evaluación formativa"],
                                ][i][j]
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 px-6 py-3">
                    <Button className="w-full">Continuar Aprendizaje</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completadas" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
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
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{["Completado: 10/03/2024", "Completado: 15/12/2023", "Completado: 20/08/2023"][i]}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{["40 horas", "30 horas", "50 horas"][i]}</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Certificado
                    </Badge>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-3">
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Certificado
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recomendadas" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Certificaciones Recomendadas</CardTitle>
                <CardDescription>Basadas en tu perfil y áreas de interés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">
                          {
                            [
                              "Inteligencia Artificial en Educación",
                              "Evaluación de Competencias STEM",
                              "Neurociencia Aplicada al Aprendizaje",
                            ][i]
                          }
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {
                            [
                              "Aprende a utilizar herramientas de IA para mejorar tus clases",
                              "Metodologías de evaluación para ciencias y matemáticas",
                              "Fundamentos neurocientíficos del aprendizaje",
                            ][i]
                          }
                        </p>
                        <div className="flex items-center mt-1 text-sm">
                          <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          <span className="text-muted-foreground">{["40 horas", "35 horas", "50 horas"][i]}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{["Nivel Intermedio", "Nivel Avanzado", "Nivel Básico"][i]}</Badge>
                        <Button>Ver Detalles</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Certificaciones Externas</CardTitle>
                  <CardDescription>Programas de instituciones asociadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                            <span className="font-bold text-xs">{["EDX", "COU", "MIT"][i]}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">
                              {
                                [
                                  "Educación Basada en Evidencias",
                                  "Diseño Universal de Aprendizaje",
                                  "Tecnologías Emergentes en Educación",
                                ][i]
                              }
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {["EdX - Harvard University", "Coursera - Stanford", "MITx"][i]}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Desarrollo</CardTitle>
                  <CardDescription>Resumen de tu formación continua</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Horas de formación completadas</span>
                        <span className="font-medium">120 horas</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <div className="text-2xl font-bold">5</div>
                        <div className="text-sm text-muted-foreground">Certificaciones</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="text-2xl font-bold">3</div>
                        <div className="text-sm text-muted-foreground">En progreso</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="text-2xl font-bold">2</div>
                        <div className="text-sm text-muted-foreground">Áreas temáticas</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="text-2xl font-bold">85%</div>
                        <div className="text-sm text-muted-foreground">Tasa de finalización</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

