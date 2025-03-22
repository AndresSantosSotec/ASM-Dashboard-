"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash,
  Users,
  MapPin,
  Clock,
  User,
  Bell,
  Mail,
  MessageCircle,
  BookOpen,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

export default function ProgramacionMensualCursosPage() {
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear())
  const [showNewCourseDialog, setShowNewCourseDialog] = useState(false)
  const [showEditCourseDialog, setShowEditCourseDialog] = useState(false)
  const [showViewCourseDialog, setShowViewCourseDialog] = useState(false)
  const [showNotifyDialog, setShowNotifyDialog] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [calendarView, setCalendarView] = useState<"month" | "week">("month")
  const [activeTab, setActiveTab] = useState<string>("calendar")

  // Lista de profesores disponibles
  const teachers = [
    { id: 1, name: "Dr. Carlos Mendoza", specialty: "Desarrollo Web", availability: "Full-time" },
    { id: 2, name: "Dra. Laura Sánchez", specialty: "Marketing Digital", availability: "Part-time" },
    { id: 3, name: "Dr. Roberto Gómez", specialty: "Diseño Gráfico", availability: "Full-time" },
    { id: 4, name: "Dra. Ana Martínez", specialty: "Seguridad Informática", availability: "Part-time" },
    { id: 5, name: "Dr. Javier López", specialty: "Contabilidad", availability: "Full-time" },
  ]

  // Lista de aulas disponibles
  const classrooms = [
    { id: 101, name: "Aula 101", capacity: 30, features: ["Proyector", "Internet", "Computadoras"] },
    { id: 102, name: "Aula 102", capacity: 25, features: ["Proyector", "Internet"] },
    {
      id: 103,
      name: "Aula 103",
      capacity: 40,
      features: ["Proyector", "Internet", "Computadoras", "Sistema de Audio"],
    },
    { id: 201, name: "Aula 201", capacity: 35, features: ["Proyector", "Internet", "Computadoras"] },
    { id: 202, name: "Aula 202", capacity: 20, features: ["Proyector", "Internet", "Pizarra Inteligente"] },
  ]

  // Lista de cursos programados (ejemplo)
  const scheduledCourses = [
    {
      id: 1,
      name: "Desarrollo Web Frontend",
      startDate: "2025-03-10",
      endDate: "2025-04-20",
      days: ["Lunes", "Miércoles"],
      time: "17:00 - 19:00",
      teacher: "Dr. Carlos Mendoza",
      classroom: "Aula 101",
      enrolledStudents: 25,
      maxCapacity: 30,
      status: "active",
    },
    {
      id: 2,
      name: "Marketing Digital Avanzado",
      startDate: "2025-03-15",
      endDate: "2025-05-10",
      days: ["Martes", "Jueves"],
      time: "18:00 - 20:00",
      teacher: "Dra. Laura Sánchez",
      classroom: "Aula 102",
      enrolledStudents: 20,
      maxCapacity: 25,
      status: "active",
    },
    {
      id: 3,
      name: "Diseño Gráfico para Web",
      startDate: "2025-03-05",
      endDate: "2025-04-15",
      days: ["Lunes", "Miércoles", "Viernes"],
      time: "10:00 - 12:00",
      teacher: "Dr. Roberto Gómez",
      classroom: "Aula 103",
      enrolledStudents: 35,
      maxCapacity: 40,
      status: "active",
    },
    {
      id: 4,
      name: "Seguridad en Aplicaciones Web",
      startDate: "2025-03-20",
      endDate: "2025-05-20",
      days: ["Martes", "Jueves"],
      time: "15:00 - 17:00",
      teacher: "Dra. Ana Martínez",
      classroom: "Aula 201",
      enrolledStudents: 28,
      maxCapacity: 35,
      status: "active",
    },
    {
      id: 5,
      name: "Contabilidad para Emprendedores",
      startDate: "2025-03-12",
      endDate: "2025-04-30",
      days: ["Lunes", "Viernes"],
      time: "19:00 - 21:00",
      teacher: "Dr. Javier López",
      classroom: "Aula 202",
      enrolledStudents: 18,
      maxCapacity: 20,
      status: "active",
    },
  ]

  // Función para avanzar al siguiente mes
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Función para retroceder al mes anterior
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  // Función para obtener el nombre del mes
  const getMonthName = (month: number) => {
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]
    return monthNames[month]
  }

  // Función para ver los detalles de un curso
  const handleViewCourse = (course: any) => {
    setSelectedCourse(course)
    setShowViewCourseDialog(true)
  }

  // Función para editar un curso
  const handleEditCourse = (course: any) => {
    setSelectedCourse(course)
    setShowEditCourseDialog(true)
  }

  // Generación del grid del calendario
  const generateCalendarGrid = () => {
    // Aquí iría la lógica para generar el grid del calendario
    // Este es un placeholder simplificado
    return (
      <div className="grid grid-cols-7 gap-1">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
          <div key={day} className="text-center py-2 font-medium text-sm">
            {day}
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-[100px] border rounded-md p-1 text-xs relative">
            <div className="absolute top-1 left-1 font-medium">{(i % 31) + 1}</div>
            {i === 9 && (
              <div
                className="bg-blue-100 rounded p-1 mt-5 mb-1 text-blue-800 cursor-pointer"
                onClick={() => handleViewCourse(scheduledCourses[0])}
              >
                <p className="font-medium">Desarrollo Web</p>
                <p>17:00 - 19:00</p>
              </div>
            )}
            {i === 14 && (
              <div
                className="bg-green-100 rounded p-1 mt-5 mb-1 text-green-800 cursor-pointer"
                onClick={() => handleViewCourse(scheduledCourses[1])}
              >
                <p className="font-medium">Marketing Digital</p>
                <p>18:00 - 20:00</p>
              </div>
            )}
            {i === 4 && (
              <div
                className="bg-purple-100 rounded p-1 mt-5 mb-1 text-purple-800 cursor-pointer"
                onClick={() => handleViewCourse(scheduledCourses[2])}
              >
                <p className="font-medium">Diseño Gráfico</p>
                <p>10:00 - 12:00</p>
              </div>
            )}
            {i === 19 && (
              <div
                className="bg-amber-100 rounded p-1 mt-5 mb-1 text-amber-800 cursor-pointer"
                onClick={() => handleViewCourse(scheduledCourses[3])}
              >
                <p className="font-medium">Seguridad Web</p>
                <p>15:00 - 17:00</p>
              </div>
            )}
            {i === 11 && (
              <div
                className="bg-red-100 rounded p-1 mt-5 mb-1 text-red-800 cursor-pointer"
                onClick={() => handleViewCourse(scheduledCourses[4])}
              >
                <p className="font-medium">Contabilidad</p>
                <p>19:00 - 21:00</p>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Programación Mensual de Cursos</h1>
        <div className="flex items-center space-x-2">
          <Dialog open={showNewCourseDialog} onOpenChange={setShowNewCourseDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Programar Nuevo Curso</DialogTitle>
                <DialogDescription>Complete la información para programar un nuevo curso.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Nombre del Curso</Label>
                    <Input id="courseName" placeholder="Ingrese el nombre del curso" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseType">Tipo de Curso</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="intensive">Intensivo</SelectItem>
                        <SelectItem value="workshop">Taller</SelectItem>
                        <SelectItem value="seminar">Seminario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de Inicio</Label>
                    <Input id="startDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha de Finalización</Label>
                    <Input id="endDate" type="date" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Días de Clase</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((day) => (
                        <label key={day} className="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" className="h-4 w-4" />
                          <span>{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Hora de Inicio</Label>
                      <Input id="startTime" type="time" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">Hora de Finalización</Label>
                      <Input id="endTime" type="time" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacher">Profesor</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar profesor" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={String(teacher.id)}>
                            {teacher.name} ({teacher.specialty})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classroom">Aula</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar aula" />
                      </SelectTrigger>
                      <SelectContent>
                        {classrooms.map((classroom) => (
                          <SelectItem key={classroom.id} value={String(classroom.id)}>
                            {classroom.name} (Cap: {classroom.capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxCapacity">Cupo Máximo</Label>
                    <Input id="maxCapacity" type="number" min="1" defaultValue="30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseStatus">Estado</Label>
                    <Select defaultValue="active">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseDescription">Descripción</Label>
                  <Textarea id="courseDescription" placeholder="Descripción del curso" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="notifyStudents" defaultChecked />
                    <Label htmlFor="notifyStudents">Notificar a alumnos inscritos</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewCourseDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setShowNewCourseDialog(false)}>Guardar Curso</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="list">Lista de Cursos</TabsTrigger>
          <TabsTrigger value="conflicts">Conflictos</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold">
                    {getMonthName(currentMonth)} {currentYear}
                  </h2>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={calendarView} onValueChange={(value: any) => setCalendarView(value)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Vista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Mensual</SelectItem>
                      <SelectItem value="week">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>{generateCalendarGrid()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Cursos Programados</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="cancelled">Cancelados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledCourses.map((course) => (
                  <Card key={course.id} className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-4 border-b">
                      <div className="p-4 md:col-span-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{course.name}</h3>
                          <Badge variant="outline">
                            {course.status === "active"
                              ? "Activo"
                              : course.status === "pending"
                                ? "Pendiente"
                                : "Cancelado"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {course.startDate} a {course.endDate}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            {course.time}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            {course.teacher}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {course.classroom}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2" />
                          <span>
                            {course.enrolledStudents} / {course.maxCapacity} alumnos
                          </span>
                          <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(course.enrolledStudents / course.maxCapacity) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 flex flex-row md:flex-col md:justify-center items-center space-y-0 md:space-y-2 space-x-2 md:space-x-0 bg-gray-50">
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => handleViewCourse(course)}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Ver
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => handleEditCourse(course)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500">Días</p>
                        <p className="text-sm">{course.days.join(", ")}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Duración</p>
                        <p className="text-sm">
                          {Math.round(
                            (new Date(course.endDate).getTime() - new Date(course.startDate).getTime()) /
                              (1000 * 60 * 60 * 24),
                          )}{" "}
                          días
                        </p>
                      </div>
                      <div className="col-span-2 flex justify-end items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setShowNotifyDialog(true)}>
                          <Bell className="h-4 w-4 mr-1" />
                          Notificar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Users className="h-4 w-4 mr-1" />
                          Ver Estudiantes
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conflictos de Programación</CardTitle>
              <CardDescription>Revisión de posibles conflictos en aulas, profesores o horarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border p-4 bg-amber-50">
                <div className="flex items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-amber-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Posible conflicto de aula detectado</h3>
                    <div className="mt-1 text-sm text-amber-700">
                      <p>Dos cursos programados en la misma aula y horario:</p>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Desarrollo Web Frontend (Aula 101, Lunes 17:00 - 19:00)</li>
                        <li>Introducción a JavaScript (Aula 101, Lunes 17:00 - 19:00)</li>
                      </ul>
                    </div>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-800 border-amber-300 hover:bg-amber-100"
                      >
                        Resolver Conflicto
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-md border p-4 bg-amber-50">
                <div className="flex items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-amber-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Profesor con conflicto de horario</h3>
                    <div className="mt-1 text-sm text-amber-700">
                      <p>Profesor asignado a dos cursos en el mismo horario:</p>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Dr. Roberto Gómez: Diseño Gráfico para Web (10:00 - 12:00)</li>
                        <li>Dr. Roberto Gómez: Fundamentos de UX/UI (10:00 - 12:00)</li>
                      </ul>
                    </div>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-800 border-amber-300 hover:bg-amber-100"
                      >
                        Resolver Conflicto
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Verificador de Conflictos</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Verificar Aulas
                  </Button>
                  <Button variant="outline" size="sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Verificar Profesores
                  </Button>
                  <Button variant="outline" size="sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Verificar Horarios
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para ver detalles del curso */}
      <Dialog open={showViewCourseDialog} onOpenChange={setShowViewCourseDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalles del Curso</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
              <div className="md:col-span-2">
                <h2 className="text-xl font-bold mb-4">{selectedCourse.name}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Período</p>
                    <p className="text-base">
                      {selectedCourse.startDate} - {selectedCourse.endDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Horario</p>
                    <p className="text-base">{selectedCourse.time}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Días</p>
                    <p className="text-base">{selectedCourse.days.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Profesor</p>
                    <p className="text-base">{selectedCourse.teacher}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Aula</p>
                    <p className="text-base">{selectedCourse.classroom}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estado</p>
                    <Badge
                      variant={
                        selectedCourse.status === "active"
                          ? "default"
                          : selectedCourse.status === "pending"
                            ? "outline"
                            : "destructive"
                      }
                    >
                      {selectedCourse.status === "active"
                        ? "Activo"
                        : selectedCourse.status === "pending"
                          ? "Pendiente"
                          : "Cancelado"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-500">Descripción</p>
                  <p className="text-base mt-1">
                    Este curso proporciona a los estudiantes los conocimientos necesarios en {selectedCourse.name}.
                    Abarca desde conceptos básicos hasta aplicaciones avanzadas y prácticas profesionales.
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="text-base font-medium mb-2">Sesiones Programadas</h3>
                  <div className="max-h-[200px] overflow-y-auto border rounded-md">
                    <div className="divide-y">
                      {selectedCourse.days.map((day, index) => (
                        <div key={index} className="p-2 hover:bg-gray-50 flex justify-between">
                          <span>
                            {day}, {selectedCourse.time}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(
                              new Date(selectedCourse.startDate).getTime() + index * 7 * 24 * 60 * 60 * 1000,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-base font-medium mb-2">Inscripciones</h3>
                  <div className="flex items-center mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${(selectedCourse.enrolledStudents / selectedCourse.maxCapacity) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round((selectedCourse.enrolledStudents / selectedCourse.maxCapacity) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{selectedCourse.enrolledStudents} inscritos</span>
                    <span>{selectedCourse.maxCapacity - selectedCourse.enrolledStudents} disponibles</span>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h3 className="text-base font-medium mb-2">Acciones</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleEditCourse(selectedCourse)}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Editar Curso
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setShowNotifyDialog(true)}
                    >
                      <Bell className="h-4 w-4 mr-2" /> Enviar Notificación
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" /> Administrar Estudiantes
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <BookOpen className="h-4 w-4 mr-2" /> Material Didáctico
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4 mr-2" /> Cancelar Curso
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewCourseDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar curso */}
      <Dialog open={showEditCourseDialog} onOpenChange={setShowEditCourseDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
            <DialogDescription>Modifique la información del curso.</DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCourseName">Nombre del Curso</Label>
                  <Input id="editCourseName" defaultValue={selectedCourse.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCourseType">Tipo de Curso</Label>
                  <Select defaultValue="regular">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="intensive">Intensivo</SelectItem>
                      <SelectItem value="workshop">Taller</SelectItem>
                      <SelectItem value="seminar">Seminario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStartDate">Fecha de Inicio</Label>
                  <Input id="editStartDate" type="date" defaultValue={selectedCourse.startDate} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEndDate">Fecha de Finalización</Label>
                  <Input id="editEndDate" type="date" defaultValue={selectedCourse.endDate} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Días de Clase</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((day) => (
                      <label key={day} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" defaultChecked={selectedCourse.days.includes(day)} />
                        <span>{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editStartTime">Hora de Inicio</Label>
                    <Input id="editStartTime" type="time" defaultValue={selectedCourse.time.split(" - ")[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editEndTime">Hora de Finalización</Label>
                    <Input id="editEndTime" type="time" defaultValue={selectedCourse.time.split(" - ")[1]} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editTeacher">Profesor</Label>
                  <Select defaultValue={teachers.find((t) => t.name === selectedCourse.teacher)?.id.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar profesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={String(teacher.id)}>
                          {teacher.name} ({teacher.specialty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editClassroom">Aula</Label>
                  <Select defaultValue={classrooms.find((c) => c.name === selectedCourse.classroom)?.id.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar aula" />
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms.map((classroom) => (
                        <SelectItem key={classroom.id} value={String(classroom.id)}>
                          {classroom.name} (Cap: {classroom.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editMaxCapacity">Cupo Máximo</Label>
                  <Input id="editMaxCapacity" type="number" min="1" defaultValue={selectedCourse.maxCapacity} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCourseStatus">Estado</Label>
                  <Select defaultValue={selectedCourse.status}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editCourseDescription">Descripción</Label>
                <Textarea
                  id="editCourseDescription"
                  defaultValue={`Este curso proporciona a los estudiantes los conocimientos necesarios en ${selectedCourse.name}. Abarca desde conceptos básicos hasta aplicaciones avanzadas y prácticas profesionales.`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="editNotifyStudents" defaultChecked />
                  <Label htmlFor="editNotifyStudents">Notificar cambios a alumnos inscritos</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCourseDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowEditCourseDialog(false)}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para enviar notificación */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Notificación</DialogTitle>
            <DialogDescription>Envíe una notificación a los alumnos inscritos en este curso.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notificationSubject">Asunto</Label>
              <Input id="notificationSubject" placeholder="Asunto de la notificación" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notificationMessage">Mensaje</Label>
              <Textarea
                id="notificationMessage"
                placeholder="Escriba el mensaje de la notificación"
                className="min-h-[150px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Canales de Notificación</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="notifyEmail" defaultChecked className="h-4 w-4" />
                  <Label htmlFor="notifyEmail" className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Correo Electrónico
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="notifySMS" className="h-4 w-4" />
                  <Label htmlFor="notifySMS" className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    SMS
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="notifyApp" defaultChecked className="h-4 w-4" />
                  <Label htmlFor="notifyApp" className="flex items-center">
                    <Bell className="h-4 w-4 mr-1" />
                    Notificación en la App
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotifyDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowNotifyDialog(false)}>Enviar Notificación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

