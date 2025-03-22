"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProgramacionCursosPage() {
  const [currentMonth, setCurrentMonth] = useState<string>("Marzo 2025")
  const [currentView, setCurrentView] = useState<"month" | "week">("month")
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false)

  // Datos de ejemplo para el calendario
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1)
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  // Datos de ejemplo para cursos
  const courses = [
    {
      id: 1,
      name: "Introducción a la Programación",
      instructor: "Juan Pérez",
      room: "Aula 101",
      time: "09:00 - 11:00",
      days: [2, 4, 6, 9, 11, 13, 16, 18, 20, 23, 25, 27, 30],
    },
    {
      id: 2,
      name: "Matemáticas Avanzadas",
      instructor: "María Rodríguez",
      room: "Aula 203",
      time: "14:00 - 16:00",
      days: [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29, 31],
    },
    {
      id: 3,
      name: "Diseño Gráfico",
      instructor: "Carlos Gómez",
      room: "Lab 3",
      time: "16:00 - 18:00",
      days: [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29, 31],
    },
  ]

  const handlePreviousMonth = () => {
    setCurrentMonth("Febrero 2025") // Simulado, en una implementación real calcularíamos el mes anterior
  }

  const handleNextMonth = () => {
    setCurrentMonth("Abril 2025") // Simulado, en una implementación real calcularíamos el mes siguiente
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Programación de Cursos</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentView("month")}>
            Mensual
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentView("week")}>
            Semanal
          </Button>
          <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nueva Sesión
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Programar Nueva Sesión</DialogTitle>
                <DialogDescription>Complete los detalles para programar una nueva sesión de clase.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="course" className="text-right">
                    Curso
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar curso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prog">Introducción a la Programación</SelectItem>
                      <SelectItem value="math">Matemáticas Avanzadas</SelectItem>
                      <SelectItem value="design">Diseño Gráfico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="instructor" className="text-right">
                    Docente
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar docente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="juan">Juan Pérez</SelectItem>
                      <SelectItem value="maria">María Rodríguez</SelectItem>
                      <SelectItem value="carlos">Carlos Gómez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Fecha
                  </Label>
                  <Input id="date" type="date" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startTime" className="text-right">
                    Hora Inicio
                  </Label>
                  <Input id="startTime" type="time" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endTime" className="text-right">
                    Hora Fin
                  </Label>
                  <Input id="endTime" type="time" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="room" className="text-right">
                    Aula
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar aula" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="101">Aula 101</SelectItem>
                      <SelectItem value="203">Aula 203</SelectItem>
                      <SelectItem value="lab3">Laboratorio 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="repeat" className="text-right">
                    Repetir
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="No repetir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No repetir</SelectItem>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="biweekly">Cada dos semanas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setShowNewSessionDialog(false)}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle>{currentMonth}</CardTitle>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos los programas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los programas</SelectItem>
                  <SelectItem value="informatica">Informática</SelectItem>
                  <SelectItem value="administracion">Administración</SelectItem>
                  <SelectItem value="diseno">Diseño</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentView === "month" ? (
            <div className="border rounded-md">
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {weekDays.map((day) => (
                  <div key={day} className="bg-white p-2 text-center font-medium">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {calendarDays.map((day) => (
                  <div key={day} className="bg-white p-2 min-h-[100px]">
                    <div className="font-medium text-sm mb-1">{day}</div>
                    {courses.map((course) =>
                      course.days.includes(day) ? (
                        <div
                          key={`${course.id}-${day}`}
                          className="text-xs p-1 mb-1 rounded bg-blue-100 text-blue-800 cursor-pointer"
                          title={`${course.name} - ${course.instructor} - ${course.room}`}
                        >
                          {course.name.length > 15 ? `${course.name.substring(0, 15)}...` : course.name}
                          <div className="text-xs text-blue-600">{course.time}</div>
                        </div>
                      ) : null,
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border rounded-md">
              <div className="grid grid-cols-8 gap-px bg-gray-200">
                <div className="bg-white p-2 text-center font-medium">Hora</div>
                {weekDays.map((day) => (
                  <div key={day} className="bg-white p-2 text-center font-medium">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-8 gap-px bg-gray-200">
                {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map(
                  (hour) => (
                    <React.Fragment key={hour}>
                      <div className="bg-white p-2 text-center font-medium text-sm">{hour}</div>
                      {weekDays.map((day, index) => (
                        <div key={`${day}-${hour}`} className="bg-white p-2 min-h-[60px]">
                          {courses.some(
                            (course) => course.time.startsWith(hour) && course.days.includes(index + 1),
                          ) && (
                            <div className="text-xs p-1 rounded bg-blue-100 text-blue-800 cursor-pointer h-full">
                              {
                                courses.find(
                                  (course) => course.time.startsWith(hour) && course.days.includes(index + 1),
                                )?.name
                              }
                              <div className="text-xs text-blue-600">
                                {
                                  courses.find(
                                    (course) => course.time.startsWith(hour) && course.days.includes(index + 1),
                                  )?.room
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </React.Fragment>
                  ),
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Próximos Inicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start p-3 bg-blue-50 rounded-md">
                <Calendar className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium">Desarrollo Web Frontend</h4>
                  <p className="text-sm text-gray-600">Inicia: 15 de Marzo, 2025</p>
                  <p className="text-sm text-gray-600">Docente: Carlos Gómez</p>
                </div>
              </div>

              <div className="flex items-start p-3 bg-green-50 rounded-md">
                <Calendar className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium">Marketing Digital</h4>
                  <p className="text-sm text-gray-600">Inicia: 20 de Marzo, 2025</p>
                  <p className="text-sm text-gray-600">Docente: Ana Martínez</p>
                </div>
              </div>

              <div className="flex items-start p-3 bg-purple-50 rounded-md">
                <Calendar className="h-5 w-5 text-purple-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium">Contabilidad Básica</h4>
                  <p className="text-sm text-gray-600">Inicia: 1 de Abril, 2025</p>
                  <p className="text-sm text-gray-600">Docente: Roberto Sánchez</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Disponibilidad de Aulas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-green-50 rounded-md text-center">
                  <h4 className="font-medium">Aula 101</h4>
                  <p className="text-sm text-green-600">Disponible</p>
                </div>
                <div className="p-3 bg-red-50 rounded-md text-center">
                  <h4 className="font-medium">Aula 102</h4>
                  <p className="text-sm text-red-600">Ocupada</p>
                </div>
                <div className="p-3 bg-green-50 rounded-md text-center">
                  <h4 className="font-medium">Aula 103</h4>
                  <p className="text-sm text-green-600">Disponible</p>
                </div>
                <div className="p-3 bg-green-50 rounded-md text-center">
                  <h4 className="font-medium">Aula 201</h4>
                  <p className="text-sm text-green-600">Disponible</p>
                </div>
                <div className="p-3 bg-green-50 rounded-md text-center">
                  <h4 className="font-medium">Aula 202</h4>
                  <p className="text-sm text-green-600">Disponible</p>
                </div>
                <div className="p-3 bg-red-50 rounded-md text-center">
                  <h4 className="font-medium">Aula 203</h4>
                  <p className="text-sm text-red-600">Ocupada</p>
                </div>
                <div className="p-3 bg-red-50 rounded-md text-center">
                  <h4 className="font-medium">Lab 1</h4>
                  <p className="text-sm text-red-600">Ocupada</p>
                </div>
                <div className="p-3 bg-green-50 rounded-md text-center">
                  <h4 className="font-medium">Lab 2</h4>
                  <p className="text-sm text-green-600">Disponible</p>
                </div>
                <div className="p-3 bg-red-50 rounded-md text-center">
                  <h4 className="font-medium">Lab 3</h4>
                  <p className="text-sm text-red-600">Ocupada</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

