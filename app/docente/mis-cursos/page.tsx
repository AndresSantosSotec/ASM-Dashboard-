"use client"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { FileUp, CheckCircle, Clock, BookOpen, Users, Calendar, Check, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

// Tipos de datos
type CourseStatus = "pending" | "active" | "declined"

interface Course {
  id: string
  title: string
  description: string
  students: number
  schedule: string
  startDate: string
  status: CourseStatus
  materials: Material[]
}

interface Material {
  id: string
  name: string
  type: string
  uploadDate: string
  size: string
}

export default function MisCursosPage() {
  // Estado para los cursos
  const [courses, setCourses] = useState<Course[]>([
    {
      id: "1",
      title: "Matemáticas Avanzadas",
      description: "Curso de matemáticas para nivel universitario",
      students: 32,
      schedule: "Lunes y Miércoles 10:00 - 12:00",
      startDate: "15/03/2025",
      status: "pending",
      materials: [],
    },
    {
      id: "2",
      title: "Física Cuántica",
      description: "Introducción a los principios de la física cuántica",
      students: 25,
      schedule: "Martes y Jueves 14:00 - 16:00",
      startDate: "20/03/2025",
      status: "pending",
      materials: [],
    },
    {
      id: "3",
      title: "Programación en Python",
      description: "Fundamentos de programación usando Python",
      students: 40,
      schedule: "Viernes 09:00 - 13:00",
      startDate: "10/03/2025",
      status: "active",
      materials: [
        {
          id: "m1",
          name: "Introducción a Python.pdf",
          type: "PDF",
          uploadDate: "05/03/2025",
          size: "2.4 MB",
        },
      ],
    },
  ])

  const [cursosPendientes, setCursosPendientes] = useState([
    {
      id: 1,
      titulo: "Introducción a la Programación",
      descripcion: "Fundamentos de programación para estudiantes de primer año",
      codigo: "CS101",
      departamento: "Ciencias de la Computación",
      facultad: "Ingeniería",
      nivelAcademico: "Pregrado",
      creditos: 4,
      horasSemanales: 6,
      modalidad: "Presencial",
      periodoAcademico: "2025-I",
      coordinador: "Dr. Juan Pérez",
      cupoMaximo: 35,
      cupoActual: 28,
      fechaInicio: "15/03/2025",
      fechaFin: "15/07/2025",
      horario: "Lunes y Miércoles 10:00 - 13:00",
      aula: "Laboratorio 3B",
      remuneracion: "$1,200 mensuales",
    },
    {
      id: 2,
      titulo: "Estadística Aplicada",
      descripcion: "Métodos estadísticos para investigación científica",
      codigo: "STAT202",
      departamento: "Matemáticas",
      facultad: "Ciencias",
      nivelAcademico: "Postgrado",
      creditos: 3,
      horasSemanales: 4,
      modalidad: "Híbrido",
      periodoAcademico: "2025-I",
      coordinador: "Dra. María González",
      cupoMaximo: 25,
      cupoActual: 18,
      fechaInicio: "20/03/2025",
      fechaFin: "20/07/2025",
      horario: "Martes y Jueves 15:00 - 17:00",
      aula: "Aula 201",
      remuneracion: "$1,500 mensuales",
    },
    {
      id: 3,
      titulo: "Metodología de la Investigación",
      descripcion: "Técnicas y métodos para la investigación académica",
      codigo: "RES301",
      departamento: "Investigación",
      facultad: "Multidisciplinario",
      nivelAcademico: "Postgrado",
      creditos: 3,
      horasSemanales: 5,
      modalidad: "Virtual",
      periodoAcademico: "2025-I",
      coordinador: "Dr. Roberto Sánchez",
      cupoMaximo: 30,
      cupoActual: 22,
      fechaInicio: "18/03/2025",
      fechaFin: "18/07/2025",
      horario: "Viernes 14:00 - 19:00",
      aula: "Aula Virtual 3",
      remuneracion: "$1,350 mensuales",
    },
  ])

  // Estado para el archivo seleccionado
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentCourseId, setCurrentCourseId] = useState<string>("")
  const [activeTab, setActiveTab] = useState("pending")

  // Función para aceptar un curso
  const acceptCourse = (courseId: string) => {
    setCourses(courses.map((course) => (course.id === courseId ? { ...course, status: "active" } : course)))
    toast({
      title: "Curso aceptado",
      description: "Has aceptado impartir este curso exitosamente.",
    })
  }

  const handleAceptarCurso = (cursoId: number) => {
    // Lógica para aceptar el curso
    console.log(`Curso con ID ${cursoId} aceptado`)
  }

  const handleDeclinarCurso = (cursoId: number) => {
    // Lógica para declinar el curso
    console.log(`Curso con ID ${cursoId} declinado`)
  }

  // Función para declinar un curso
  const declineCourse = (courseId: string) => {
    setCourses(courses.map((course) => (course.id === courseId ? { ...course, status: "declined" } : course)))
    toast({
      title: "Curso declinado",
      description: "Has declinado impartir este curso.",
    })
  }

  // Función para cargar material didáctico
  const uploadMaterial = () => {
    if (!selectedFile || !currentCourseId) return

    const newMaterial: Material = {
      id: `m${Date.now()}`,
      name: selectedFile.name,
      type: selectedFile.name.split(".").pop()?.toUpperCase() || "DESCONOCIDO",
      uploadDate: new Date().toLocaleDateString(),
      size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
    }

    setCourses(
      courses.map((course) =>
        course.id === currentCourseId ? { ...course, materials: [...course.materials, newMaterial] } : course,
      ),
    )

    setSelectedFile(null)

    toast({
      title: "Material cargado",
      description: `${selectedFile.name} ha sido cargado exitosamente.`,
    })
  }

  // Función para manejar la selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Mis Cursos</h1>

      <Tabs defaultValue="pending" className="w-full" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="declined">Declinados</TabsTrigger>
        </TabsList>

        {/* Cursos Pendientes */}
        <TabsContent value="pending">
          {activeTab === "pending" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {cursosPendientes.map((curso) => (
                <Card key={curso.id} className="overflow-hidden border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold">{curso.titulo}</CardTitle>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Pendiente
                      </Badge>
                    </div>
                    <CardDescription>{curso.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-1 gap-2">
                        <h4 className="font-semibold text-primary">Ficha de Inscripción:</h4>

                        <div className="bg-muted p-3 rounded-md space-y-2">
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Código del curso:</div>
                            <div className="font-medium">{curso.codigo}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Departamento:</div>
                            <div className="font-medium">{curso.departamento}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Facultad:</div>
                            <div className="font-medium">{curso.facultad}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Nivel académico:</div>
                            <div className="font-medium">{curso.nivelAcademico}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Créditos:</div>
                            <div className="font-medium">{curso.creditos}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Horas semanales:</div>
                            <div className="font-medium">{curso.horasSemanales}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Modalidad:</div>
                            <div className="font-medium">{curso.modalidad}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Periodo académico:</div>
                            <div className="font-medium">{curso.periodoAcademico}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Coordinador:</div>
                            <div className="font-medium">{curso.coordinador}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Cupo máximo:</div>
                            <div className="font-medium">{curso.cupoMaximo} estudiantes</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Cupo actual:</div>
                            <div className="font-medium">{curso.cupoActual} estudiantes</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Fecha inicio:</div>
                            <div className="font-medium">{curso.fechaInicio}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Fecha fin:</div>
                            <div className="font-medium">{curso.fechaFin}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Horario:</div>
                            <div className="font-medium">{curso.horario}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Aula:</div>
                            <div className="font-medium">{curso.aula}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-muted-foreground">Remuneración:</div>
                            <div className="font-medium">{curso.remuneracion}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                          <X className="mr-1 h-4 w-4" /> Declinar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro de que quieres declinar este curso?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Si declinas el curso, no podrás aceptarlo después.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeclinarCurso(curso.id)}>Declinar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAceptarCurso(curso.id)}
                    >
                      <Check className="mr-1 h-4 w-4" /> Aceptar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          {cursosPendientes.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">No tienes cursos pendientes por aceptar o declinar.</p>
            </div>
          )}
        </TabsContent>

        {/* Cursos Activos */}
        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses
              .filter((course) => course.status === "active")
              .map((course) => (
                <Card key={course.id} className="shadow-md">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{course.title}</CardTitle>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Activo
                      </Badge>
                    </div>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{course.students} estudiantes</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{course.schedule}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">Inicia: {course.startDate}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Material Didáctico</h4>
                      {course.materials.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {course.materials.map((material) => (
                            <div key={material.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                                <span className="text-sm">{material.name}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{material.size}</span>
                                <span>·</span>
                                <span>{material.uploadDate}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No hay material didáctico cargado.</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" onClick={() => setCurrentCourseId(course.id)}>
                          <FileUp className="h-4 w-4 mr-2" />
                          Cargar Material Didáctico
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cargar Material Didáctico</DialogTitle>
                          <DialogDescription>
                            Sube archivos para compartir con tus estudiantes en el curso "{course.title}".
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="material">Archivo</Label>
                            <Input id="material" type="file" onChange={handleFileChange} />
                            {selectedFile && (
                              <p className="text-sm text-gray-500 mt-1">
                                Archivo seleccionado: {selectedFile.name} (
                                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                              </p>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" onClick={uploadMaterial} disabled={!selectedFile}>
                            Cargar Material
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
          </div>

          {courses.filter((course) => course.status === "active").length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">No tienes cursos activos actualmente.</p>
            </div>
          )}
        </TabsContent>

        {/* Cursos Declinados */}
        <TabsContent value="declined">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses
              .filter((course) => course.status === "declined")
              .map((course) => (
                <Card key={course.id} className="shadow-md opacity-75">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-gray-600">{course.title}</CardTitle>
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        Declinado
                      </Badge>
                    </div>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{course.students} estudiantes</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{course.schedule}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">Inicia: {course.startDate}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => acceptCourse(course.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Reconsiderar y Aceptar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>

          {courses.filter((course) => course.status === "declined").length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">No has declinado ningún curso.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

