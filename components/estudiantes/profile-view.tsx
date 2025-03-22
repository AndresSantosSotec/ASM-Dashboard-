"use client"

import type React from "react"

import { useState } from "react"
import {
  Mail,
  Phone,
  Book,
  Calendar,
  MapPin,
  Camera,
  Edit2,
  CheckCircle,
  Shield,
  Download,
  Settings,
  AlertCircle,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Datos de ejemplo del estudiante
const studentData = {
  id: "EST2023-0042",
  name: "Laura García Martínez",
  email: "laura.garcia@estudiante.edu",
  phone: "+123 456 7890",
  carnet: "202304578",
  program: "Ingeniería en Sistemas",
  startDate: "Agosto 2023",
  endDate: "Junio 2027",
  semester: "2do Semestre",
  address: "Av. Principal #123, Zona 10",
  city: "Ciudad Universitaria",
  emergencyContact: "Carlos García - +123 456 7891",
  profileComplete: 85,
  bio: "Estudiante de Ingeniería en Sistemas con interés en desarrollo web y ciencia de datos. Participante activa en hackatones y proyectos de investigación.",
  avatarUrl: "/placeholder.svg?height=200&width=200",
}

// Historial académico de ejemplo
const academicHistory = [
  { id: 1, course: "Programación I", grade: 92, credits: 4, status: "Aprobado", semester: "1er Semestre" },
  { id: 2, course: "Matemáticas Discretas", grade: 88, credits: 4, status: "Aprobado", semester: "1er Semestre" },
  {
    id: 3,
    course: "Introducción a la Ingeniería",
    grade: 95,
    credits: 3,
    status: "Aprobado",
    semester: "1er Semestre",
  },
  {
    id: 4,
    course: "Algoritmos y Estructura de Datos",
    grade: 85,
    credits: 4,
    status: "En curso",
    semester: "2do Semestre",
  },
  { id: 5, course: "Bases de Datos", grade: null, credits: 4, status: "En curso", semester: "2do Semestre" },
  {
    id: 6,
    course: "Arquitectura de Computadoras",
    grade: null,
    credits: 3,
    status: "En curso",
    semester: "2do Semestre",
  },
]

export default function ProfileView() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    phone: studentData.phone,
    address: studentData.address,
    city: studentData.city,
    emergencyContact: studentData.emergencyContact,
    bio: studentData.bio,
  })

  // Función para calcular el GPA (suponiendo escala 0-100)
  const calculateGPA = () => {
    const completedCourses = academicHistory.filter((course) => course.grade !== null)
    if (completedCourses.length === 0) return 0

    const totalPoints = completedCourses.reduce((sum, course) => sum + (course.grade || 0) * course.credits, 0)
    const totalCredits = completedCourses.reduce((sum, course) => sum + course.credits, 0)

    return totalPoints / totalCredits
  }

  const gpa = calculateGPA()

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Guardar cambios del perfil
  const handleSaveProfile = () => {
    // Aquí se implementaría la lógica para guardar en la base de datos
    // Por ahora, solo cambiamos el estado de edición
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="relative pb-0">
          <div className="bg-blue-50 absolute top-0 left-0 right-0 h-32 rounded-t-lg"></div>
          <div className="relative flex flex-col sm:flex-row items-center">
            <div className="relative mb-4 sm:mb-0">
              <Avatar className="w-24 h-24 border-4 border-white bg-white">
                <AvatarImage src={studentData.avatarUrl} alt={studentData.name} />
                <AvatarFallback>
                  {studentData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full w-8 h-8 bg-white shadow-sm"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center sm:text-left sm:ml-6">
              <CardTitle className="text-2xl">{studentData.name}</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {studentData.program}
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {studentData.semester}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Carnet: {studentData.carnet}
                  </Badge>
                </div>
              </CardDescription>
            </div>
            <div className="sm:ml-auto mt-4 sm:mt-0">
              <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4" />
                    Editar Perfil
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="personal">
            <TabsList className="mb-6">
              <TabsTrigger value="personal">Información Personal</TabsTrigger>
              <TabsTrigger value="academic">Historial Académico</TabsTrigger>
              <TabsTrigger value="security">Seguridad y Privacidad</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <div className="space-y-6">
                {!isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">ID Estudiante</h3>
                      <p>{studentData.id}</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Correo Electrónico</h3>
                      <p className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {studentData.email}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Teléfono</h3>
                      <p className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {formData.phone}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Programa</h3>
                      <p className="flex items-center">
                        <Book className="h-4 w-4 mr-2 text-gray-400" />
                        {studentData.program}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Período de Estudio</h3>
                      <p className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {studentData.startDate} - {studentData.endDate}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Dirección</h3>
                      <p className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {formData.address}, {formData.city}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Contacto de Emergencia</h3>
                      <p>{formData.emergencyContact}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500">Biografía</h3>
                      <p>{formData.bio}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Contacto de Emergencia</Label>
                        <Input
                          id="emergencyContact"
                          name="emergencyContact"
                          value={formData.emergencyContact}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Ciudad</Label>
                        <Input id="city" name="city" value={formData.city} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bio">Biografía</Label>
                        <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} rows={4} />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveProfile}>Guardar Cambios</Button>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Completitud del Perfil</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Perfil completado al {studentData.profileComplete}%</span>
                      <span className="text-sm font-medium">{studentData.profileComplete}%</span>
                    </div>
                    <Progress value={studentData.profileComplete} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="academic">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Promedio General</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{gpa.toFixed(1)}</div>
                      <p className="text-sm text-gray-500">Escala 0-100</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Créditos Aprobados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {academicHistory
                          .filter((course) => course.status === "Aprobado")
                          .reduce((sum, course) => sum + course.credits, 0)}
                      </div>
                      <p className="text-sm text-gray-500">De 180 totales</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Cursos Actuales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">
                        {academicHistory.filter((course) => course.status === "En curso").length}
                      </div>
                      <p className="text-sm text-gray-500">En este semestre</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Historial de Cursos</h3>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Curso
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Semestre
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Créditos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Calificación
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {academicHistory.map((course) => (
                          <tr key={course.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{course.course}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.semester}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.credits}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {course.grade !== null ? course.grade : "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                className={
                                  course.status === "Aprobado"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : course.status === "En curso"
                                      ? "bg-blue-100 text-blue-800 border-blue-200"
                                      : "bg-red-100 text-red-800 border-red-200"
                                }
                              >
                                {course.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Descargar Historial
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cambiar Contraseña</CardTitle>
                    <CardDescription>
                      Actualiza tu contraseña periódicamente para mantener tu cuenta segura
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Contraseña Actual</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nueva Contraseña</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Actualizar Contraseña</Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Verificación en Dos Pasos</CardTitle>
                    <CardDescription>Añade una capa adicional de seguridad a tu cuenta</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-8 w-8 text-blue-500" />
                      <div>
                        <h4 className="font-medium">Autenticación de Dos Factores</h4>
                        <p className="text-sm text-gray-500">Protege tu cuenta con verificación adicional</p>
                      </div>
                    </div>
                    <Switch id="2fa" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sesiones Activas</CardTitle>
                    <CardDescription>Dispositivos donde has iniciado sesión recientemente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-full">
                          <Settings className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">Windows PC - Chrome</h4>
                          <p className="text-sm text-gray-500">Ciudad Universitaria, Guatemala • Activo ahora</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Actual</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-50 rounded-full">
                          <Settings className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">iPhone - Safari</h4>
                          <p className="text-sm text-gray-500">Ciudad Universitaria, Guatemala • Hace 2 días</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                        Cerrar Sesión
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Cerrar Todas las Sesiones
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base">
                      <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                      Zona de Peligro
                    </CardTitle>
                    <CardDescription>Acciones que afectan permanentemente a tu cuenta</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive">Desactivar Cuenta</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

