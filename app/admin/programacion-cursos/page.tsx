"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchProgramacionCursos, getUniqueMonths, type ProgramacionCurso } from "@/services/programacionCursos"

export default function ProgramacionCursosPage() {
  const [currentMonth, setCurrentMonth] = useState<string>("")
  const [currentView, setCurrentView] = useState<"month" | "week">("month")
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false)
  const [courses, setCourses] = useState<ProgramacionCurso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

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
        if (months.length > 0) {
          setCurrentMonth(months[0])
          setCurrentMonthIndex(0)
        }
      } catch (err: any) {
        console.error('Error loading courses:', err)
        setError(err.message || 'Error al cargar los cursos')
      } finally {
        setLoading(false)
      }
    }
    
    loadCourses()
  }, [])

  // Filter courses for the current month
  const currentMonthCourses = courses.filter(course => {
    const courseMonth = `${course.mes} ${course.anio}`
    return courseMonth === currentMonth
  })

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Programación de Cursos</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentView("month")}>
            Mensual
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentView("week")}>
            Semanal
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePreviousMonth}
                disabled={currentMonthIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle>{currentMonth || 'Seleccione un mes'}</CardTitle>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleNextMonth}
                disabled={currentMonthIndex === availableMonths.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Total de cursos: {currentMonthCourses.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentView === "month" ? (
            <div className="space-y-6">
              {/* Group courses by day of the week */}
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => {
                const dayCourses = currentMonthCourses.filter(course => course.dia_semana === day)
                
                if (dayCourses.length === 0) return null
                
                return (
                  <div key={day} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                      {day}
                      <span className="ml-2 text-sm text-gray-500 font-normal">
                        ({dayCourses.length} {dayCourses.length === 1 ? 'curso' : 'cursos'})
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dayCourses.map((course) => (
                        <div
                          key={course.courseid}
                          className="p-3 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                          title={`${course.coursename}\nInicio: ${course.fecha_inicio}\nFin: ${course.fecha_fin}`}
                        >
                          <div className="font-medium text-sm text-blue-900 mb-1 line-clamp-2">
                            {course.coursename}
                          </div>
                          <div className="text-xs text-blue-700 space-y-1">
                            <div className="flex items-center">
                              <span className="font-medium">Inicio:</span>
                              <span className="ml-1">{course.fecha_inicio ? new Date(course.fecha_inicio).toLocaleDateString('es-GT') : 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium">Fin:</span>
                              <span className="ml-1">{course.fecha_fin ? new Date(course.fecha_fin).toLocaleDateString('es-GT') : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              
              {currentMonthCourses.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No hay cursos programados para este mes</p>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-md">
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Vista semanal en desarrollo</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Próximos Inicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentMonthCourses.slice(0, 5).map((course, index) => {
                const colors = [
                  { bg: 'bg-blue-50', text: 'text-blue-500' },
                  { bg: 'bg-green-50', text: 'text-green-500' },
                  { bg: 'bg-purple-50', text: 'text-purple-500' },
                  { bg: 'bg-orange-50', text: 'text-orange-500' },
                  { bg: 'bg-pink-50', text: 'text-pink-500' },
                ]
                const color = colors[index % colors.length]
                
                return (
                  <div key={course.courseid} className={`flex items-start p-3 ${color.bg} rounded-md`}>
                    <Calendar className={`h-5 w-5 ${color.text} mr-3 mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{course.coursename}</h4>
                      <p className="text-sm text-gray-600">
                        Inicia: {course.fecha_inicio ? new Date(course.fecha_inicio).toLocaleDateString('es-GT', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        }) : 'Fecha no disponible'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Día: {course.dia_semana}
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumen por Día de la Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => {
                  const count = currentMonthCourses.filter(c => c.dia_semana === day).length
                  const hasClasses = count > 0
                  
                  return (
                    <div 
                      key={day} 
                      className={`p-3 rounded-md text-center ${hasClasses ? 'bg-green-50' : 'bg-gray-50'}`}
                    >
                      <h4 className="font-medium text-sm">{day}</h4>
                      <p className={`text-lg font-bold ${hasClasses ? 'text-green-600' : 'text-gray-400'}`}>
                        {count}
                      </p>
                      <p className="text-xs text-gray-600">
                        {count === 1 ? 'curso' : 'cursos'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

