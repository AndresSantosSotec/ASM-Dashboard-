"use client"


import { useState, useEffect } from "react"

import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { StudentsView } from "@/components/views/students-view"
import { StudentAssignmentView } from "@/components/views/student-assignment-view"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

import type { Student } from "@/services/students"
import type { Course } from "@/services/courses"
import { fetchEnrolledStudents, assignCourses, unassignCourses } from "@/services/students"
import { fetchCourses } from "@/services/courses"

export default function CourseAssignmentDashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<"main" | "assignment">("main")

  useEffect(() => {
    ;(async () => {
      try {
        const [st, cr] = await Promise.all([fetchEnrolledStudents(), fetchCourses()])
        setStudents(st)
        setCourses(cr)
      } catch (err) {
        console.error(err)
      }
    })()
  }, [])

  const handleCourseAssignment = async (studentId: string, courseId: string, isAssigned: boolean) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id === studentId) {
          const updated = isAssigned
            ? [...student.assignedCourses, courseId]
            : student.assignedCourses.filter((id) => id !== courseId)
          return { ...student, assignedCourses: updated }

        }
        return student
      })
    )


    try {
      if (isAssigned) {
        await assignCourses([studentId], [courseId])
      } else {
        await unassignCourses([studentId], [courseId])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleBulkAssignment = async (studentIds: string[], courseIds: string[], isAssigned: boolean) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (studentIds.includes(student.id)) {
          let updated = [...student.assignedCourses]
          courseIds.forEach((courseId) => {
            if (isAssigned) {
              if (!updated.includes(courseId)) updated.push(courseId)
            } else {
              updated = updated.filter((id) => id !== courseId)

            }
          })
          return { ...student, assignedCourses: updated }
        }
        return student
      })
    )
    try {
      if (isAssigned) {
        await assignCourses(studentIds, courseIds)
      } else {
        await unassignCourses(studentIds, courseIds)
      }
    } catch (err) {
      console.error(err)
    }

  }

  const handleViewAssignment = (studentId: string) => {
    setSelectedStudentId(studentId)
    setCurrentView("assignment")
  }

  const handleBackToMain = () => {
    setCurrentView("main")
    setSelectedStudentId(null)
  }


  const selectedStudent = selectedStudentId ? students.find((s) => s.id === selectedStudentId) : null


  if (currentView === "assignment" && selectedStudent) {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="min-h-screen bg-gray-100">
          <div className="container mx-auto p-4">
            <div className="mb-6">
              <Button onClick={handleBackToMain} variant="outline" className="mb-4 bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Estudiantes
              </Button>
              <h1 className="text-3xl font-bold">Asignación de Cursos - {selectedStudent.name}</h1>
            </div>
            <StudentAssignmentView
              student={selectedStudent}

              courses={courses}

              onCourseAssignment={handleCourseAssignment}
            />
          </div>
        </div>
      </DndProvider>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-6">Dashboard de Gestión de Inscripciones</h1>
        <StudentsView
          students={students}

          courses={courses}

          onViewAssignment={handleViewAssignment}
          onBulkAssignment={handleBulkAssignment}
        />
      </div>
    </div>
  )
}

