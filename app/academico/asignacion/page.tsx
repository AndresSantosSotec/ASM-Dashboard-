"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  Calendar,
  Clock,
  BookOpen,
  XCircle,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"

// Tipos
interface Student {
  id: string
  name: string
  program: string
  semester: number
  credits: {
    completed: number
    total: number
  }
}

interface Course {
  id: string
  name: string
  code: string
  area: "common" | "specialty"
  credits: number
  schedule: string
  startDate: string
  endDate: string
  facilitator: string
  status: "available" | "full" | "in_progress" | "completed"
  capacity: number
  enrolled: number
}

interface StudentCourse {
  id: string
  studentId: string
  courseId: string
  status: "pending" | "in_progress" | "approved" | "failed"
  grade: number | null
  assignedDate: string
}

// Datos de ejemplo
const mockStudents: Student[] = [
  {
    id: "1",
    name: "Juan Pérez",
    program: "Licenciatura en Administración de Empresas",
    semester: 3,
    credits: {
      completed: 45,
      total: 120,
    },
  },
  {
    id: "2",
    name: "María González",
    program: "Ingeniería en Sistemas Computacionales",
    semester: 4,
    credits: {
      completed: 72,
      total: 180,
    },
  },
  {
    id: "3",
    name: "Carlos Rodríguez",
    program: "Maestría en Educación",
    semester: 2,
    credits: {
      completed: 24,
      total: 60,
    },
  },
]

const mockCourses: Course[] = [
  {
    id: "1",
    name: "Introducción a la Programación",
    code: "CS101",
    area: "common",
    credits: 4,
    schedule: "Lunes y Miércoles, 18:00 - 20:00",
    startDate: "2023-11-01",
    endDate: "2023-11-30",
    facilitator: "Juan Martínez",
    status: "available",
    capacity: 30,
    enrolled: 25,
  },
  {
    id: "2",
    name: "Estadística Aplicada",
    code: "STAT202",
    area: "specialty",
    credits: 3,
    schedule: "Martes y Jueves, 19:00 - 21:00",
    startDate: "2023-11-15",
    endDate: "2023-12-15",
    facilitator: "María González",
    status: "available",
    capacity: 25,
    enrolled: 18,
  },
  {
    id: "3",
    name: "Metodología de la Investigación",
    code: "RES301",
    area: "common",
    credits: 3,
    schedule: "Viernes, 17:00 - 21:00",
    startDate: "2023-12-01",
    endDate: "2023-12-31",
    facilitator: "Carlos Rodríguez",
    status: "full",
    capacity: 30,
    enrolled: 30,
  },
  {
    id: "4",
    name: "Fundamentos de Administración",
    code: "ADM101",
    area: "specialty",
    credits: 4,
    schedule: "Lunes y Miércoles, 16:00 - 18:00",
    startDate: "2023-11-01",
    endDate: "2023-11-30",
    facilitator: "Ana López",
    status: "in_progress",
    capacity: 35,
    enrolled: 32,
  },
  {
    id: "5",
    name: "Programación Orientada a Objetos",
    code: "CS201",
    area: "specialty",
    credits: 4,
    schedule: "Martes y Jueves, 17:00 - 19:00",
    startDate: "2023-10-15",
    endDate: "2023-11-15",
    facilitator: "Pedro Sánchez",
    status: "completed",
    capacity: 25,
    enrolled: 22,
  },
]

const mockStudentCourses: StudentCourse[] = [
  {
    id: "sc1",
    studentId: "1",
    courseId: "4",
    status: "in_progress",
    grade: null,
    assignedDate: "2023-10-25",
  },
  {
    id: "sc2",
    studentId: "1",
    courseId: "5",
    status: "approved",
    grade: 85,
    assignedDate: "2023-09-10",
  },
  {
    id: "sc3",
    studentId: "2",
    courseId: "1",
    status: "in_progress",
    grade: null,
    assignedDate: "2023-10-28",
  },
  {
    id: "sc4",
    studentId: "2",
    courseId: "5",
    status: "failed",
    grade: 45,
    assignedDate: "2023-09-10",
  },
  {
    id: "sc5",
    studentId: "3",
    courseId: "2",
    status: "in_progress",
    grade: null,
    assignedDate: "2023-11-10",
  },
]

export default function AsignacionCursos() {
  const [students] = useState<Student[]>(mockStudents)
  const [courses] = useState<Course[]>(mockCourses)
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>(mockStudentCourses)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [courseFilter, setCourseFilter] = useState<string>("available")
  const [isAssigningCourse, setIsAssigningCourse] = useState(false)
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  // Filtrar estudiantes
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.program.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Obtener cursos del estudiante seleccionado
  const studentCoursesData = selectedStudent ? studentCourses.filter((sc) => sc.studentId === selectedStudent.id) : []

  // Obtener detalles completos de los cursos del estudiante
  const studentCoursesWithDetails = studentCoursesData.map((sc) => {
    const courseDetails = courses.find((c) => c.id === sc.courseId)
    return {
      ...sc,
      course: courseDetails,
    }
  })

  // Filtrar cursos disponibles para asignar
  const availableCourses = courses.filter((course) => {
    // Verificar si el curso ya está asignado al estudiante
    const isAlreadyAssigned = studentCoursesData.some(
      (sc) => sc.courseId === course.id && (sc.status === "pending" || sc.status === "in_progress"),
    )

    // Verificar si el curso ya fue aprobado por el estudiante
    const isAlreadyApproved = studentCoursesData.some((sc) => sc.courseId === course.id && sc.status === "approved")

    // Filtrar según el estado seleccionado
    const matchesFilter =
      courseFilter === "all" ||
      (courseFilter === "available" && course.status === "available" && course.enrolled < course.capacity) ||
      (courseFilter === "in_progress" && course.status === "in_progress")

    return !isAlreadyAssigned && !isAlreadyApproved && matchesFilter
  })

  // Calcular estadísticas del estudiante
  const calculateStudentStats = (studentId: string) => {
    const studentData = studentCourses.filter((sc) => sc.studentId === studentId)

    const approved = studentData.filter((sc) => sc.status === "approved").length
    const failed = studentData.filter((sc) => sc.status === "failed").length
    const inProgress = studentData.filter((sc) => sc.status === "in_progress").length
    const pending = studentData.filter((sc) => sc.status === "pending").length

    return { approved, failed, inProgress, pending }
  }

  // Asignar curso a estudiante
  const handleAssignCourse = () => {
    if (!selectedStudent || !selectedCourseId) return

    setIsAssigningCourse(true)

    // Simulación de proceso asíncrono
    setTimeout(() => {
      const newStudentCourse: StudentCourse = {
        id: `sc${Date.now()}`,
        studentId: selectedStudent.id,
        courseId: selectedCourseId,
        status: "pending",
        grade: null,
        assignedDate: new Date().toISOString().split("T")[0],
      }

      setStudentCourses((prev) => [...prev, newStudentCourse])

      const courseDetails = courses.find((c) => c.id === selectedCourseId)

      setIsAssigningCourse(false)
      setShowAssignmentDialog(false)
      setSelectedCourseId(null)

      toast({
        title: "Curso asignado",
        description: `El curso ${courseDetails?.name} ha sido asignado a ${selectedStudent.name}.`,
      })
    }, 1000)
  }

  // Cancelar asignación de curso
  const handleCancelAssignment = (studentCourseId: string) => {
    const studentCourse = studentCourses.find((sc) => sc.id === studentCourseId)
    if (!studentCourse) return

    const courseDetails = courses.find((c) => c.id === studentCourse.courseId)

    setStudentCourses((prev) => prev.filter((sc) => sc.id !== studentCourseId))

    toast({
      title: "Asignación cancelada",
      description: `La asignación del curso ${courseDetails?.name} ha sido cancelada.`,
    })
  }

  // Abrir diálogo de asignación
  const handleOpenAssignmentDialog = (courseId: string) => {
    setSelectedCourseId(courseId)
    setShowAssignmentDialog(true)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Asignación de Cursos a Estudiantes</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                filteredStudents.map((student) => {
                  const stats = calculateStudentStats(student.id)

                  return (
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
                        <span>
                          Créditos: {student.credits.completed}/{student.credits.total}
                        </span>
                      </div>
                      <Progress
                        value={(student.credits.completed / student.credits.total) * 100}
                        className="h-1.5 mt-1"
                      />

                      <div className="flex flex-wrap gap-1 mt-2">
                        {stats.approved > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                            {stats.approved} aprobados
                          </Badge>
                        )}
                        {stats.failed > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
                            {stats.failed} reprobados
                          </Badge>
                        )}
                        {stats.inProgress > 0 && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            {stats.inProgress} en curso
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panel principal */}
        <div className="md:col-span-2 space-y-6">
          {selectedStudent ? (
            <>
              {/* Historial académico */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Historial Académico</CardTitle>
                    <div className="flex items-center text-sm text-gray-500">
                      <BarChart2 className="h-4 w-4 mr-1" />
                      Progreso: {Math.round((selectedStudent.credits.completed / selectedStudent.credits.total) * 100)}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Curso</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Calificación</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentCoursesWithDetails.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                              No hay cursos asignados
                            </TableCell>
                          </TableRow>
                        ) : (
                          studentCoursesWithDetails.map((sc) => (
                            <TableRow key={sc.id}>
                              <TableCell>
                                <div className="font-medium">{sc.course?.name}</div>
                                <div className="text-sm text-gray-500">
                                  {sc.course?.code} • {sc.course?.credits} créditos
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Asignado: {new Date(sc.assignedDate).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    sc.status === "approved"
                                      ? "default"
                                      : sc.status === "failed"
                                        ? "destructive"
                                        : sc.status === "in_progress"
                                          ? "secondary"
                                          : "outline"
                                  }
                                  className={
                                    sc.status === "approved"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : sc.status === "in_progress"
                                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                        : ""
                                  }
                                >
                                  {sc.status === "approved"
                                    ? "Aprobado"
                                    : sc.status === "failed"
                                      ? "Reprobado"
                                      : sc.status === "in_progress"
                                        ? "En curso"
                                        : "Pendiente"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {sc.grade !== null ? (
                                  <div
                                    className={`font-medium ${
                                      sc.grade >= 70
                                        ? "text-green-600"
                                        : sc.grade >= 50
                                          ? "text-amber-600"
                                          : "text-red-600"
                                    }`}
                                  >
                                    {sc.grade}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {sc.status === "pending" && (
                                  <Button variant="ghost" size="sm" onClick={() => handleCancelAssignment(sc.id)}>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancelar
                                  </Button>
                                )}
                                {sc.status === "failed" && sc.grade !== null && sc.grade >= 50 && sc.grade < 70 && (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Requiere retomar
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Cursos disponibles */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Cursos Disponibles</CardTitle>
                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar cursos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponibles</SelectItem>
                        <SelectItem value="in_progress">En curso</SelectItem>
                        <SelectItem value="all">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {availableCourses.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No hay cursos disponibles para asignar</div>
                    ) : (
                      availableCourses.map((course) => (
                        <div key={course.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{course.name}</div>
                              <div className="text-sm text-gray-500">
                                {course.code} • {course.credits} créditos
                              </div>
                              <div className="flex items-center text-sm mt-2">
                                <Calendar className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                {new Date(course.startDate).toLocaleDateString()} -{" "}
                                {new Date(course.endDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center text-sm mt-1">
                                <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                {course.schedule}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                <Badge variant="outline">{course.area === "common" ? "Común" : "Especialidad"}</Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    course.enrolled >= course.capacity
                                      ? "bg-red-50 text-red-700"
                                      : course.enrolled >= course.capacity * 0.8
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-green-50 text-green-700"
                                  }
                                >
                                  {course.enrolled}/{course.capacity} estudiantes
                                </Badge>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleOpenAssignmentDialog(course.id)}
                              disabled={course.enrolled >= course.capacity}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Asignar
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">Seleccione un estudiante</h3>
                <p className="text-gray-500 text-center max-w-md">
                  Seleccione un estudiante del panel izquierdo para ver su historial académico y asignar cursos.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Diálogo de confirmación de asignación */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar asignación de curso</DialogTitle>
            <DialogDescription>¿Está seguro que desea asignar este curso al estudiante?</DialogDescription>
          </DialogHeader>

          {selectedCourseId && selectedStudent && (
            <div className="py-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">{courses.find((c) => c.id === selectedCourseId)?.name}</h4>
                  <p className="text-sm text-gray-500">
                    {courses.find((c) => c.id === selectedCourseId)?.code} •
                    {courses.find((c) => c.id === selectedCourseId)?.credits} créditos
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">{selectedStudent.name}</h4>
                  <p className="text-sm text-gray-500">{selectedStudent.program}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignmentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignCourse} disabled={isAssigningCourse}>
              {isAssigningCourse ? "Asignando..." : "Confirmar asignación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

