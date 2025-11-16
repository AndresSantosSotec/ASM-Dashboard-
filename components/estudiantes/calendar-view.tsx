"use client"

import { useEffect, useMemo, useState } from "react"
import DOMPurify from "dompurify"
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getMisEventos, EventoCalendario } from "@/services/academico"

type BadgeMeta = {
  className: string
  label: string
}

const getEventBadgeMeta = (event: EventoCalendario): BadgeMeta => {
  const type = (event.tipo || "").toLowerCase()

  if (["exam", "quiz", "assessment", "test"].some((token) => type.includes(token))) {
    return { className: "bg-red-50 text-red-800 border-red-200", label: "Evaluación" }
  }

  if (["due", "assignment", "submission", "close"].some((token) => type.includes(token))) {
    return { className: "bg-blue-50 text-blue-800 border-blue-200", label: "Entrega" }
  }

  if (type.includes("workshop")) {
    return { className: "bg-green-50 text-green-800 border-green-200", label: "Taller" }
  }

  if (event.origen === "grupo") {
    return { className: "bg-amber-50 text-amber-800 border-amber-200", label: "Grupo" }
  }

  if (event.origen === "personal") {
    return { className: "bg-purple-50 text-purple-800 border-purple-200", label: "Personal" }
  }

  if (event.origen === "global") {
    return { className: "bg-gray-100 text-gray-800 border-gray-200", label: "General" }
  }

  return { className: "bg-emerald-50 text-emerald-800 border-emerald-200", label: "Curso" }
}

const formatEventTimeRange = (event: EventoCalendario) => {
  if (event.hora && event.hora_fin) {
    return `${event.hora} - ${event.hora_fin}`
  }

  if (event.hora) {
    return `${event.hora}${event.duracion_minutos ? ` · ${event.duracion_minutos} min` : ""}`
  }

  if (event.duracion_minutos) {
    return `${event.duracion_minutos} min`
  }

  return "Horario por definir"
}

const getEventDate = (event: EventoCalendario): Date | null => {
  if (event.inicio_timestamp) {
    return new Date(event.inicio_timestamp * 1000)
  }

  if (event.fecha) {
    const iso = `${event.fecha}${event.hora ? `T${event.hora}` : "T00:00:00"}`
    const parsed = new Date(iso)

    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

const sanitizeEventDescription = (html?: string | null) =>
  html ? DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }) : null

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<EventoCalendario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  useEffect(() => {
    let isMounted = true

    async function fetchEvents() {
      try {
        setIsLoading(true)
        setError(null)

        const data = await getMisEventos({
          fecha_inicio: format(startOfMonth(currentDate), "yyyy-MM-dd"),
          fecha_fin: format(endOfMonth(currentDate), "yyyy-MM-dd"),
        })

        if (!isMounted) {
          return
        }

        setEvents(data)
      } catch (err: any) {
        if (!isMounted) {
          return
        }

        const message =
          err?.response?.data?.message ??
          err?.message ??
          "No se pudo cargar el calendario académico"

        setError(message)
        setEvents([])
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchEvents()

    return () => {
      isMounted = false
    }
  }, [currentDate])

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
    setSelectedDate(null)
  }

  const getEventsForDate = (date: Date) =>
    events.filter((event) => {
      const eventDate = getEventDate(event)
      if (!eventDate) return false

      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const upcomingEvents = useMemo(() => {
    const now = Date.now()

    return events
      .filter((event) => {
        const eventDate = getEventDate(event)
        return eventDate ? eventDate.getTime() >= now : false
      })
      .sort((a, b) => {
        const dateA = getEventDate(a)?.getTime() ?? 0
        const dateB = getEventDate(b)?.getTime() ?? 0
        return dateA - dateB
      })
      .slice(0, 3)
  }, [events])

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Calendario académico</CardTitle>
          <CardDescription>Eventos sincronizados desde Moodle filtrados por tu usuario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Mes anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <CardTitle className="text-lg">
                  {format(currentDate, "MMMM yyyy", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())}
                </CardTitle>
                <CardDescription>Selecciona un día para ver más detalles</CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Mes siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sincronizando con Moodle...
                </span>
              ) : (
                `${events.length} evento${events.length === 1 ? "" : "s"} en este rango`
              )}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {["D", "L", "M", "M", "J", "V", "S"].map((day, i) => (
              <div key={i} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: getDay(monthStart) }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 md:h-16 p-1" />
            ))}

            {days.map((day) => {
              const dayEvents = getEventsForDate(day)
              const hasEvents = dayEvents.length > 0
              const isSelected =
                selectedDate &&
                selectedDate.getDate() === day.getDate() &&
                selectedDate.getMonth() === day.getMonth() &&
                selectedDate.getFullYear() === day.getFullYear()

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={`h-12 md:h-16 w-full rounded-md border text-left p-1 text-sm transition-colors ${
                    isSelected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="font-medium">{format(day, "d")}</div>
                  {hasEvents && <div className="mt-1 h-1.5 w-full rounded-full bg-sky-500" />}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {format(selectedDate, "EEEE, d 'de' MMMM, yyyy", { locale: es })}
            </CardTitle>
            <CardDescription>
              {isLoading
                ? "Cargando actividades..."
                : selectedDateEvents.length > 0
                  ? `${selectedDateEvents.length} actividad${
                      selectedDateEvents.length === 1 ? "" : "es"
                    } programada${selectedDateEvents.length === 1 ? "" : "s"}`
                  : "No se registran actividades para este día"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando información...
              </div>
            )}
            {!isLoading && selectedDateEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay eventos para este día. Selecciona otra fecha o vuelve más tarde.
              </p>
            )}
            {!isLoading &&
              selectedDateEvents.map((event) => {
                const badge = getEventBadgeMeta(event)
                const sanitizedDescription = sanitizeEventDescription(event.descripcion)
                return (
                  <div
                    key={event.event_id}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow space-y-2"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="font-semibold leading-tight">{event.titulo}</h3>
                        {event.curso && <p className="text-sm text-muted-foreground">{event.curso}</p>}
                      </div>
                      <Badge className={badge.className}>{badge.label}</Badge>
                    </div>
                    {sanitizedDescription ? (
                      <div
                        className="text-sm text-muted-foreground leading-relaxed space-y-1"
                        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                      />
                    ) : null}
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{formatEventTimeRange(event)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{event.ubicacion || (event.origen === "curso" ? "Aula virtual" : "Por definir")}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Próximos eventos importantes</CardTitle>
          <CardDescription>Fechas relevantes de las siguientes semanas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Buscando eventos próximos...
            </div>
          )}

          {!isLoading && upcomingEvents.length === 0 && (
            <p className="text-sm text-muted-foreground">No se encontraron eventos próximos en Moodle.</p>
          )}

          {!isLoading &&
            upcomingEvents.map((event) => {
              const badge = getEventBadgeMeta(event)
              const eventDate = getEventDate(event)
              const sanitizedDescription = sanitizeEventDescription(event.descripcion)

              return (
                <div
                  key={`upcoming-${event.event_id}`}
                  className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-11 h-11 flex flex-col items-center justify-center bg-primary/5 rounded-md border border-primary/20">
                    <span className="text-xs font-semibold text-primary">
                      {eventDate ? format(eventDate, "MMM", { locale: es }) : "--"}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {eventDate ? format(eventDate, "d") : "--"}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-medium text-sm leading-tight">{event.titulo}</h4>
                      <Badge className={badge.className}>{badge.label}</Badge>
                    </div>
                    {event.curso && <p className="text-xs uppercase text-muted-foreground">{event.curso}</p>}
                    {sanitizedDescription ? (
                      <div
                        className="text-sm text-muted-foreground line-clamp-3 [&_a]:text-primary [&_a]:underline"
                        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                      />
                    ) : null}
                    <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatEventTimeRange(event)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.ubicacion || (event.origen === "curso" ? "Aula virtual" : "Por definir")}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
        </CardContent>
      </Card>
    </div>
  )
}
