"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EstadoCuenta } from "@/components/estudiantes/estado-cuenta"
import { UserIcon, BookOpenIcon, CalendarIcon, GraduationCapIcon, DownloadIcon, CreditCardIcon } from "lucide-react"

interface PerfilEstudianteProps {
  estudianteId: string
}

export function PerfilEstudiante({ estudianteId }: PerfilEstudianteProps) {
  const [cargando, setCargando] = useState(false)

  // Datos de ejemplo - En producción estos vendrían de una API
  const estudiante = {
    id: estudianteId,
    nombre: "Juan Pérez",
    email: "juan.perez@ejemplo.com",
    telefono: "+502 5555-1234",
    carnet: "2025-0123",
    programa: "Desarrollo Web Full Stack",
    fechaInicio: "15 de enero, 2025",
    estado: "Activo",
    fotoPerfil: "/placeholder.svg?height=100&width=100",
    progreso: 65,
  }

  // Función para descargar estado de cuenta
  const descargarEstadoCuenta = () => {
    setCargando(true)

    // Simulación de descarga - En producción, esto generaría un PDF
    setTimeout(() => {
      setCargando(false)
      // Aquí iría la lógica real de descarga
      alert("Estado de cuenta descargado correctamente")
    }, 1500)
  }

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
                <AvatarImage src={estudiante.fotoPerfil} alt={estudiante.nombre} />
                <AvatarFallback>
                  <UserIcon className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-bold">{estudiante.nombre}</h3>
                <p className="text-sm text-muted-foreground">{estudiante.carnet}</p>
                <Badge className="mt-2">{estudiante.estado}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Contacto</p>
                  <p className="text-sm text-muted-foreground">{estudiante.email}</p>
                  <p className="text-sm text-muted-foreground">{estudiante.telefono}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <GraduationCapIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Programa</p>
                  <p className="text-sm text-muted-foreground">{estudiante.programa}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Fecha de Inicio</p>
                  <p className="text-sm text-muted-foreground">{estudiante.fechaInicio}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <BookOpenIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Progreso Académico</p>
                  <div className="w-full bg-secondary h-2 rounded-full mt-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${estudiante.progreso}%` }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{estudiante.progreso}% completado</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={descargarEstadoCuenta}
                disabled={cargando}
              >
                <DownloadIcon className="h-4 w-4" />
                {cargando ? "Generando..." : "Descargar Estado de Cuenta"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="w-full md:w-2/3">
          <Tabs defaultValue="estado-cuenta" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="estado-cuenta">
                <span className="flex items-center gap-2">
                  <CreditCardIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Estado de Cuenta</span>
                  <span className="sm:hidden">Cuenta</span>
                </span>
              </TabsTrigger>
              <TabsTrigger value="cursos">
                <span className="flex items-center gap-2">
                  <BookOpenIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Cursos</span>
                  <span className="sm:hidden">Cursos</span>
                </span>
              </TabsTrigger>
              <TabsTrigger value="calificaciones">
                <span className="flex items-center gap-2">
                  <GraduationCapIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Calificaciones</span>
                  <span className="sm:hidden">Notas</span>
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="estado-cuenta">
              <Card>
                <CardContent className="p-6">
                  <EstadoCuenta estudianteId={estudianteId} nombreEstudiante={estudiante.nombre} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cursos">
              <Card>
                <CardHeader>
                  <CardTitle>Cursos Inscritos</CardTitle>
                  <CardDescription>Listado de cursos actuales y completados</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Contenido de cursos inscritos (esta sección se implementará en otro momento)
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calificaciones">
              <Card>
                <CardHeader>
                  <CardTitle>Calificaciones</CardTitle>
                  <CardDescription>Historial académico y calificaciones</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Contenido de calificaciones (esta sección se implementará en otro momento)
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

