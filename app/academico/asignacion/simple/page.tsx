"use client"

import { useState, useEffect } from "react"

import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import type { Student } from "@/services/students"
import { fetchEnrolledStudents } from "@/services/students"
import StudentCards from "@/components/views/student-cards"
import { StudentAssignmentView } from "@/components/views/student-assignment-view"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function AssignmentPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchEnrolledStudents()
        const active = data.filter(
          (s: any) => s.is_active !== false && s.activo !== false && s.active !== false,
        )
        setStudents(active)
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
              <Button onClick={() => setSelectedStudentId(null)} variant="outline" className="mb-4 bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Estudiantes
              </Button>
              <h1 className="text-3xl font-bold">Asignación de Cursos - {selectedStudent.name}</h1>
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
