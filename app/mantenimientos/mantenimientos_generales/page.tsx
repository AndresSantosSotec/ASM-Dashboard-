"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar, ChevronLeft, ChevronRight, Loader2, Clock, BookOpen, CalendarDays, X } from "lucide-react"
import { fetchProgramacionCursos, getUniqueMonths, type ProgramacionCurso } from "@/services/programacionCursos"
//
//
//
//"/mantenimientos/mantenimientos_generales"
interface DayModalData {
  day: number
  courses: ProgramacionCurso[]
  monthYear: string
}

export default function ProgramacionCursosPage() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [currentView, setCurrentView] = useState<"month" | "week">("month")
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<DayModalData | null>(null)
  const [allCourses, setAllCourses] = useState<ProgramacionCurso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  // Cargar cursos al montar el componente
  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await fetchProgramacionCursos()
      setAllCourses(data)
    } catch (error) {
      console.error("Error loading courses:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calcular información del calendario dinámicamente
  const calendarInfo = useMemo(() => {
    if (!currentDate) return { monthName: "", firstDayOffset: 0, totalDays: 0, month: 0, year: 0 };
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Nombres de meses en español
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]

    // Obtener el primer día del mes (0 = Domingo, 1 = Lunes, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    // Ajustar para que Lunes sea 0 (0 = Lunes, 6 = Domingo)
    const firstDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

    // Obtener el total de días en el mes
    const totalDays = new Date(year, month + 1, 0).getDate()

    return {
      monthName: `${monthNames[month]} ${year}`,
      firstDayOffset,
      totalDays,
      month,
      year
    }
  }, [currentDate])

  // Generar días del calendario
  const calendarDays = Array.from({ length: calendarInfo.totalDays }, (_, i) => i + 1)
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  // Filtrar cursos del mes actual
  const currentMonthCourses = useMemo(() => {
    return allCourses.filter(course => {
      const courseMonth = `${course.mes} ${course.anio}`
      const currentMonth = `${calendarInfo.monthName}`
      return courseMonth === currentMonth
    })
  }, [allCourses, calendarInfo.monthName])

  // Obtener cursos para un día específico
  const getCoursesForDay = (day: number): ProgramacionCurso[] => {
    if (!day) return []

    return currentMonthCourses.filter(course => {
      if (!course.fecha_inicio || !course.fecha_fin) return false

      const startDate = new Date(course.fecha_inicio)
      const endDate = new Date(course.fecha_fin)
      const checkDate = new Date(calendarInfo.year, calendarInfo.month, day)

      // Verificar que la fecha esté en el rango
      if (checkDate < startDate || checkDate > endDate) return false

      // Verificar que el día de la semana coincida con el día de la semana del curso
      const dayOfWeek = checkDate.getDay() // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

      // Mapeo de días de la semana en español al número correspondiente
      const dayToNumber: { [key: string]: number } = {
        "Domingo": 0,
        "Lunes": 1,
        "Martes": 2,
        "Miércoles": 3,
        "Jueves": 4,
        "Viernes": 5,
        "Sábado": 6
      }

      // Verificar que el día de la semana del curso coincide con el día de la semana de la fecha
      return dayOfWeek === dayToNumber[course.dia_semana]
    })
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDayClick = (day: number) => {
    const dayCourses = getCoursesForDay(day)
    setSelectedDay({
      day,
      courses: dayCourses,
      monthYear: calendarInfo.monthName
    })
    setIsModalOpen(true)
  }

  const formatFullDate = (day: number, monthYear: string): string => {
    const date = new Date(calendarInfo.year, calendarInfo.month, day)
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  // Get today's date for highlighting
  const today = new Date()
  const todayDay = today.getDate()
  const todayMonth = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(today)
  const todayMonthCapitalized = todayMonth.charAt(0).toUpperCase() + todayMonth.slice(1)
  const todayYear = today.getFullYear()
  const isCurrentMonth = calendarInfo.monthName === `${todayMonthCapitalized} ${todayYear}`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }


  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Programación de Cursos</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Total: {currentMonthCourses.length} cursos</span>
        </div>
      </div>

      {/* Calendar View */}
      <Card className="shadow-lg">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
                className="hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle>{calendarInfo.monthName}</CardTitle>
              <Button variant="outline" size="icon" onClick={handleNextMonth} className="hover:bg-white">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {weekDays.map((day) => (
                <div key={day} className="bg-white p-2 text-center font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {/* Empty cells for the offset */}
              {Array.from({ length: calendarInfo.firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-gray-50 p-2 min-h-[100px]" />
              ))}

              {calendarDays.map((day) => {
                const dayCourses = getCoursesForDay(day)
                const isToday = isCurrentMonth && day === todayDay
                const hasCourses = dayCourses.length > 0

                return (
                  <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[100px] p-2 transition-all cursor-pointer ${isToday
                      ? 'bg-blue-50 border-blue-400 border-2'
                      : hasCourses
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-white hover:bg-gray-50'
                      }`}
                  >
                    <div className={`text-right mb-1 ${isToday
                      ? 'font-bold text-blue-600'
                      : 'text-gray-600'
                      }`}>
                      <span className={`text-sm ${isToday ? 'bg-blue-600 text-white px-2 py-0.5 rounded-full' : ''
                        }`}>
                        {day}
                      </span>
                    </div>

                    {/* Courses for this day */}
                    <div className="space-y-1 overflow-y-auto max-h-[70px]">
                      {dayCourses.slice(0, 2).map((course, idx) => (
                        <div
                          key={course.courseid}
                          className={`text-xs p-1.5 rounded ${idx === 0 ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                            } hover:opacity-80 transition-opacity`}
                          title={course.coursename}
                        >
                          <div className="font-medium truncate">
                            {course.coursename.length > 15
                              ? `${course.coursename.substring(0, 15)}...`
                              : course.coursename}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Show +X more indicator if there are many courses */}
                    {dayCourses.length > 2 && (
                      <div className="text-[10px] text-blue-600 text-center mt-1 font-semibold">
                        +{dayCourses.length - 2} más
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {currentMonthCourses.length === 0 && (
            <div className="text-center py-12 text-gray-500 mt-4">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No hay cursos programados para este mes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center">
              <CalendarDays className="h-6 w-6 mr-2 text-blue-600" />
              {selectedDay && formatFullDate(selectedDay.day, selectedDay.monthYear)}
            </DialogTitle>
            <DialogDescription>
              {selectedDay && selectedDay.courses.length > 0 ? (
                <span className="text-base">
                  {selectedDay.courses.length} {selectedDay.courses.length === 1 ? 'curso programado' : 'cursos programados'} para este día
                </span>
              ) : (
                <span className="text-base text-gray-500">No hay cursos programados para este día</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedDay && selectedDay.courses.length > 0 ? (
              selectedDay.courses.map((course, index) => {
                const colors = [
                  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' },
                  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600' },
                  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', icon: 'text-purple-600' },
                  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'text-orange-600' },
                  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', icon: 'text-pink-600' },
                ]
                const color = colors[index % colors.length]

                return (
                  <div
                    key={course.courseid}
                    className={`${color.bg} border-2 ${color.border} rounded-lg p-5 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <BookOpen className={`h-6 w-6 ${color.icon} mt-1 flex-shrink-0`} />
                        <div className="flex-1">
                          <h3 className={`font-bold text-lg ${color.text} mb-2`}>
                            {course.coursename}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <span className="font-semibold mr-2">ID del Curso:</span>
                            <span className="bg-white px-2 py-0.5 rounded">{course.courseid}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <CalendarDays className="h-4 w-4 text-gray-600 mr-2" />
                          <span className="font-semibold text-sm text-gray-700">Fecha de Inicio</span>
                        </div>
                        <p className="text-gray-800 font-medium">
                          {course.fecha_inicio
                            ? new Date(course.fecha_inicio).toLocaleDateString('es-GT', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                            : 'No disponible'}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <CalendarDays className="h-4 w-4 text-gray-600 mr-2" />
                          <span className="font-semibold text-sm text-gray-700">Fecha de Finalización</span>
                        </div>
                        <p className="text-gray-800 font-medium">
                          {course.fecha_fin
                            ? new Date(course.fecha_fin).toLocaleDateString('es-GT', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                            : 'No disponible'}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <Clock className="h-4 w-4 text-gray-600 mr-2" />
                          <span className="font-semibold text-sm text-gray-700">Día de la Semana</span>
                        </div>
                        <p className={`font-bold ${color.text}`}>
                          {course.dia_semana}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center mb-2">
                          <Calendar className="h-4 w-4 text-gray-600 mr-2" />
                          <span className="font-semibold text-sm text-gray-700">Mes y Año</span>
                        </div>
                        <p className="text-gray-800 font-medium">
                          {course.mes} {course.anio}
                        </p>
                      </div>
                    </div>

                    {/* Duration Calculator */}
                    {course.fecha_inicio && course.fecha_fin && (
                      <div className="mt-4 bg-white rounded-lg p-3 border border-gray-200">
                        <span className="font-semibold text-sm text-gray-700">Duración del Curso: </span>
                        <span className="text-gray-800 font-medium">
                          {(() => {
                            const start = new Date(course.fecha_inicio)
                            const end = new Date(course.fecha_fin)
                            const diffTime = Math.abs(end.getTime() - start.getTime())
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                            const weeks = Math.floor(diffDays / 7)
                            const days = diffDays % 7

                            if (weeks > 0) {
                              return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}${days > 0 ? ` y ${days} ${days === 1 ? 'día' : 'días'}` : ''}`
                            }
                            return `${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay cursos programados para este día</p>
                <p className="text-gray-400 text-sm mt-2">Selecciona otro día del calendario para ver los cursos disponibles</p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t">
            <Button onClick={() => setIsModalOpen(false)} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-md">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-600" />
              Próximos Inicios
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {currentMonthCourses
                .sort((a, b) => {
                  const dateA = new Date(a.fecha_inicio).getTime()
                  const dateB = new Date(b.fecha_inicio).getTime()
                  return dateA - dateB
                })
                .slice(0, 5)
                .map((course, index) => {
                  const colors = [
                    { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
                    { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
                    { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
                    { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
                    { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
                  ]
                  const color = colors[index % colors.length]

                  return (
                    <div
                      key={course.courseid}
                      className={`flex items-start p-3 ${color.bg} border ${color.border} rounded-lg hover:shadow-md transition-shadow cursor-pointer`}
                      onClick={() => {
                        const courseDate = new Date(course.fecha_inicio)
                        handleDayClick(courseDate.getDate())
                      }}
                    >
                      <div className={`${color.text} mr-3 mt-1 flex-shrink-0`}>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {new Date(course.fecha_inicio).getDate()}
                          </div>
                          <div className="text-xs uppercase">
                            {new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(new Date(course.fecha_inicio))}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 line-clamp-2">{course.coursename}</h4>
                        <p className="text-xs text-gray-600 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {course.dia_semana}
                        </p>
                      </div>
                    </div>
                  )
                })}

              {currentMonthCourses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay próximos inicios</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Resumen por Día de la Semana
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => {
                const count = currentMonthCourses.filter(c => c.dia_semana === day).length
                const hasClasses = count > 0

                return (
                  <div
                    key={day}
                    className={`p-4 rounded-lg text-center transition-all border-2 ${hasClasses
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-md'
                      : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <h4 className="font-semibold text-sm mb-2">{day.slice(0, 3)}</h4>
                    <p className={`text-3xl font-bold mb-1 ${hasClasses ? 'text-green-600' : 'text-gray-400'
                      }`}>
                      {count}
                    </p>
                    <p className="text-xs text-gray-600">
                      {count === 1 ? 'curso' : 'cursos'}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}