"use client"

import { useState } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { StudentsView } from "@/components/views/students-view"
import { StudentAssignmentView } from "@/components/views/student-assignment-view"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export interface Course {
  id: string
  name: string
  code: string
  type: "Básico" | "Optativo" | "Especialización"
  description: string
}

export interface Student {
  id: string
  name: string
  carnet: string
  program: string
  specialty: string
  assignedCourses: string[]
  completedCourses: string[]
}

const initialCourses: Course[] = [
  { id: "1", name: "Estadística I", code: "EST101", type: "Básico", description: "Fundamentos de estadística" },
  { id: "2", name: "Finanzas I", code: "FIN101", type: "Básico", description: "Principios de finanzas" },
  { id: "3", name: "Marketing Digital", code: "MKT201", type: "Optativo", description: "Estrategias de marketing digital" },
  { id: "4", name: "Liderazgo", code: "LID301", type: "Especialización", description: "Desarrollo de liderazgo" },
  { id: "5", name: "Planeación Estratégica", code: "PLA301", type: "Especialización", description: "Planificación empresarial" },
  { id: "6", name: "Matemática", code: "MAT101", type: "Básico", description: "Matemáticas básicas" },
  { id: "7", name: "Física", code: "FIS101", type: "Básico", description: "Principios de física" },
  { id: "8", name: "Sociales", code: "SOC101", type: "Optativo", description: "Ciencias sociales" },
]

const initialStudents: Student[] = [
  {
    id: "1",
    name: "Juan Pérez",
    carnet: "2024001",
    program: "Ingeniería",
    specialty: "Sistemas",
    assignedCourses: ["1", "6"],
    completedCourses: ["2"],
  },
  {
    id: "2",
    name: "Byron Caal",
    carnet: "2024002",
    program: "MBA",
    specialty: "Administración",
    assignedCourses: ["6", "7"],
    completedCourses: ["8", "3"],
  },
  {
    id: "3",
    name: "María González",
    carnet: "2024003",
    program: "Ingeniería",
    specialty: "Industrial",
    assignedCourses: ["2"],
    completedCourses: ["4"],
  },
  {
    id: "4",
    name: "Carlos López",
    carnet: "2024004",
    program: "Ingeniería",
    specialty: "Sistemas",
    assignedCourses: ["3"],
    completedCourses: ["1"],
  },
  {
    id: "5",
    name: "Ana Rodríguez",
    carnet: "2024005",
    program: "MBA",
    specialty: "Finanzas",
    assignedCourses: ["4"],
    completedCourses: ["2", "6"],
  },
]

export default function CourseAssignmentDashboard() {
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<"main" | "assignment">("main")

  const handleCourseAssignment = (studentId: string, courseId: string, isAssigned: boolean) => {
    setStudents(prev =>
      prev.map(student => {
        if (student.id === studentId) {
          const updatedCourses = isAssigned
            ? [...student.assignedCourses, courseId]
            : student.assignedCourses.filter(id => id !== courseId)
          return { ...student, assignedCourses: updatedCourses }
        }
        return student
      })
    )
  }

  const handleBulkAssignment = (studentIds: string[], courseIds: string[], isAssigned: boolean) => {
    setStudents(prev =>
      prev.map(student => {
        if (studentIds.includes(student.id)) {
          let updated = [...student.assignedCourses]
          courseIds.forEach(courseId => {
            if (isAssigned) {
              if (!updated.includes(courseId)) updated.push(courseId)
            } else {
              updated = updated.filter(id => id !== courseId)
            }
          })
          return { ...student, assignedCourses: updated }
        }
        return student
      })
    )
  }

  const handleViewAssignment = (studentId: string) => {
    setSelectedStudentId(studentId)
    setCurrentView("assignment")
  }

  const handleBackToMain = () => {
    setCurrentView("main")
    setSelectedStudentId(null)
  }

  const selectedStudent = selectedStudentId ? students.find(s => s.id === selectedStudentId) : null

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
              courses={initialCourses}
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
          courses={initialCourses}
          onViewAssignment={handleViewAssignment}
          onBulkAssignment={handleBulkAssignment}
        />
      </div>
    </div>
  )
}

