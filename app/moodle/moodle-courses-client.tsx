"use client"

import { useEffect, useState } from "react"
import { fetchMoodleCourses, MoodleCourse, MOODLE_BASE_URL, MOODLE_TOKEN } from "@/services/moodle"
import MoodleCourseCard from "@/components/moodle/moodle-course-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"

export default function MoodleCoursesClient() {
  const [courses, setCourses] = useState<MoodleCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCourses = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Intentando conectar a Moodle...')
      console.log('📍 URL:', MOODLE_BASE_URL)
      console.log('🔑 Token configurado:', MOODLE_TOKEN ? 'Sí' : 'No')
      
      const data = await fetchMoodleCourses()
      
      console.log('✅ Cursos obtenidos:', data.length)
      console.log('📦 Datos:', data)
      
      setCourses(data)
      
      if (data.length === 0) {
        setError('No se encontraron cursos en Moodle')
      }
    } catch (err: any) {
      console.error("❌ Error fetching Moodle courses:", err)
      console.error("📋 Detalles del error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      })
      
      let errorMessage = 'Error al cargar los cursos de Moodle'
      
      if (err.response) {
        errorMessage = `Error ${err.response.status}: ${err.response.data?.message || err.message}`
      } else if (err.request) {
        errorMessage = 'No se pudo conectar con Moodle. Verifica la URL y la conexión de red.'
      } else {
        errorMessage = err.message || 'Error desconocido'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-muted-foreground">Cargando cursos desde Moodle...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadCourses}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (courses.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Sin cursos</AlertTitle>
        <AlertDescription>
          No se encontraron cursos en Moodle.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {courses.length} curso{courses.length !== 1 ? 's' : ''} encontrado{courses.length !== 1 ? 's' : ''}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadCourses}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(course => (
          <MoodleCourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  )
}
