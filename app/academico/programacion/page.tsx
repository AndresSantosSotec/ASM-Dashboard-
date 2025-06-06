"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse as apiDeleteCourse,
  approveCourse,
  syncCourseToMoodle,
  assignFacilitator as apiAssignFacilitator,
  fetchFacilitators,
} from "@/services/courses"

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
  facilitator: { id: number; name: string } | null
  status: "draft" | "approved" | "synced"
  students: number
}

interface Facilitator {
  id: string
  name: string
  specialty: string
  availability: string[]
}


export default function ProgramacionCursos() {
  const [courses, setCourses] = useState<Course[]>([])
  const [facilitators, setFacilitators] = useState<Facilitator[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [areaFilter, setAreaFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSyncingToMoodle, setIsSyncingToMoodle] = useState(false)

  useEffect(() => {
    fetchCourses().then(setCourses).catch(console.error)
    fetchFacilitators().then(setFacilitators).catch(console.error)
  }, [])


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
  const handleSaveCourse = async () => {
    const payload = {
      name: formData.name,
      code: formData.code,
      area: formData.area,
      credits: formData.credits,
      start_date: formData.startDate,
      end_date: formData.endDate,
      schedule: formData.schedule,
      duration: formData.duration,
      facilitator_id:
        formData.facilitator?.id !== undefined && formData.facilitator?.id !== null
          ? Number(formData.facilitator.id)
          : null,
    }

    try {
      if (selectedCourse) {
        const updated = await updateCourse(Number(selectedCourse.id), payload)
        setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        toast({
          title: "Curso actualizado",
          description: `El curso ${updated.name} ha sido actualizado.`,
        })
      } else {
        const created = await createCourse(payload)
        setCourses((prev) => [...prev, created])
        toast({
          title: "Curso creado",
          description: `El curso ${created.name} ha sido creado correctamente.`,
        })
      }
      setIsFormOpen(false)
    } catch (err: any) {
      console.error(err.response?.data || err)
    }
  }

  // Eliminar curso
  const handleDelete = async (id: string) => {
    try {
      await apiDeleteCourse(Number(id))
      setCourses((prev) => prev.filter((c) => c.id !== id))
      if (selectedCourse?.id === id) {
        setSelectedCourse(null)
      }
      toast({
        title: "Curso eliminado",
        description: "El curso ha sido eliminado correctamente.",
      })
    } catch (err: any) {
      console.error(err.response?.data || err)
    }
  }

  // Aprobar programación
  const handleApproveCourse = async (id: string) => {
    try {
      const updated = await approveCourse(Number(id))
      setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      if (selectedCourse?.id === id) {
        setSelectedCourse(updated)
      }
      toast({
        title: "Programación aprobada",
        description: "La programación del curso ha sido aprobada.",
      })
    } catch (err: any) {
      console.error(err.response?.data || err)
    }
  }

  // Sincronizar con Moodle
  const handleSyncToMoodle = async (id: string) => {
    setIsSyncingToMoodle(true)
    try {
      const updated = await syncCourseToMoodle(Number(id))
      setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      if (selectedCourse?.id === id) {
        setSelectedCourse(updated)
      }
      toast({
        title: "Curso sincronizado con Moodle",
        description: "El curso ha sido sincronizado correctamente con la plataforma Moodle.",
      })
    } catch (err: any) {
      console.error(err.response?.data || err)
    } finally {
      setIsSyncingToMoodle(false)
    }
  }

  // Asignar facilitador
  const handleAssignFacilitator = async (courseId: string, facilitatorId: string | null) => {
    try {
      const updated = await apiAssignFacilitator(Number(courseId), facilitatorId ? Number(facilitatorId) : null)
      setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(updated)
      }
      toast({
        title: facilitatorId ? "Facilitador asignado" : "Facilitador removido",
        description: facilitatorId ? "El facilitador ha sido asignado al curso." : "El facilitador ha sido removido del curso.",
      })
    } catch (err: any) {
      console.error(err.response?.data || err)
    }
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
        <div className="space-y-6 md:col-span-4">
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
                                <span>{course.facilitator.name}</span>
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
                        <div className="font-medium">{selectedCourse.facilitator?.name || "Sin asignar"}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="facilitators" className="pt-4">
                    <div className="space-y-4">
                      {facilitators.map((facilitator) => (
                        <div
                          key={facilitator.id}
                          className={`border rounded-lg p-4 ${
                            selectedCourse.facilitator?.id === facilitator.id ? "border-blue-500 bg-blue-50" : ""
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
                              variant={selectedCourse.facilitator?.id === facilitator.id ? "outline" : "default"}
                              size="sm"
                              onClick={() =>
                                handleAssignFacilitator(
                                  selectedCourse.id,
                                  selectedCourse.facilitator?.id === facilitator.id ? null : facilitator.id,
                                )
                              }
                            >
                              {selectedCourse.facilitator?.id === facilitator.id ? "Remover" : "Asignar"}
                            </Button>
                          </div>
                        </div>
                      ))}
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

    </div>
  )
}

