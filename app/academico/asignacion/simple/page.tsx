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
import {
  fetchEnrolledStudentsWithCourses,
  assignCourses,
  unassignCourses,
} from "@/services/students"
import { fetchProgramCourses } from "@/services/courses"

export default function CourseAssignmentDashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<"main" | "assignment">("main")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const st = await fetchEnrolledStudentsWithCourses()
        const programIds = Array.from(
          new Set(st.map((s) => s.programId).filter((id) => id > 0)),
        )
        const coursesLists = await Promise.all(
          programIds.map((id) => fetchProgramCourses(id)),
        )
        const cr = Array.from(
          new Map(coursesLists.flat().map((c) => [c.id, c])).values(),
        )
        setStudents(st)
        setCourses(cr)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])


  const handleBulkAssignment = async (
    studentIds: string[],
    courseIds: string[],
    isAssigned: boolean,
  ) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (studentIds.includes(student.id)) {
          let updated = [...student.assignedCourses]
          let updatedNames = [...student.assignedCourseNames]
          courseIds.forEach((courseId) => {
            const course = courses.find((c) => c.id === Number(courseId))
            const courseName = course?.name ?? ''
            if (isAssigned) {
              if (!updated.includes(courseId)) {
                updated.push(courseId)
                if (courseName && !updatedNames.includes(courseName)) {
                  updatedNames.push(courseName)
                }
              }
            } else {
              updated = updated.filter((id) => id !== courseId)
              updatedNames = updatedNames.filter((n) => n !== courseName)
            }
          })
          return {
            ...student,
            assignedCourses: updated,
            assignedCourseNames: updatedNames,
          }
        }
        return student
      }),
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

  const handleCoursesChange = (
    studentId: string,
    assignedIds: string[],
    names: string[],
  ) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              assignedCourses: assignedIds,
              assignedCourseNames: names,
            }
          : s,
      ),
    )
  }

  const selectedStudent = selectedStudentId ? students.find((s) => s.id === selectedStudentId) : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

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
              programCourses={courses.filter((c) =>
                c.programIds.includes(selectedStudent.programId)
              )}
              onCoursesChange={(ids, names) =>
                handleCoursesChange(selectedStudent.id, ids, names)
              }
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

