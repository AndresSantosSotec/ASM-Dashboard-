import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, FileText, Users, Mail, Settings } from "lucide-react"

export default function NotificacionesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground">Centro de notificaciones y alertas del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Marcar todas como leídas
          </Button>
          <Button variant="outline" size="sm">
            Configurar notificaciones
          </Button>
        </div>
      </div>

      <Tabs defaultValue="todas">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
          <TabsTrigger value="cursos">Cursos</TabsTrigger>
          <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Notificaciones Recientes</CardTitle>
              <CardDescription>Tienes 12 notificaciones sin leer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`p-4 border rounded-lg ${i === 0 || i === 1 ? "bg-primary/5" : ""}`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${getIconBackground(i)}`}>{getIcon(i)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{getNotificationTitle(i)}</h4>
                          <div className="flex items-center">
                            {(i === 0 || i === 1) && (
                              <Badge variant="default" className="mr-2">
                                Nueva
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{getNotificationTime(i)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{getNotificationDescription(i)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones del Sistema</CardTitle>
              <CardDescription>Actualizaciones y alertas importantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Settings className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {
                            ["Actualización del sistema", "Mantenimiento programado", "Nueva funcionalidad disponible"][
                              i
                            ]
                          }
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {
                            [
                              "Se ha actualizado el sistema a la versión 2.5.0 con mejoras de rendimiento.",
                              "El sistema estará en mantenimiento el día 20/05/2024 de 2:00 AM a 4:00 AM.",
                              "Se ha habilitado la nueva funcionalidad de exportación de calificaciones a Excel.",
                            ][i]
                          }
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="text-xs text-muted-foreground">
                            {["Hace 2 días", "Hace 1 semana", "Hace 2 semanas"][i]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cursos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones de Cursos</CardTitle>
              <CardDescription>Actividades y eventos relacionados con tus cursos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-green-100 rounded-full">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {["Nuevas entregas pendientes", "Recordatorio de evaluación", "Curso finalizado"][i]}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {
                            [
                              "Tienes 5 nuevas entregas pendientes de calificar en el curso de Matemáticas Avanzadas.",
                              "Mañana vence el plazo para la evaluación 'Examen Parcial 2' del curso de Física Cuántica.",
                              "El curso de Programación ha finalizado. Por favor, completa las calificaciones finales.",
                            ][i]
                          }
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="text-xs text-muted-foreground">
                            {["Hace 3 horas", "Hace 1 día", "Hace 3 días"][i]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mensajes" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones de Mensajes</CardTitle>
              <CardDescription>Mensajes y comunicaciones recibidas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Mail className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {["Nuevo mensaje de estudiante", "Mensaje de coordinación", "Mensaje grupal"][i]}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {
                            [
                              "Ana García te ha enviado un mensaje sobre la tarea de ecuaciones diferenciales.",
                              "La coordinación académica te ha enviado un mensaje importante sobre el cierre del semestre.",
                              "Has recibido un mensaje grupal para todos los docentes del departamento de Ciencias.",
                            ][i]
                          }
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="text-xs text-muted-foreground">
                            {["Hace 1 hora", "Hace 5 horas", "Hace 2 días"][i]}
                          </span>
                          <Button variant="link" size="sm" className="ml-auto p-0 h-auto">
                            Ver mensaje
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Funciones auxiliares para los iconos y contenido
function getIcon(index: number) {
  const icons = [
    <Bell key={0} className="h-5 w-5 text-yellow-600" />,
    <Mail key={1} className="h-5 w-5 text-purple-600" />,
    <FileText key={2} className="h-5 w-5 text-green-600" />,
    <Calendar key={3} className="h-5 w-5 text-blue-600" />,
    <Users key={4} className="h-5 w-5 text-red-600" />,
  ]
  return icons[index]
}

function getIconBackground(index: number) {
  const backgrounds = ["bg-yellow-100", "bg-purple-100", "bg-green-100", "bg-blue-100", "bg-red-100"]
  return backgrounds[index]
}

function getNotificationTitle(index: number) {
  const titles = [
    "Recordatorio de evaluación",
    "Nuevo mensaje recibido",
    "Entregas pendientes",
    "Evento próximo",
    "Solicitud de tutoría",
  ]
  return titles[index]
}

function getNotificationDescription(index: number) {
  const descriptions = [
    "Mañana vence el plazo para la evaluación 'Examen Parcial 2' del curso de Física Cuántica.",
    "Ana García te ha enviado un mensaje sobre la tarea de ecuaciones diferenciales.",
    "Tienes 5 nuevas entregas pendientes de calificar en el curso de Matemáticas Avanzadas.",
    "Reunión de departamento programada para el 18/05/2024 a las 10:00 AM.",
    "El estudiante Carlos Pérez ha solicitado una tutoría para el curso de Programación.",
  ]
  return descriptions[index]
}

function getNotificationTime(index: number) {
  const times = ["Hace 30 minutos", "Hace 1 hora", "Hace 3 horas", "Hace 1 día", "Hace 2 días"]
  return times[index]
}

