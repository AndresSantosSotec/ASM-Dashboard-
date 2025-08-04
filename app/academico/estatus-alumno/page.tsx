"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { fetchEnrolledStudents } from "@/services/students"
import {
  fetchStudentAcademicStatus,
  AcademicStatus,
} from "@/services/moodleCourseQueries"

interface Student {
  id: string
  carnet: string
  name: string
  program: string
  semester: number
  enrollmentDate: string
  status: "active" | "inactive" | "graduated" | "on_leave"
}

interface Course {
  id: number
  name: string
  period: string
  state: string
  grade: number | null
}

export default function EstatusAcademico() {
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [status, setStatus] = useState<AcademicStatus | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchEnrolledStudents()
        const mapped: Student[] = data.map((s) => ({
          id: s.id,
          carnet: s.carnet,
          name: s.name,
          program: s.program,
          semester: 0,
          enrollmentDate: new Date().toISOString(),
          status: "active",
        }))
        setStudents(mapped)
      } catch (err) {
        console.error(err)
      }
    })()
  }, [])

  useEffect(() => {
    if (!selectedStudent) return
    ;(async () => {
      try {
        const data = await fetchStudentAcademicStatus(selectedStudent.carnet)
        setStatus(data)
      } catch (err) {
        console.error(err)
      }
    })()
  }, [selectedStudent])

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.program.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const mapCourse = (c: any): Course => ({
    id: c.courseid,
    name: c.coursename,
    period: c.period,
    state: c.state,
    grade: c.grade,
  })

  const courses: Course[] = status?.courses?.map(mapCourse) ?? []

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Estatus Académico del Alumno</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Panel de búsqueda de estudiantes */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Estudiantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar estudiante..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No se encontraron estudiantes</div>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-3 rounded-md cursor-pointer ${
                      selectedStudent?.id === student.id
                        ? "bg-blue-100 border border-blue-200"
                        : "hover:bg-gray-100 border border-transparent"
                    }`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500 mb-2">{student.program}</div>
                    <div className="flex justify-between text-xs">
                      <span>Semestre: {student.semester}</span>
                      <Badge
                        variant={
                          student.status === "active"
                            ? "default"
                            : student.status === "on_leave"
                              ? "secondary"
                              : student.status === "graduated"
                                ? "outline"
                                : "destructive"
                        }
                        className={
                          student.status === "graduated" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""
                        }
                      >
                        {student.status === "active"
                          ? "Activo"
                          : student.status === "on_leave"
                            ? "Permiso"
                            : student.status === "graduated"
                              ? "Graduado"
                              : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panel principal */}
        <div className="md:col-span-3 space-y-6">
          {selectedStudent && status ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Información del Estudiante</CardTitle>
                    <Badge
                      variant={
                        selectedStudent.status === "active"
                          ? "default"
                          : selectedStudent.status === "on_leave"
                            ? "secondary"
                            : selectedStudent.status === "graduated"
                              ? "outline"
                              : "destructive"
                      }
                      className={
                        selectedStudent.status === "graduated" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""
                      }
                    >
                      {selectedStudent.status === "active"
                        ? "Activo"
                        : selectedStudent.status === "on_leave"
                          ? "Permiso"
                          : selectedStudent.status === "graduated"
                            ? "Graduado"
                            : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Nombre completo</div>
                      <div className="font-medium">{selectedStudent.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Programa</div>
                      <div className="font-medium">{status.program}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Semestre actual</div>
                      <div className="font-medium">{status.semester}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Fecha de inscripción</div>
                      <div className="font-medium">{new Date(status.inscription_date).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Promedio general</div>
                      <div
                        className={`font-medium ${
                          status.average_grade >= 90
                            ? "text-green-600"
                            : status.average_grade >= 70
                              ? "text-blue-600"
                              : "text-amber-600"
                        }`}
                      >
                        {status.average_grade.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Progreso académico</div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">{status.progress_percentage}%</span>
                        <Progress value={status.progress_percentage} className="h-2 flex-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Información Académica</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="border p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Cursos aprobados</div>
                      <div className="text-xl font-bold text-green-600">
                        {status.approved_courses}
                      </div>
                    </div>
                    <div className="border p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Cursos reprobados</div>
                      <div className="text-xl font-bold text-red-600">
                        {status.failed_courses}
                      </div>
                    </div>
                    <div className="border p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Cursos en curso</div>
                      <div className="text-xl font-bold text-blue-600">
                        {status.in_progress_courses}
                      </div>
                    </div>
                    <div className="border p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Créditos completados</div>
                      <div className="text-xl font-bold">{status.credits_completed}</div>
                    </div>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Curso</TableHead>
                          <TableHead>Periodo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Calificación</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courses.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                              No hay cursos registrados
                            </TableCell>
                          </TableRow>
                        ) : (
                          courses.map((course) => (
                            <TableRow key={course.id}>
                              <TableCell>
                                <div className="font-medium">{course.name}</div>
                              </TableCell>
                              <TableCell>{course.period}</TableCell>
                              <TableCell>{course.state}</TableCell>
                              <TableCell>{course.grade ?? "-"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-10 text-gray-500">
                Seleccione un estudiante para ver su estatus.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

