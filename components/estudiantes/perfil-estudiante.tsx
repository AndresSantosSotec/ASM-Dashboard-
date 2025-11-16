"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EstadoCuenta } from "@/components/estudiantes/estado-cuenta"
import { HistorialAcademicoTab } from "@/components/estudiantes/historial-academico-tab"
import { UserIcon, BookOpenIcon, CalendarIcon, GraduationCapIcon, DownloadIcon, CreditCardIcon, Loader2Icon } from "lucide-react"
import profileService, { PerfilData, AcademicStats } from "@/services/profile"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PerfilEstudianteProps {
  estudianteId: string
}

export function PerfilEstudiante({ estudianteId }: PerfilEstudianteProps) {
  const [cargando, setCargando] = useState(true)
  const [descargando, setDescargando] = useState(false)
  const [perfilData, setPerfilData] = useState<PerfilData | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    cargarPerfil()
  }, [])

  const cargarPerfil = async () => {
    try {
      setCargando(true)
      const data = await profileService.getMiPerfil()
      setPerfilData(data)
    } catch (error: any) {
      console.error("Error cargando perfil:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el perfil del estudiante",
        variant: "destructive"
      })
    } finally {
      setCargando(false)
    }
  }

  // Función para descargar estado de cuenta
  const descargarEstadoCuenta = () => {
    setDescargando(true)

    // Simulación de descarga - En producción, esto generaría un PDF
    setTimeout(() => {
      setDescargando(false)
      // Aquí iría la lógica real de descarga
      toast({
        title: "Descarga completada",
        description: "Estado de cuenta descargado correctamente"
      })
    }, 1500)
  }

  // Función para formatear fecha
  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "No especificada"
    try {
      return format(new Date(fecha), "d 'de' MMMM, yyyy", { locale: es })
    } catch {
      return fecha
    }
  }

  // Función para obtener badge de estado
  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'default'
      case 'graduado':
        return 'secondary'
      case 'suspendido':
      case 'retirado':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Mostrar loader mientras carga
  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Si no hay perfil
  if (!perfilData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No se pudo cargar la información del perfil
          </p>
        </CardContent>
      </Card>
    )
  }

  const { prospecto, programa, perfil_editable, estadisticas } = perfilData
  const nombreCompleto = prospecto.nombre_completo || 'Estudiante'
  const progresoCalculado = estadisticas 
    ? Math.round((estadisticas.cursos_aprobados / (estadisticas.cursos_aprobados + estadisticas.cursos_actuales || 1)) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <CardTitle>Información del Estudiante</CardTitle>
            <CardDescription>Datos personales y académicos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src={perfil_editable.foto_perfil || "/placeholder.svg?height=100&width=100"} alt={nombreCompleto} />
                <AvatarFallback>
                  <UserIcon className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-bold">{nombreCompleto}</h3>
                <p className="text-sm text-muted-foreground">{prospecto.carnet}</p>
                {programa && (
                  <Badge className="mt-2">
                    {programa.estado || 'Activo'}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Contacto</p>
                  <p className="text-sm text-muted-foreground">{prospecto.correo_electronico || "No especificado"}</p>
                  <p className="text-sm text-muted-foreground">{perfil_editable.telefono || "No especificado"}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <GraduationCapIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Programa</p>
                  <p className="text-sm text-muted-foreground">{programa?.nombre || "No especificado"}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Fecha de Inicio</p>
                  <p className="text-sm text-muted-foreground">{formatearFecha(programa?.fecha_inicio)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <BookOpenIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Progreso Académico</p>
                  <div className="w-full bg-secondary h-2 rounded-full mt-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${progresoCalculado}%` }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{progresoCalculado}% completado</p>
                  {estadisticas && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {estadisticas.cursos_aprobados} cursos aprobados de {estadisticas.cursos_aprobados + estadisticas.cursos_actuales} totales
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={descargarEstadoCuenta}
                disabled={descargando}
              >
                {descargando ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <DownloadIcon className="h-4 w-4" />
                    Descargar Estado de Cuenta
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="w-full md:w-2/3">
          <Tabs defaultValue="estado-cuenta" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="estado-cuenta">
                <span className="flex items-center gap-2">
                  <CreditCardIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Estado de Cuenta</span>
                  <span className="sm:hidden">Cuenta</span>
                </span>
              </TabsTrigger>
              <TabsTrigger value="historial-academico">
                <span className="flex items-center gap-2">
                  <GraduationCapIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Historial Académico</span>
                  <span className="sm:hidden">Historial</span>
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="estado-cuenta">
              <Card>
                <CardContent className="p-6">
                  <EstadoCuenta estudianteId={estudianteId} nombreEstudiante={nombreCompleto} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historial-academico">
              <HistorialAcademicoTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

