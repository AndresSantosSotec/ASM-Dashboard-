import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CalendarioPage() {
  // Datos de ejemplo para el calendario
  const currentMonth = "Mayo 2024"
  const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
  const totalDays = 31
  const firstDayOffset = 3 // Miércoles es el primer día del mes (0-6)

  // Eventos de ejemplo
  const events = [
    { day: 5, title: "Examen Parcial", course: "Matemáticas", type: "exam" },
    { day: 8, title: "Entrega de Proyecto", course: "Programación", type: "assignment" },
    { day: 12, title: "Reunión Departamental", course: "", type: "meeting" },
    { day: 15, title: "Taller de Capacitación", course: "", type: "workshop" },
    { day: 18, title: "Quiz Semanal", course: "Física", type: "exam" },
    { day: 22, title: "Práctica de Laboratorio", course: "Química", type: "lab" },
    { day: 25, title: "Entrega de Calificaciones", course: "Todos", type: "deadline" },
    { day: 28, title: "Asesoría Grupal", course: "Matemáticas", type: "tutoring" },
  ]

  // Función para obtener eventos de un día específico
  const getEventsForDay = (day: number) => {
    return events.filter((event) => event.day === day)
  }

  // Función para obtener la clase de color según el tipo de evento
  const getEventColorClass = (type: string) => {
    const colors: Record<string, string> = {
      exam: "bg-red-500",
      assignment: "bg-blue-500",
      meeting: "bg-purple-500",
      workshop: "bg-green-500",
      lab: "bg-yellow-500",
      deadline: "bg-orange-500",
      tutoring: "bg-indigo-500",
    }
    return colors[type] || "bg-gray-500"
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendario Académico</h1>
            <p className="text-muted-foreground">Gestiona tus eventos, clases y actividades académicas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Hoy
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-3/4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Button variant="ghost" size="sm">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-lg font-medium px-2">{currentMonth}</h3>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="mes">
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Vista" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mes">Vista Mensual</SelectItem>
                        <SelectItem value="semana">Vista Semanal</SelectItem>
                        <SelectItem value="dia">Vista Diaria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {daysOfWeek.map((day, index) => (
                    <div key={index} className="text-center py-2 text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Días del mes */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Espacios vacíos para el offset del primer día */}
                  {Array.from({ length: firstDayOffset }).map((_, index) => (
                    <div key={`empty-${index}`} className="h-24 p-1 border rounded-md bg-gray-50"></div>
                  ))}

                  {/* Días del mes */}
                  {Array.from({ length: totalDays }).map((_, index) => {
                    const day = index + 1
                    const dayEvents = getEventsForDay(day)
                    const isToday = day === 15 // Simulamos que hoy es el día 15

                    return (
                      <div
                        key={`day-${day}`}
                        className={`h-24 p-1 border rounded-md overflow-hidden ${isToday ? "border-primary border-2" : ""}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className={`text-sm font-medium ${isToday ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center" : ""}`}
                          >
                            {day}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {dayEvents.length} evento{dayEvents.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 overflow-y-auto max-h-[calc(100%-20px)]">
                          {dayEvents.map((event, eventIndex) => (
                            <div key={`event-${day}-${eventIndex}`} className="text-xs p-1 rounded truncate">
                              <div
                                className={`w-2 h-2 rounded-full inline-block mr-1 ${getEventColorClass(event.type)}`}
                              ></div>
                              <span className="font-medium">{event.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:w-1/4 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Próximos Eventos</CardTitle>
                <CardDescription>Eventos para los próximos 7 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events
                    .filter((event) => event.day >= 15 && event.day <= 22)
                    .sort((a, b) => a.day - b.day)
                    .map((event, index) => (
                      <div
                        key={index}
                        className="border-l-4 pl-3 py-1"
                        style={{ borderColor: getEventColorClass(event.type).replace("bg-", "border-") }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            {event.course && <p className="text-xs text-muted-foreground">{event.course}</p>}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {event.day} Mayo
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm">Exámenes</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm">Entregas</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <span className="text-sm">Reuniones</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Talleres</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-sm">Laboratorios</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <span className="text-sm">Fechas límite</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                    <span className="text-sm">Tutorías</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

