"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  Loader2,
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
import { useToast } from "@/hooks/use-toast"
import profileService, { PerfilData, HistorialAcademico } from "@/services/profile"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function ProfileView() {
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [perfilData, setPerfilData] = useState<PerfilData | null>(null)
  const [historialAcademico, setHistorialAcademico] = useState<HistorialAcademico | null>(null)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    telefono: "",
    telefono_emergencia: "",
    nombre_contacto_emergencia: "",
    parentesco_emergencia: "",
    direccion: "",
    ciudad: "",
    biografia: "",
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Cargar perfil y historial en paralelo
      const [perfil, historial] = await Promise.all([
        profileService.getMiPerfil(),
        profileService.getHistorialAcademico()
      ])
      
      setPerfilData(perfil)
      setHistorialAcademico(historial)
      
      // Inicializar formData con datos del perfil editable
      setFormData({
        telefono: perfil.perfil_editable.telefono || "",
        telefono_emergencia: perfil.perfil_editable.telefono_emergencia || "",
        nombre_contacto_emergencia: perfil.perfil_editable.nombre_contacto_emergencia || "",
        parentesco_emergencia: perfil.perfil_editable.parentesco_emergencia || "",
        direccion: perfil.perfil_editable.direccion || "",
        ciudad: perfil.perfil_editable.ciudad || "",
        biografia: perfil.perfil_editable.biografia || "",
      })
    } catch (error: any) {
      console.error("Error cargando datos:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los datos del perfil",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para calcular el GPA desde historial real
  const calculateGPA = () => {
    if (!historialAcademico || !historialAcademico.cursos) return 0
    
    const completedCourses = historialAcademico.cursos.filter((course) => course.calificacion !== null)
    if (completedCourses.length === 0) return 0

    const totalGrade = completedCourses.reduce((sum, course) => sum + (course.calificacion || 0), 0)
    return totalGrade / completedCourses.length
  }

  const gpa = calculateGPA()

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true)
      await profileService.actualizarPerfil(formData)
      
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se guardaron correctamente"
      })
      
      setIsEditing(false)
      // Recargar datos
      await cargarDatos()
    } catch (error: any) {
      console.error("Error actualizando perfil:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }  
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!perfilData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No se pudo cargar el perfil</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="relative pb-0">
          <div className="bg-blue-50 absolute top-0 left-0 right-0 h-32 rounded-t-lg"></div>
          <div className="relative flex flex-col sm:flex-row items-center">
            <div className="relative mb-4 sm:mb-0">
              <Avatar className="w-24 h-24 border-4 border-white bg-white">
                <AvatarImage src={perfilData.perfil_editable.foto_perfil || "/placeholder.svg"} alt={perfilData.prospecto.nombre_completo} />
                <AvatarFallback>
                  {perfilData.prospecto.nombre_completo
                    .split(" ")
                    .slice(0, 2)
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
              <CardTitle className="text-2xl">{perfilData.prospecto.nombre_completo}</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {perfilData.programa.nombre}
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {perfilData.programa.estado || "Activo"}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Carnet: {perfilData.prospecto.carnet}
                  </Badge>
                </div>
              </CardDescription>
            </div>
            <div className="sm:ml-auto mt-4 sm:mt-0">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                  Editar Perfil
                </Button>
              )}
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
                      <h3 className="text-sm font-medium text-gray-500">Carnet</h3>
                      <p>{perfilData.prospecto.carnet}</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Correo Electrónico</h3>
                      <p className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {perfilData.prospecto.correo_electronico}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Teléfono</h3>
                      <p className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {formData.telefono || "No especificado"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Programa</h3>
                      <p className="flex items-center">
                        <Book className="h-4 w-4 mr-2 text-gray-400" />
                        {perfilData.programa?.nombre || "No especificado"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Fecha de Inicio</h3>
                      <p className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {perfilData.programa?.fecha_inicio ? format(new Date(perfilData.programa.fecha_inicio), "dd 'de' MMMM, yyyy", { locale: es }) : "No especificado"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Dirección</h3>
                      <p className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {formData.direccion && formData.ciudad ? `${formData.direccion}, ${formData.ciudad}` : "No especificado"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Contacto de Emergencia</h3>
                      <p>
                        {formData.nombre_contacto_emergencia && formData.telefono_emergencia 
                          ? `${formData.nombre_contacto_emergencia} (${formData.parentesco_emergencia || "N/A"}) - ${formData.telefono_emergencia}`
                          : "No especificado"}
                      </p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500">Biografía</h3>
                      <p>{formData.biografia || "No especificado"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono_emergencia">Teléfono de Emergencia</Label>
                        <Input
                          id="telefono_emergencia"
                          name="telefono_emergencia"
                          value={formData.telefono_emergencia}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nombre_contacto_emergencia">Nombre Contacto Emergencia</Label>
                        <Input
                          id="nombre_contacto_emergencia"
                          name="nombre_contacto_emergencia"
                          value={formData.nombre_contacto_emergencia}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parentesco_emergencia">Parentesco</Label>
                        <Input
                          id="parentesco_emergencia"
                          name="parentesco_emergencia"
                          value={formData.parentesco_emergencia}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="direccion">Dirección</Label>
                        <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ciudad">Ciudad</Label>
                        <Input id="ciudad" name="ciudad" value={formData.ciudad} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="biografia">Biografía</Label>
                        <Textarea id="biografia" name="biografia" value={formData.biografia} onChange={handleInputChange} rows={4} />
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
                      <span className="text-sm">Perfil completado</span>
                      <span className="text-sm font-medium">
                        {(() => {
                          const fields = [
                            perfilData.perfil_editable.telefono,
                            perfilData.perfil_editable.telefono_emergencia,
                            perfilData.perfil_editable.direccion,
                            perfilData.perfil_editable.ciudad,
                            perfilData.perfil_editable.biografia,
                            perfilData.perfil_editable.foto_perfil
                          ]
                          const completed = fields.filter(f => f).length
                          const percentage = Math.round((completed / fields.length) * 100)
                          return `${percentage}%`
                        })()}
                      </span>
                    </div>
                    <Progress value={(() => {
                      const fields = [
                        perfilData.perfil_editable.telefono,
                        perfilData.perfil_editable.telefono_emergencia,
                        perfilData.perfil_editable.direccion,
                        perfilData.perfil_editable.ciudad,
                        perfilData.perfil_editable.biografia,
                        perfilData.perfil_editable.foto_perfil
                      ]
                      const completed = fields.filter(f => f).length
                      return Math.round((completed / fields.length) * 100)
                    })()} />
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
                      <CardTitle className="text-base">Cursos Completados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {historialAcademico?.cursos.filter((course) => course.calificacion !== null).length || 0}
                      </div>
                      <p className="text-sm text-gray-500">Cursos aprobados</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Total Cursos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">
                        {historialAcademico?.cursos.length || 0}
                      </div>
                      <p className="text-sm text-gray-500">En Moodle</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Historial de Cursos</h3>
                  {historialAcademico && historialAcademico.cursos.length > 0 ? (
                    <div className="rounded-lg border overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Curso
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Código
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha Inicio
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
                          {historialAcademico.cursos.map((course, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 text-sm font-medium">{course.curso}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.codigo_curso || "—"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {course.fecha_inicio ? format(new Date(course.fecha_inicio), "dd/MM/yyyy") : "—"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {course.calificacion !== null && course.calificacion !== undefined ? (
                                  <span className="font-medium">{course.calificacion.toFixed(1)}</span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge
                                  variant="outline"
                                  className={
                                    course.estado === "Aprobado"
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : course.estado === "En curso"
                                        ? "bg-blue-100 text-blue-800 border-blue-200"
                                        : "bg-red-100 text-red-800 border-red-200"
                                  }
                                >
                                  {course.estado}
                                </Badge>
                              </td>
                            </tr>
                          ))}\n                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No se encontraron cursos en el historial académico
                    </div>
                  )}
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

