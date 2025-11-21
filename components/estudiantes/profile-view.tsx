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
  MessageCircle,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import profileService, { PerfilData, HistorialAcademico, ProfileStudent } from "@/services/profile"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRef } from "react"
import ProfileSkeleton from "./profile-skeleton"

export default function ProfileView() {
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [perfilData, setPerfilData] = useState<PerfilData | null>(null)
  const [historialAcademico, setHistorialAcademico] = useState<HistorialAcademico | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [passwordData, setPasswordData] = useState({
    contrasena_actual: "",
    contrasena_nueva: "",
    contrasena_nueva_confirmation: ""
  })
  
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
      const [perfil, historial] = await Promise.allSettled([
        profileService.getMiPerfil(),
        profileService.getHistorialAcademico().catch(err => {
          // Si falla, devolver estructura vacía en lugar de lanzar error
          console.warn("Error cargando historial académico:", err)
          return {
            resumen: {
              promedio_general: 0,
              cursos_aprobados: 0,
              cursos_actuales: 0,
              creditos_aprobados: 0,
              creditos_totales: 0,
            },
            cursos: [],
            tiene_datos_moodle: false,
            mensaje: 'No se pudo cargar el historial académico. Por favor, contacte al administrador.',
          }
        })
      ])
      
      if (perfil.status === 'fulfilled') {
        const perfilValue = perfil.value
        setPerfilData(perfilValue)
        
        // Inicializar formData con datos del perfil editable (si existe)
        const perfilEditable: Partial<ProfileStudent> = perfilValue.perfil_editable || {}
        setFormData({
          telefono: perfilEditable.telefono || "",
          telefono_emergencia: perfilEditable.telefono_emergencia || "",
          nombre_contacto_emergencia: perfilEditable.nombre_contacto_emergencia || "",
          parentesco_emergencia: perfilEditable.parentesco_emergencia || "",
          direccion: perfilEditable.direccion || "",
          ciudad: perfilEditable.ciudad || "",
          biografia: perfilEditable.biografia || "",
        })
      } else {
        throw perfil.reason
      }
      
      if (historial.status === 'fulfilled') {
        setHistorialAcademico(historial.value)
      }
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
    if (!historialAcademico?.cursos || !Array.isArray(historialAcademico.cursos)) return 0
    
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

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleDescargarHistorial = async () => {
    try {
      setDownloadingPDF(true)
      
      toast({
        title: "Generando PDF...",
        description: "Por favor espera un momento"
      })

      await profileService.descargarHistorialPDF()
      
      toast({
        title: "✅ Descarga exitosa",
        description: "Tu historial académico se descargó correctamente"
      })
    } catch (error: any) {
      console.error("Error descargando historial:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo descargar el historial",
        variant: "destructive"
      })
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handlePasswordChange = async () => {
    // Validar que todos los campos estén llenos
    if (!passwordData.contrasena_actual || !passwordData.contrasena_nueva || !passwordData.contrasena_nueva_confirmation) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      })
      return
    }

    // Validar que las contraseñas nuevas coincidan
    if (passwordData.contrasena_nueva !== passwordData.contrasena_nueva_confirmation) {
      toast({
        title: "Error",
        description: "Las contraseñas nuevas no coinciden",
        variant: "destructive"
      })
      return
    }

    // Validar longitud mínima
    if (passwordData.contrasena_nueva.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      })
      return
    }

    try {
      setChangingPassword(true)
      
      await profileService.cambiarContrasena(passwordData)
      
      toast({
        title: "✅ Contraseña actualizada",
        description: "Tu contraseña se cambió correctamente"
      })
      
      // Limpiar formulario
      setPasswordData({
        contrasena_actual: "",
        contrasena_nueva: "",
        contrasena_nueva_confirmation: ""
      })
    } catch (error: any) {
      console.error("Error cambiando contraseña:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la contraseña",
        variant: "destructive"
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen válida (JPG, PNG o GIF)",
        variant: "destructive"
      })
      return
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar los 2MB",
        variant: "destructive"
      })
      return
    }

    try {
      setUploadingPhoto(true)
      
      toast({
        title: "Subiendo foto...",
        description: "Por favor espera un momento"
      })

      const result = await profileService.subirFotoPerfil(file)
      
      toast({
        title: "✅ Foto actualizada",
        description: "Tu foto de perfil se actualizó correctamente"
      })

      // Actualizar el perfil localmente con la URL completa que viene del backend
      if (perfilData) {
        // Agregar timestamp para evitar caché del navegador
        const urlConCache = result.foto_perfil + '?t=' + Date.now()
        
        setPerfilData({
          ...perfilData,
          perfil_editable: {
            ...(perfilData.perfil_editable || {}),
            foto_perfil: urlConCache
          }
        })
      }
    } catch (error: any) {
      console.error("Error subiendo foto:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la foto",
        variant: "destructive"
      })
    } finally {
      setUploadingPhoto(false)
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }  
  
  if (loading) {
    return <ProfileSkeleton />
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
                <AvatarImage src={perfilData?.perfil_editable?.foto_perfil || "/placeholder.svg"} alt={perfilData?.prospecto?.nombre_completo || "Usuario"} />
                <AvatarFallback>
                  {perfilData?.prospecto?.nombre_completo
                    ?.split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full w-8 h-8 bg-white shadow-sm"
                onClick={handlePhotoClick}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="text-center sm:text-left sm:ml-6">
              <CardTitle className="text-2xl">{perfilData?.prospecto?.nombre_completo || "Usuario"}</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  {perfilData?.programa && (
                    <>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {perfilData.programa.nombre}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {perfilData.programa.estado || "Activo"}
                      </Badge>
                    </>
                  )}
                  {perfilData?.prospecto?.carnet && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Carnet: {perfilData.prospecto.carnet}
                    </Badge>
                  )}
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
                          const perfilEditable: Partial<ProfileStudent> = perfilData?.perfil_editable || {}
                          const fields = [
                            perfilEditable.telefono,
                            perfilEditable.telefono_emergencia,
                            perfilEditable.direccion,
                            perfilEditable.ciudad,
                            perfilEditable.biografia,
                            perfilEditable.foto_perfil
                          ]
                          const completed = fields.filter(f => f).length
                          const percentage = Math.round((completed / fields.length) * 100)
                          return `${percentage}%`
                        })()}
                      </span>
                    </div>
                    <Progress value={(() => {
                      const perfilEditable: Partial<ProfileStudent> = perfilData?.perfil_editable || {}
                      const fields = [
                        perfilEditable.telefono,
                        perfilEditable.telefono_emergencia,
                        perfilEditable.direccion,
                        perfilEditable.ciudad,
                        perfilEditable.biografia,
                        perfilEditable.foto_perfil
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
                        {historialAcademico?.cursos?.filter((course) => course.calificacion !== null).length || 0}
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
                        {historialAcademico?.cursos?.length || 0}
                      </div>
                      <p className="text-sm text-gray-500">En Moodle</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Historial de Cursos</h3>
                  {historialAcademico?.cursos && Array.isArray(historialAcademico.cursos) && historialAcademico.cursos.length > 0 ? (
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
                          {historialAcademico?.cursos?.map((course, index) => (
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
                    <Alert variant="default" className="border-yellow-500 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Estudiante aún no creado en Moodle</AlertTitle>
                      <AlertDescription className="text-yellow-700 space-y-3">
                        <p>
                          Tu cuenta en Moodle aún no ha sido creada. En un lapso de 24 horas estará habilitada y podrás acceder a tus cursos y materiales académicos.
                        </p>
                        <div className="mt-4 pt-3 border-t border-yellow-300">
                          <p className="font-semibold mb-2">¿Necesitas asistencia?</p>
                          <p className="text-sm mb-2">
                            Si tienes algún problema para ingresar o necesitas asistencia, por favor contacta a soporte técnico:
                          </p>
                          <div className="flex flex-col gap-2 text-sm">
                            <a 
                              href="mailto:informatica@american-edu.com" 
                              className="flex items-center gap-2 text-yellow-800 hover:text-yellow-900 underline"
                            >
                              <Mail className="h-4 w-4" />
                              informatica@american-edu.com
                            </a>
                            <a 
                              href="mailto:soporte@american-edu.com" 
                              className="flex items-center gap-2 text-yellow-800 hover:text-yellow-900 underline"
                            >
                              <Mail className="h-4 w-4" />
                              soporte@american-edu.com
                            </a>
                            <a 
                              href="https://wa.me/50247629787/" 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-yellow-800 hover:text-yellow-900 underline"
                            >
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp: +502 4762-9787
                            </a>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleDescargarHistorial}
                    disabled={downloadingPDF || !historialAcademico || !historialAcademico.cursos || historialAcademico.cursos.length === 0}
                  >
                    {downloadingPDF ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Descargar Historial PDF
                      </>
                    )}
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
                      <Input 
                        id="current-password" 
                        type="password" 
                        value={passwordData.contrasena_actual}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, contrasena_actual: e.target.value }))}
                        disabled={changingPassword}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nueva Contraseña</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        value={passwordData.contrasena_nueva}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, contrasena_nueva: e.target.value }))}
                        disabled={changingPassword}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        value={passwordData.contrasena_nueva_confirmation}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, contrasena_nueva_confirmation: e.target.value }))}
                        disabled={changingPassword}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handlePasswordChange} disabled={changingPassword}>
                      {changingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Actualizando...
                        </>
                      ) : (
                        "Actualizar Contraseña"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

