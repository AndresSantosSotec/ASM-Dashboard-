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
import { useToast } from "@/components/ui/use-toast"

export default function AssignmentPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchEnrolledStudents()
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
        setStudents(active)
        console.log('[DEBUG] Estudiantes activos:', active)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])


  const selectedStudent = selectedStudentId
    ? students.find((s) => s.id === selectedStudentId)
    : null

  const handleExportCourses = async () => {
    if (!selectedStudent) return;
    
    toast({
      title: "Exportando...",
      description: `Generando CSV para ${selectedStudent.name}...`,
    });

    try {
      await exportarYDescargarCursos(selectedStudent.carnet);

      toast({
        title: "✅ Éxito",
        description: `CSV exportado para ${selectedStudent.name}`,
      });
    } catch (error: any) {
      console.error("Error exportando CSV:", error);
      const errorMessage = error?.message || "Error al exportar cursos";
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
                <Button onClick={handleExportCourses} variant="outline" className="bg-blue-50 hover:bg-blue-100">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar CSV
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
        <StudentCards students={students} onViewAssignment={setSelectedStudentId} />
      </div>
    </div>
  )
}
