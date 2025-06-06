"use client"

import type React from "react"

import { useState } from "react"
import { Search, Plus, Edit, Trash, Calendar, Clock, User, CheckCircle, ArrowRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"

// Tipos
interface Course {
  id: string
  name: string
  code: string
  area: "common" | "specialty"
  credits: number
  startDate: string
  endDate: string
  schedule: string
  duration: string
  facilitator: string | null
  status: "draft" | "approved" | "synced"
  students: number
}

interface Facilitator {
  id: string
  name: string
  specialty: string
  availability: string[]
}

interface Cohort {
  id: string
  name: string
  program: string
  students: number
}

interface Student {
  id: string
  name: string
  program: string
}

interface Enrollment {
  id: string
  courseId: string
  studentId: string
}

// Datos de ejemplo
const mockCourses: Course[] = [
  {
    id: "1",
    name: "Introducción a la Programación",
    code: "CS101",
    area: "common",
    credits: 4,
    startDate: "2023-11-01",
    endDate: "2023-11-30",
    schedule: "Lunes y Miércoles, 18:00 - 20:00",
    duration: "4 semanas",
    facilitator: "Juan Martínez",
    status: "approved",
    students: 25,
  },
  {
    id: "2",
    name: "Estadística Aplicada",
    code: "STAT202",
    area: "specialty",
    credits: 3,
    startDate: "2023-11-15",
    endDate: "2023-12-15",
    schedule: "Martes y Jueves, 19:00 - 21:00",
    duration: "4 semanas",
    facilitator: null,
    status: "draft",
    students: 18,
  },
  {
    id: "3",
    name: "Metodología de la Investigación",
    code: "RES301",
    area: "common",
    credits: 3,
    startDate: "2023-12-01",
    endDate: "2023-12-31",
    schedule: "Viernes, 17:00 - 21:00",
    duration: "4 semanas",
    facilitator: "María González",
    status: "synced",
    students: 30,
  },
]

const mockFacilitators: Facilitator[] = [
  {
    id: "f1",
    name: "Juan Martínez",
    specialty: "Ciencias de la Computación",
    availability: ["Lunes", "Miércoles", "Viernes"],
  },
  {
    id: "f2",
    name: "María González",
    specialty: "Metodología e Investigación",
    availability: ["Martes", "Jueves", "Viernes"],
  },
  {
    id: "f3",
    name: "Carlos Rodríguez",
    specialty: "Estadística",
    availability: ["Lunes", "Martes", "Miércoles"],
  },
]

const mockCohorts: Cohort[] = [
  {
    id: "c1",
    name: "Cohorte 2023-A",
    program: "Licenciatura en Administración de Empresas",
    students: 35,
  },
  {
    id: "c2",
    name: "Cohorte 2023-B",
    program: "Ingeniería en Sistemas Computacionales",
    students: 28,
  },
  {
    id: "c3",
    name: "Cohorte 2023-C",
    program: "Maestría en Educación",
    students: 15,
  },
]

const mockStudents: Student[] = [
  { id: "s1", name: "Juan Pérez", program: "Administración" },
  { id: "s2", name: "María González", program: "Sistemas" },
  { id: "s3", name: "Carlos Rodríguez", program: "Educación" },
  { id: "s4", name: "Ana López", program: "Administración" },
]

const mockEnrollments: Enrollment[] = [
  { id: "e1", courseId: "1", studentId: "s1" },
  { id: "e2", courseId: "1", studentId: "s2" },
  { id: "e3", courseId: "2", studentId: "s3" },
]

export default function ProgramacionCursos() {
  const [courses, setCourses] = useState<Course[]>(mockCourses)
  const [facilitators] = useState<Facilitator[]>(mockFacilitators)
  const [cohorts] = useState<Cohort[]>(mockCohorts)
  const [searchTerm, setSearchTerm] = useState("")
  const [areaFilter, setAreaFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedCohort, setSelectedCohort] = useState<string>("c1")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSyncingToMoodle, setIsSyncingToMoodle] = useState(false)
  const [students] = useState<Student[]>(mockStudents)
  const [enrollments, setEnrollments] = useState<Enrollment[]>(mockEnrollments)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const enrolledStudents = selectedCourse
    ? enrollments
        .filter((e) => e.courseId === selectedCourse.id)
        .map((e) => students.find((s) => s.id === e.studentId)!)
        .filter(Boolean)
    : []

  const availableStudents = selectedCourse
    ? students.filter(
        (s) =>
          !enrollments.some(
            (e) => e.courseId === selectedCourse.id && e.studentId === s.id,
          ),
      )
    : []

  // Formulario de curso
  const [formData, setFormData] = useState<Omit<Course, "id" | "status" | "students">>({
    name: "",
    code: "",
    area: "common",
    credits: 3,
    startDate: "",
    endDate: "",
    schedule: "",
    duration: "",
    facilitator: null,
  })

  // Filtrar cursos
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesArea = areaFilter === "all" || course.area === areaFilter
    const matchesStatus = statusFilter === "all" || course.status === statusFilter

    return matchesSearch && matchesArea && matchesStatus
  })

  // Manejar cambios en el formulario
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { name: string; value: any },
  ) => {
    const name = "target" in e ? e.target.name : e.name
    const value = "target" in e ? e.target.value : e.value

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Abrir formulario para editar
  const handleEdit = (course: Course) => {
    setSelectedCourse(course)
    setFormData({
      name: course.name,
      code: course.code,
      area: course.area,
      credits: course.credits,
      startDate: course.startDate,
      endDate: course.endDate,
      schedule: course.schedule,
      duration: course.duration,
      facilitator: course.facilitator,
    })
    setIsFormOpen(true)
  }

  // Abrir formulario para crear
  const handleCreate = () => {
    setSelectedCourse(null)
    setFormData({
      name: "",
      code: "",
      area: "common",
      credits: 3,
      startDate: "",
      endDate: "",
      schedule: "",
      duration: "",
      facilitator: null,
    })
    setIsFormOpen(true)
  }

  // Guardar curso (crear o actualizar)
  const handleSaveCourse = () => {
    if (selectedCourse) {
      // Actualizar curso existente
      setCourses((prev) => prev.map((c) => (c.id === selectedCourse.id ? { ...c, ...formData, status: "draft" } : c)))
      toast({
        title: "Curso actualizado",
        description: `El curso ${formData.name} ha sido actualizado.`,
      })
    } else {
      // Crear nuevo curso
      const newCourse: Course = {
        id: `${Date.now()}`,
        ...formData,
        status: "draft",
        students: 0,
      }
      setCourses((prev) => [...prev, newCourse])
      toast({
        title: "Curso creado",
        description: `El curso ${formData.name} ha sido creado correctamente.`,
      })
    }
    setIsFormOpen(false)
  }

  // Eliminar curso
  const handleDelete = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id))
    if (selectedCourse?.id === id) {
      setSelectedCourse(null)
    }
    toast({
      title: "Curso eliminado",
      description: "El curso ha sido eliminado correctamente.",
    })
  }

  // Aprobar programación
  const handleApproveCourse = (id: string) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, status: "approved" } : c)))

    if (selectedCourse?.id === id) {
      setSelectedCourse((prev) => (prev ? { ...prev, status: "approved" } : null))
    }

    toast({
      title: "Programación aprobada",
      description: "La programación del curso ha sido aprobada.",
    })
  }

  // Sincronizar con Moodle
  const handleSyncToMoodle = (id: string) => {
    setIsSyncingToMoodle(true)

    // Simulación de proceso asíncrono
    setTimeout(() => {
      setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, status: "synced" } : c)))

      if (selectedCourse?.id === id) {
        setSelectedCourse((prev) => (prev ? { ...prev, status: "synced" } : null))
      }

      setIsSyncingToMoodle(false)

      toast({
        title: "Curso sincronizado con Moodle",
        description: "El curso ha sido sincronizado correctamente con la plataforma Moodle.",
      })
    }, 2000)
  }

  // Asignar facilitador
  const handleAssignFacilitator = (courseId: string, facilitatorId: string | null) => {
    const facilitator = facilitatorId ? facilitators.find((f) => f.id === facilitatorId)?.name || null : null

    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, facilitator } : c)))

    if (selectedCourse?.id === courseId) {
      setSelectedCourse((prev) => (prev ? { ...prev, facilitator } : null))
    }

    if (facilitator) {
      toast({
        title: "Facilitador asignado",
        description: `${facilitator} ha sido asignado al curso.`,
      })
    } else {
      toast({
        title: "Facilitador removido",
        description: "El facilitador ha sido removido del curso.",
      })
    }
  }

  const handleAssignStudent = () => {
    if (!selectedCourse || !selectedStudentId) return

    const newEnrollment: Enrollment = {
      id: `e${Date.now()}`,
      courseId: selectedCourse.id,
      studentId: selectedStudentId,
    }

    setEnrollments((prev) => [...prev, newEnrollment])
    setCourses((prev) =>
      prev.map((c) =>
        c.id === selectedCourse.id ? { ...c, students: c.students + 1 } : c,
      ),
    )

    setSelectedCourse((prev) => (prev ? { ...prev, students: prev.students + 1 } : prev))

    toast({
      title: "Estudiante asignado",
      description: `El estudiante ha sido asignado al curso ${selectedCourse.name}.`,
    })

    setAssignDialogOpen(false)
    setSelectedStudentId(null)
  }

  const handleBulkAssign = () => {
    if (!selectedCourse) return

    const newEnrolls = availableStudents.map((s) => ({
      id: `e${Date.now()}-${s.id}`,
      courseId: selectedCourse.id,
      studentId: s.id,
    }))

    if (newEnrolls.length === 0) return

    setEnrollments((prev) => [...prev, ...newEnrolls])
    setCourses((prev) =>
      prev.map((c) =>
        c.id === selectedCourse.id
          ? { ...c, students: c.students + newEnrolls.length }
          : c,
      ),
    )
    setSelectedCourse((prev) =>
      prev ? { ...prev, students: prev.students + newEnrolls.length } : prev,
    )

    toast({
      title: "Asignación masiva",
      description: `${newEnrolls.length} estudiantes asignados`,
    })
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Programación de Cursos</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Curso
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Panel de cohortes */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Cohortes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cohorts.map((cohort) => (
                <div
                  key={cohort.id}
                  className={`p-3 rounded-md cursor-pointer ${
                    selectedCohort === cohort.id
                      ? "bg-blue-100 border border-blue-200"
                      : "hover:bg-gray-100 border border-transparent"
                  }`}
                  onClick={() => setSelectedCohort(cohort.id)}
                >
                  <div className="font-medium">{cohort.name}</div>
                  <div className="text-sm text-gray-500">{cohort.program}</div>
                  <div className="text-sm mt-1">
                    <Badge variant="outline">{cohort.students} estudiantes</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Panel principal */}
        <div className="md:col-span-3 space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar por nombre o código..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={areaFilter} onValueChange={setAreaFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filtrar por área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las áreas</SelectItem>
                      <SelectItem value="common">Común</SelectItem>
                      <SelectItem value="specialty">Especialidad</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="synced">Sincronizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de cursos */}
          <Card>
            <CardHeader>
              <CardTitle>Cursos Programados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Facilitador</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          No se encontraron cursos
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCourses.map((course) => (
                        <TableRow
                          key={course.id}
                          className={selectedCourse?.id === course.id ? "bg-blue-50" : ""}
                          onClick={() => setSelectedCourse(course)}
                        >
                          <TableCell>
                            <div className="font-medium">{course.name}</div>
                            <div className="text-sm text-gray-500">
                              {course.code} • {course.credits} créditos
                            </div>
                            <Badge variant="outline" className="mt-1">
                              {course.area === "common" ? "Común" : "Especialidad"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-gray-500" />
                              {new Date(course.startDate).toLocaleDateString()} -{" "}
                              {new Date(course.endDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-sm mt-1">
                              <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                              {course.schedule}
                            </div>
                          </TableCell>
                          <TableCell>
                            {course.facilitator ? (
                              <div className="flex items-center">
                                <User className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                <span>{course.facilitator}</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-amber-500 bg-amber-50">
                                Sin asignar
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                course.status === "approved"
                                  ? "default"
                                  : course.status === "synced"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={
                                course.status === "synced" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""
                              }
                            >
                              {course.status === "draft"
                                ? "Borrador"
                                : course.status === "approved"
                                  ? "Aprobado"
                                  : "Sincronizado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(course)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(course.id)
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Detalles del curso seleccionado */}
          {selectedCourse && (
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Información</TabsTrigger>
                    <TabsTrigger value="facilitators">Facilitadores</TabsTrigger>
                    <TabsTrigger value="students">Estudiantes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre del curso</Label>
                        <div className="font-medium">{selectedCourse.name}</div>
                      </div>
                      <div>
                        <Label>Código</Label>
                        <div className="font-medium">{selectedCourse.code}</div>
                      </div>
                      <div>
                        <Label>Área</Label>
                        <div className="font-medium">{selectedCourse.area === "common" ? "Común" : "Especialidad"}</div>
                      </div>
                      <div>
                        <Label>Créditos</Label>
                        <div className="font-medium">{selectedCourse.credits}</div>
                      </div>
                      <div>
                        <Label>Fecha de inicio</Label>
                        <div className="font-medium">{new Date(selectedCourse.startDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <Label>Fecha de fin</Label>
                        <div className="font-medium">{new Date(selectedCourse.endDate).toLocaleDateString()}</div>
                      </div>
                      <div className="col-span-2">
                        <Label>Horario</Label>
                        <div className="font-medium">{selectedCourse.schedule}</div>
                      </div>
                      <div>
                        <Label>Duración</Label>
                        <div className="font-medium">{selectedCourse.duration}</div>
                      </div>
                      <div>
                        <Label>Estudiantes</Label>
                        <div className="font-medium">{selectedCourse.students}</div>
                      </div>
                      <div className="col-span-2">
                        <Label>Facilitador</Label>
                        <div className="font-medium">{selectedCourse.facilitator || "Sin asignar"}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="facilitators" className="pt-4">
                    <div className="space-y-4">
                      {facilitators.map((facilitator) => (
                        <div
                          key={facilitator.id}
                          className={`border rounded-lg p-4 ${
                            selectedCourse.facilitator === facilitator.name ? "border-blue-500 bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{facilitator.name}</div>
                              <div className="text-sm text-gray-500">{facilitator.specialty}</div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {facilitator.availability.map((day) => (
                                  <Badge key={day} variant="outline" className="text-xs">
                                    {day}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant={selectedCourse.facilitator === facilitator.name ? "outline" : "default"}
                              size="sm"
                              onClick={() =>
                                handleAssignFacilitator(
                                  selectedCourse.id,
                                  selectedCourse.facilitator === facilitator.name ? null : facilitator.id,
                                )
                              }
                            >
                              {selectedCourse.facilitator === facilitator.name ? "Remover" : "Asignar"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="students" className="pt-4 space-y-4">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleBulkAssign}>
                        Asignación masiva
                      </Button>
                      <Button onClick={() => setAssignDialogOpen(true)}>
                        Asignar estudiante
                      </Button>
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Programa</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enrolledStudents.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                                Sin estudiantes asignados
                              </TableCell>
                            </TableRow>
                          ) : (
                            enrolledStudents.map((st) => (
                              <TableRow key={st.id}>
                                <TableCell>{st.name}</TableCell>
                                <TableCell>{st.program}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={() => handleEdit(selectedCourse)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar curso
                </Button>
                <div className="space-x-2">
                  {selectedCourse.status === "draft" && (
                    <Button
                      onClick={() => handleApproveCourse(selectedCourse.id)}
                      disabled={!selectedCourse.facilitator}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprobar programación
                    </Button>
                  )}
                  {selectedCourse.status === "approved" && (
                    <Button onClick={() => handleSyncToMoodle(selectedCourse.id)} disabled={isSyncingToMoodle}>
                      {isSyncingToMoodle ? (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4 animate-pulse" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Generar en Moodle
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>

      {/* Formulario de creación/edición */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedCourse ? "Editar curso" : "Nuevo curso"}</DialogTitle>
            <DialogDescription>
              Complete los datos del curso para{" "}
              {selectedCourse ? "actualizar su información" : "programarlo en el sistema"}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nombre del curso</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input id="code" name="code" value={formData.code} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Créditos</Label>
              <Input
                id="credits"
                name="credits"
                type="number"
                min="1"
                max="10"
                value={formData.credits}
                onChange={(e) =>
                  handleFormChange({
                    name: "credits",
                    value: Number.parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Área</Label>
              <Select
                name="area"
                value={formData.area}
                onValueChange={(value) =>
                  handleFormChange({
                    name: "area",
                    value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Común</SelectItem>
                  <SelectItem value="specialty">Especialidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duración</Label>
              <Input
                id="duration"
                name="duration"
                placeholder="Ej: 4 semanas"
                value={formData.duration}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de fin</Label>
              <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleFormChange} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="schedule">Horario</Label>
              <Input
                id="schedule"
                name="schedule"
                placeholder="Ej: Lunes y Miércoles, 18:00 - 20:00"
                value={formData.schedule}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCourse}>{selectedCourse ? "Actualizar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Asignar estudiante</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedStudentId ?? ""}
              onValueChange={(v) => setSelectedStudentId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un estudiante" />
              </SelectTrigger>
              <SelectContent>
                {availableStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} - {s.program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignStudent} disabled={!selectedStudentId}>
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

