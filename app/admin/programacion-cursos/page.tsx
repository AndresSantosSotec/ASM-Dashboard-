"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar, ChevronLeft, ChevronRight, Loader2, Clock, BookOpen, CalendarDays, X } from "lucide-react"
import { fetchProgramacionCursos, getUniqueMonths, type ProgramacionCurso } from "@/services/programacionCursos"

interface DayModalData {
  day: number
  courses: ProgramacionCurso[]
  monthYear: string
}

export default function ProgramacionCursosPage() {
  const [currentMonth, setCurrentMonth] = useState<string>("")
  const [courses, setCourses] = useState<ProgramacionCurso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
  const [selectedDay, setSelectedDay] = useState<DayModalData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch courses from backend
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true)
        const data = await fetchProgramacionCursos()
        setCourses(data)

        // Get unique months and set the first one as current
        const months = getUniqueMonths(data)
        setAvailableMonths(months)

        // Calculate current month and select if exists
        const now = new Date()
        const monthNameRaw = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(now)
        const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1)
        const year = String(now.getFullYear())
        const currentKey = `${monthName} ${year}`

        let initialIndex = 0
        if (months.length > 0) {
          const found = months.indexOf(currentKey)
          initialIndex = found >= 0 ? found : 0
          setCurrentMonth(months[initialIndex])
          setCurrentMonthIndex(initialIndex)
        }
      } catch (err) {
        console.error('Error loading courses:', err)
        setError((err as Error).message || 'Error al cargar los cursos')
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    if (!currentMonth) return []

    const [mesName, anioStr] = currentMonth.split(' ')
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const monthIndex = meses.indexOf(mesName)
    const year = parseInt(anioStr)

    const firstDay = new Date(year, monthIndex, 1)
    const lastDay = new Date(year, monthIndex + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay()
    // Convert to Monday = 0, Sunday = 6
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    const days = []
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  // Get courses for a specific day
  const getCoursesForDay = (day: number | null) => {
    if (!day) return []
    
    return courses.filter(course => {
      if (!course.fecha_inicio) return false
      
      const courseDate = new Date(course.fecha_inicio)
      const courseDay = courseDate.getDate()
      const courseMonthYear = `${course.mes} ${course.anio}`
      
      return courseDay === day && courseMonthYear === currentMonth
    })
  }

  // Handle day click
  const handleDayClick = (day: number | null) => {
    if (!day) return
    
    const dayCourses = getCoursesForDay(day)
    setSelectedDay({
      day,
      courses: dayCourses,
      monthYear: currentMonth
    })
    setIsModalOpen(true)
  }

  const handlePreviousMonth = () => {
    if (currentMonthIndex > 0) {
      const newIndex = currentMonthIndex - 1
      setCurrentMonthIndex(newIndex)
      setCurrentMonth(availableMonths[newIndex])
    }
  }

  const handleNextMonth = () => {
    if (currentMonthIndex < availableMonths.length - 1) {
      const newIndex = currentMonthIndex + 1
      setCurrentMonthIndex(newIndex)
      setCurrentMonth(availableMonths[newIndex])
    }
  }

  // Format date for display
  const formatFullDate = (day: number, monthYear: string) => {
    const [mes, anio] = monthYear.split(' ')
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const monthIndex = meses.indexOf(mes)
    const date = new Date(parseInt(anio), monthIndex, day)
    
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando programación de cursos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Error al cargar los cursos</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  const calendarDays = generateCalendarDays()
  const currentMonthCourses = courses.filter(course => {
    const courseMonth = `${course.mes} ${course.anio}`
    return courseMonth === currentMonth
  })

  // Get today's date for highlighting
  const today = new Date()
  const todayDay = today.getDate()
  const todayMonth = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(today)
  const todayMonthCapitalized = todayMonth.charAt(0).toUpperCase() + todayMonth.slice(1)
  const todayYear = today.getFullYear()
  const isCurrentMonth = currentMonth === `${todayMonthCapitalized} ${todayYear}`

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
                disabled={currentMonthIndex === 0}
                className="hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl font-bold text-gray-800">
                {currentMonth || 'Seleccione un mes'}
              </CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                disabled={currentMonthIndex === availableMonths.length - 1}
                className="hover:bg-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Calendar Grid */}
          <div className="mb-4">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const dayCourses = getCoursesForDay(day)
                const isToday = isCurrentMonth && day === todayDay
                const hasCourses = dayCourses.length > 0

                return (
                  <div
                    key={index}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[120px] border rounded-lg p-2 transition-all ${
                      day === null 
                        ? 'bg-gray-50' 
                        : isToday
                        ? 'bg-blue-50 border-blue-400 border-2 cursor-pointer hover:shadow-lg'
                        : hasCourses
                        ? 'bg-white hover:shadow-md cursor-pointer border-gray-200 hover:border-blue-300'
                        : 'bg-white border-gray-100 cursor-pointer hover:bg-gray-50'
                    }`}
                  >
                    {day && (
                      <>
                        <div className={`text-right mb-1 ${
                          isToday 
                            ? 'font-bold text-blue-600' 
                            : 'text-gray-600'
                        }`}>
                          <span className={`text-sm ${
                            isToday ? 'bg-blue-600 text-white px-2 py-0.5 rounded-full' : ''
                          }`}>
                            {day}
                          </span>
                        </div>
                        
                        {/* Courses for this day */}
                        <div className="space-y-1 overflow-y-auto max-h-[90px]">
                          {dayCourses.slice(0, 3).map((course, idx) => (
                            <div
                              key={course.courseid}
                              className={`text-xs p-1.5 rounded ${
                                idx === 0 ? 'bg-blue-100 text-blue-800' :
                                idx === 1 ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              } hover:opacity-80 transition-opacity`}
                              title={course.coursename}
                            >
                              <div className="font-medium truncate">
                                {course.coursename}
                              </div>
                              <div className="flex items-center text-[10px] mt-0.5 opacity-75">
                                <Clock className="h-2.5 w-2.5 mr-1" />
                                {course.dia_semana}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Show +X more indicator if there are many courses */}
                        {dayCourses.length > 3 && (
                          <div className="text-[10px] text-blue-600 text-center mt-1 font-semibold">
                            +{dayCourses.length - 3} más
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {currentMonthCourses.length === 0 && (
            <div className="text-center py-12 text-gray-500">
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
                    className={`p-4 rounded-lg text-center transition-all border-2 ${
                      hasClasses 
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-md' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <h4 className="font-semibold text-sm mb-2">{day.slice(0, 3)}</h4>
                    <p className={`text-3xl font-bold mb-1 ${
                      hasClasses ? 'text-green-600' : 'text-gray-400'
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