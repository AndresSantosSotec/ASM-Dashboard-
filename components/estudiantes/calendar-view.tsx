"use client"

import { useState } from "react"
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Datos de ejemplo para eventos académicos
const events = [
  {
    id: 1,
    title: "Examen Parcial I",
    description: "Programación Orientada a Objetos",
    date: new Date(2025, 2, 15), // 15 de marzo de 2025
    time: "09:00 - 11:00",
    location: "Laboratorio 3A",
    type: "exam",
  },
  {
    id: 2,
    title: "Entrega de Proyecto",
    description: "Diseño de Bases de Datos",
    date: new Date(2025, 2, 18), // 18 de marzo de 2025
    time: "23:59",
    location: "Virtual - Plataforma",
    type: "assignment",
  },
  {
    id: 3,
    title: "Conferencia: IA y su futuro",
    description: "Ponente: Dr. Ricardo Mendoza",
    date: new Date(2025, 2, 20), // 20 de marzo de 2025
    time: "14:00 - 16:00",
    location: "Auditorio Principal",
    type: "event",
  },
  {
    id: 4,
    title: "Taller de React",
    description: "Desarrollo de interfaces modernas",
    date: new Date(2025, 2, 25), // 25 de marzo de 2025
    time: "10:00 - 13:00",
    location: "Aula 205",
    type: "workshop",
  },
  {
    id: 5,
    title: "Examen Final",
    description: "Metodologías Ágiles",
    date: new Date(2025, 2, 30), // 30 de marzo de 2025
    time: "11:00 - 13:00",
    location: "Edificio B - Aula 301",
    type: "exam",
  },
]

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Ir al mes anterior
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
    setSelectedDate(null)
  }

  // Ir al mes siguiente
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
    setSelectedDate(null)
  }

  // Determinar eventos para una fecha específica
  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear(),
    )
  }

  // Eventos para la fecha seleccionada
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  // Determinar el color de badge según el tipo de evento
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "exam":
        return "bg-red-100 text-red-800 border-red-200"
      case "assignment":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "workshop":
        return "bg-green-100 text-green-800 border-green-200"
      case "event":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Texto descriptivo para el tipo de evento
  const getEventTypeText = (type: string) => {
    switch (type) {
      case "exam":
        return "Examen"
      case "assignment":
        return "Entrega"
      case "workshop":
        return "Taller"
      case "event":
        return "Evento"
      default:
        return "Actividad"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Calendario Académico</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium">{format(currentDate, "MMMM yyyy", { locale: es })}</span>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>Visualiza tus exámenes, entregas y eventos importantes</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Encabezados de los días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["D", "L", "M", "M", "J", "V", "S"].map((day, i) => (
              <div key={i} className="py-2 text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Cuadrícula del calendario */}
          <div className="grid grid-cols-7 gap-1">
            {/* Espacios en blanco para alinear los días correctamente */}
            {Array.from({ length: getDay(monthStart) }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 md:h-16 p-1" />
            ))}

            {/* Días del mes */}
            {days.map((day) => {
              const dayEvents = getEventsForDate(day)
              const hasEvents = dayEvents.length > 0
              const isSelected =
                selectedDate && selectedDate.getDate() === day.getDate() && selectedDate.getMonth() === day.getMonth()

              return (
                <div
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`h-12 md:h-16 p-1 border rounded-md cursor-pointer transition-colors relative ${
                    isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-sm font-medium">{format(day, "d")}</div>

                  {/* Indicador de eventos */}
                  {hasEvents && (
                    <div className="absolute bottom-1 right-1">
                      <div className={`w-2 h-2 rounded-full ${dayEvents.length > 0 ? "bg-blue-500" : ""}`}></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de eventos para la fecha seleccionada */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {format(selectedDate, "EEEE, d 'de' MMMM, yyyy", { locale: es })}
            </CardTitle>
            <CardDescription>
              {selectedDateEvents.length > 0
                ? `${selectedDateEvents.length} actividad${selectedDateEvents.length !== 1 ? "es" : ""} programada${selectedDateEvents.length !== 1 ? "s" : ""}`
                : "No hay actividades programadas para este día"}
            </CardDescription>
          </CardHeader>
          {selectedDateEvents.length > 0 && (
            <CardContent className="space-y-4">
              {selectedDateEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{event.title}</h3>
                    <Badge className={getEventTypeColor(event.type)}>{getEventTypeText(event.type)}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                  <div className="flex flex-col space-y-2 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Próximos eventos importantes */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos Importantes</CardTitle>
          <CardDescription>Actividades académicas en las próximas semanas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {events
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 3)
            .map((event) => (
              <div
                key={event.id}
                className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-11 h-11 flex flex-col items-center justify-center bg-blue-50 rounded-md border border-blue-100">
                  <span className="text-xs font-semibold text-blue-600">
                    {format(event.date, "MMM", { locale: es })}
                  </span>
                  <span className="text-lg font-bold text-blue-800">{format(event.date, "d")}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <Badge className={getEventTypeColor(event.type)} variant="outline">
                      {getEventTypeText(event.type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span className="mr-3">{event.time}</span>
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}

