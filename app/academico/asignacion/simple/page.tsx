"use client"

import { useState, useEffect } from "react"

import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import type { Student } from "@/services/students"
import { fetchEnrolledStudents } from "@/services/students"
import StudentCards from "@/components/views/student-cards"
import { StudentAssignmentView } from "@/components/views/student-assignment-view"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import { exportarYDescargarCursos } from "@/services/courses"
import { CourseBasedAssignment } from "@/components/views/course-based-assignment-NEW"
import { useToast } from "@/components/ui/use-toast"

export default function AssignmentPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [downloadState, setDownloadState] = useState<'idle' | 'processing' | 'downloading'>('idle')
  const [showCourseBasedAssignment, setShowCourseBasedAssignment] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    ;(async () => {
      try {
        setLoadingProgress(10)
        const data = await fetchEnrolledStudents()
        setLoadingProgress(60)
        
        const active = data
          .filter((s: any) => s.is_active !== false && s.activo !== false && s.active !== false)
          .sort((a, b) => {
            const getTime = (d: string | null | undefined) => {
              const t = new Date(d ?? '').getTime()
              return isNaN(t) ? 0 : t
            }
            const byDate = getTime(b.startDate) - getTime(a.startDate)
            if (byDate !== 0) return byDate
            return Number(b.id) - Number(a.id)
          })
        
        setLoadingProgress(90)
        setStudents(active)
        console.log(`[INFO] ${active.length} estudiantes activos cargados`)
        setLoadingProgress(100)
      } catch (err) {
        console.error('[ERROR] Cargando estudiantes:', err)
        toast({
          title: "Error",
          description: "No se pudieron cargar los estudiantes",
          variant: "destructive",
        })
      } finally {
        setTimeout(() => setIsLoading(false), 200) // Pequeña demora para mostrar 100%
      }
    })()
  }, [])


  const selectedStudent = selectedStudentId
    ? students.find((s) => s.id === selectedStudentId)
    : null

  const handleExportCourses = async () => {
    if (!selectedStudent || downloadState !== 'idle') return;
    
    setDownloadState('processing');
    
    const processingToast = toast({
      title: "🔄 Procesando...",
      description: `Generando CSV para ${selectedStudent.name}...`,
      duration: 0, // No auto-dismiss
    });

    try {
      await exportarYDescargarCursos(selectedStudent.carnet);

      // Dismiss processing toast
      if (processingToast?.dismiss) {
        processingToast.dismiss();
      }
      
      setDownloadState('downloading');
      
      toast({
        title: "⬇️ Descargando...",
        description: `CSV de ${selectedStudent.name} se está descargando`,
        duration: 3000,
      });
      
      // Reset state after download indication
      setTimeout(() => setDownloadState('idle'), 3000);

    } catch (error: any) {
      console.error("Error exportando CSV:", error);
      
      // Dismiss processing toast
      if (processingToast?.dismiss) {
        processingToast.dismiss();
      }
      
      const errorMessage = error?.message || "Error al exportar cursos";
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      setDownloadState('idle');
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md w-full px-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Cargando estudiantes...</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">{loadingProgress}%</p>
        </div>
      </div>
    )
  }

  if (selectedStudent) {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="min-h-screen bg-gray-100">
          <div className="container mx-auto p-4">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <Button onClick={() => setSelectedStudentId(null)} variant="outline" className="bg-transparent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Estudiantes
                </Button>
                <Button onClick={handleExportCourses} variant="outline" className="bg-blue-50 hover:bg-blue-100" disabled={downloadState !== 'idle'}>
                  {downloadState === 'idle' && (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar CSV
                    </>
                  )}
                  {downloadState === 'processing' && (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      Procesando...
                    </>
                  )}
                  {downloadState === 'downloading' && (
                    <>
                      <div className="h-4 w-4 mr-2 animate-bounce">⬇️</div>
                      Descargando...
                    </>
                  )}
                </Button>
              </div>
              <h1 className="text-3xl font-bold">Asignación de Cursos - {selectedStudent.name}</h1>
              <p className="text-gray-600 mt-2">Carnet: {selectedStudent.carnet} | Programa: {selectedStudent.program}</p>
            </div>
            <StudentAssignmentView student={selectedStudent} />
          </div>
        </div>
      </DndProvider>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        {!showCourseBasedAssignment ? (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Asignación de Cursos</h1>
                <p className="text-gray-600 mt-2">Selecciona estudiantes para asignar cursos</p>
              </div>
              <Button
                onClick={() => setShowCourseBasedAssignment(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                Asignación por Cursos
              </Button>
            </div>
            <StudentCards students={students} onViewAssignment={setSelectedStudentId} />
          </>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Asignación por Cursos</h1>
                <p className="text-gray-600 mt-2">Selecciona cursos para encontrar estudiantes compatibles</p>
              </div>
              <Button
                onClick={() => setShowCourseBasedAssignment(false)}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Asignación por Estudiantes
              </Button>
            </div>
            {/* Componente de asignación por cursos */}
            <CourseBasedAssignment students={students} />
          </>
        )}
      </div>
    </div>
  )
}
