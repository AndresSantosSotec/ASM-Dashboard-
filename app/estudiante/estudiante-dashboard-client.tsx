"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Bell,
  BookOpen,
  CalendarIcon,
  Clock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  PieChart,
  User,
} from "lucide-react"

// Datos de ejemplo - En producción, estos vendrían de una API
const mockCursos = [
  {
    id: 1,
    nombre: "Matemáticas Avanzadas",
    profesor: "Dr. Juan Pérez",
    progreso: 65,
    proximaClase: "Lunes, 10:00 AM",
    tareasPendientes: 2,
  },
  {
    id: 2,
    nombre: "Programación Web",
    profesor: "Ing. María Rodríguez",
    progreso: 78,
    proximaClase: "Martes, 2:00 PM",
    tareasPendientes: 1,
  },
  {
    id: 3,
    nombre: "Estadística Aplicada",
    profesor: "Dr. Carlos Sánchez",
    progreso: 42,
    proximaClase: "Miércoles, 11:30 AM",
    tareasPendientes: 3,
  },
  {
    id: 4,
    nombre: "Inglés Técnico",
    profesor: "Lic. Ana González",
    progreso: 90,
    proximaClase: "Jueves, 9:00 AM",
    tareasPendientes: 0,
  },
]

const mockTareas = [
  {
    id: 1,
    titulo: "Proyecto Final",
    curso: "Programación Web",
    fechaEntrega: "2025-03-25",
    estado: "pendiente",
    prioridad: "alta",
  },
  {
    id: 2,
    titulo: "Ejercicios Cap. 5",
    curso: "Matemáticas Avanzadas",
    fechaEntrega: "2025-03-20",
    estado: "pendiente",
    prioridad: "media",
  },
  {
    id: 3,
    titulo: "Análisis de Datos",
    curso: "Estadística Aplicada",
    fechaEntrega: "2025-03-22",
    estado: "pendiente",
    prioridad: "alta",
  },
  {
    id: 4,
    titulo: "Ensayo",
    curso: "Inglés Técnico",
    fechaEntrega: "2025-03-30",
    estado: "pendiente",
    prioridad: "baja",
  },
  {
    id: 5,
    titulo: "Cuestionario",
    curso: "Estadística Aplicada",
    fechaEntrega: "2025-03-19",
    estado: "pendiente",
    prioridad: "alta",
  },
]

const mockAnuncios = [
  {
    id: 1,
    titulo: "Suspensión de clases",
    mensaje: "Se suspenden las clases del día 20 de marzo por junta académica.",
    fecha: "2025-03-18",
    leido: false,
  },
  {
    id: 2,
    titulo: "Conferencia especial",
    mensaje: "No te pierdas la conferencia sobre IA el próximo viernes.",
    fecha: "2025-03-17",
    leido: true,
  },
  {
    id: 3,
    titulo: "Actualización de plataforma",
    mensaje: "Se han agregado nuevas funcionalidades al sistema.",
    fecha: "2025-03-15",
    leido: true,
  },
]

const mockCalificaciones = [
  { id: 1, curso: "Matemáticas Avanzadas", parcial1: 85, parcial2: 78, tareas: 90, promedio: 84 },
  { id: 2, curso: "Programación Web", parcial1: 92, parcial2: 88, tareas: 95, promedio: 92 },
  { id: 3, curso: "Estadística Aplicada", parcial1: 75, parcial2: 80, tareas: 82, promedio: 79 },
  { id: 4, curso: "Inglés Técnico", parcial1: 88, parcial2: 90, tareas: 85, promedio: 88 },
]

export default function EstudianteDashboardClient() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState({
    nombre: "Carlos Mendoza",
    matricula: "EST-2023-0042",
    carrera: "Ingeniería en Sistemas Computacionales",
    semestre: "4to Semestre",
    email: "carlos.mendoza@estudiante.blueatlas.edu",
    foto: "/placeholder.svg?height=100&width=100",
  })

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Estudiantil</h1>
          <p className="text-muted-foreground">
            Bienvenido de nuevo, {userData.nombre}. Aquí tienes un resumen de tu actividad académica.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon">
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarImage src={userData.foto} alt={userData.nombre} />
            <AvatarFallback>
              {userData.nombre
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85.75</div>
            <p className="text-xs text-muted-foreground">+2.5% respecto al semestre anterior</p>
            <Progress value={85.75} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCursos.length}</div>
            <p className="text-xs text-muted-foreground">Semestre en curso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTareas.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockTareas.filter((t) => t.prioridad === "alta").length} de alta prioridad
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Entrega</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(
                mockTareas.sort((a, b) => new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime())[0]
                  .fechaEntrega,
              ).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                mockTareas.sort((a, b) => new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime())[0]
                  .titulo
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cursos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cursos">Mis Cursos</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
          <TabsTrigger value="calificaciones">Calificaciones</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="perfil">Mi Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="cursos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {mockCursos.map((curso) => (
              <Card key={curso.id}>
                <CardHeader>
                  <CardTitle>{curso.nombre}</CardTitle>
                  <CardDescription>{curso.profesor}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progreso del curso</span>
                      <span className="font-medium">{curso.progreso}%</span>
                    </div>
                    <Progress value={curso.progreso} />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="font-medium">Próxima clase:</span> {curso.proximaClase}
                    </div>
                    <Badge variant={curso.tareasPendientes > 0 ? "destructive" : "outline"}>
                      {curso.tareasPendientes} {curso.tareasPendientes === 1 ? "tarea" : "tareas"}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Ver detalles
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tareas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tareas Pendientes</CardTitle>
              <CardDescription>Tienes {mockTareas.length} tareas pendientes de entrega</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {mockTareas.map((tarea) => (
                    <div key={tarea.id} className="flex items-start gap-4 rounded-lg border p-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{tarea.titulo}</h4>
                          <Badge
                            variant={
                              tarea.prioridad === "alta"
                                ? "destructive"
                                : tarea.prioridad === "media"
                                  ? "default"
                                  : "outline"
                            }
                          >
                            {tarea.prioridad}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{tarea.curso}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>Entrega: {new Date(tarea.fechaEntrega).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button size="sm">Ver detalles</Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Ver todas las tareas
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="calificaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mis Calificaciones</CardTitle>
              <CardDescription>Resumen de calificaciones del semestre actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium">Curso</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Parcial 1</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Parcial 2</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Tareas</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCalificaciones.map((cal) => (
                      <tr
                        key={cal.id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle">{cal.curso}</td>
                        <td className="p-4 align-middle">{cal.parcial1}</td>
                        <td className="p-4 align-middle">{cal.parcial2}</td>
                        <td className="p-4 align-middle">{cal.tareas}</td>
                        <td className="p-4 align-middle font-medium">
                          <Badge
                            variant={cal.promedio >= 80 ? "default" : cal.promedio >= 70 ? "outline" : "destructive"}
                          >
                            {cal.promedio}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="p-4 align-middle font-medium text-right">
                        Promedio General:
                      </td>
                      <td className="p-4 align-middle font-bold">85.75</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Ver historial completo
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="calendario" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Calendario Académico</CardTitle>
                <CardDescription>Eventos y fechas importantes</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Anuncios</CardTitle>
                <CardDescription>Últimas notificaciones y anuncios</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-4">
                    {mockAnuncios.map((anuncio) => (
                      <div key={anuncio.id} className="flex flex-col gap-2 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{anuncio.titulo}</h4>
                          {!anuncio.leido && (
                            <Badge variant="default" className="text-xs">
                              Nuevo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{anuncio.mensaje}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{new Date(anuncio.fecha).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="perfil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mi Perfil Académico</CardTitle>
              <CardDescription>Información personal y académica</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={userData.foto} alt={userData.nombre} />
                    <AvatarFallback className="text-2xl">
                      {userData.nombre
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Cambiar foto
                  </Button>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Nombre completo</h4>
                      <p className="font-medium">{userData.nombre}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Matrícula</h4>
                      <p className="font-medium">{userData.matricula}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Carrera</h4>
                      <p className="font-medium">{userData.carrera}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Semestre actual</h4>
                      <p className="font-medium">{userData.semestre}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Correo electrónico</h4>
                      <p className="font-medium">{userData.email}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-medium">Accesos rápidos</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Horario</span>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Historial académico</span>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>Plan de estudios</span>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <User className="h-4 w-4" />
                        <span>Editar perfil</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cambiar contraseña</Button>
              <Button>Actualizar información</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

