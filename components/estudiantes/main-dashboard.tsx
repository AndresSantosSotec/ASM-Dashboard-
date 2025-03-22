"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, Bell } from "lucide-react"

export function MainDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Próximas Actividades</CardTitle>
            <CardDescription>Tareas y evaluaciones pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: "Entrega de Proyecto Final",
                  course: "Gestión Estratégica",
                  dueDate: "En 2 días",
                  priority: "Alta",
                },
                {
                  title: "Examen Parcial",
                  course: "Finanzas Corporativas",
                  dueDate: "En 5 días",
                  priority: "Alta",
                },
                {
                  title: "Presentación Grupal",
                  course: "Marketing Digital",
                  dueDate: "En 1 semana",
                  priority: "Media",
                },
              ].map((task, index) => (
                <div key={index} className="flex justify-between items-start border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">{task.course}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{task.dueDate}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        task.priority === "Alta"
                          ? "bg-red-100 text-red-800"
                          : task.priority === "Media"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
            <CardDescription>Eventos próximos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: "Clase: Gestión Estratégica",
                  date: "Hoy, 10:00 AM",
                  type: "Clase",
                },
                {
                  title: "Tutoría Grupal",
                  date: "Mañana, 2:00 PM",
                  type: "Tutoría",
                },
                {
                  title: "Conferencia: Liderazgo",
                  date: "Viernes, 4:00 PM",
                  type: "Evento",
                },
              ].map((event, index) => (
                <div key={index} className="flex justify-between items-start border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{event.date}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      event.type === "Clase"
                        ? "bg-blue-100 text-blue-800"
                        : event.type === "Tutoría"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-green-100 text-green-800"
                    }
                  >
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Ver Calendario Completo
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Progreso Académico</CardTitle>
            <CardDescription>Rendimiento por curso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { course: "Gestión Estratégica", progress: 75 },
                { course: "Finanzas Corporativas", progress: 60 },
                { course: "Marketing Digital", progress: 40 },
                { course: "Liderazgo Empresarial", progress: 25 },
              ].map((course, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{course.course}</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anuncios Importantes</CardTitle>
            <CardDescription>Últimas notificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: "Cambio de horario",
                  description: "La clase de Finanzas Corporativas del martes se trasladará a las 4:00 PM",
                  date: "Hace 2 horas",
                },
                {
                  title: "Nuevo material disponible",
                  description: "Se ha subido nuevo material para el curso de Marketing Digital",
                  date: "Hace 1 día",
                },
                {
                  title: "Recordatorio de inscripción",
                  description: "El período de inscripción para el próximo semestre comienza el lunes",
                  date: "Hace 2 días",
                },
              ].map((announcement, index) => (
                <div key={index} className="flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground">{announcement.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{announcement.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

