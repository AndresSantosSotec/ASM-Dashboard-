"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Calendar, FileText, User } from "lucide-react"

export default function EstudianteDashboard() {
  const [activeTab, setActiveTab] = useState("cursos")

  // Datos de ejemplo
  const estudiante = {
    nombre: "Juan Pérez",
    matricula: "EST-2023-001",
    promedio: 8.7,
    cursos: 4,
    tareasPendientes: 3,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Estudiantil</h1>
        <p className="text-muted-foreground">
          Bienvenido, {estudiante.nombre}. Aquí puedes ver tu información académica.
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
            <div className="h-4 w-4 rounded-full bg-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estudiante.promedio}</div>
            <p className="text-xs text-muted-foreground">Calificación promedio de todos tus cursos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estudiante.cursos}</div>
            <p className="text-xs text-muted-foreground">Cursos en los que estás inscrito actualmente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estudiante.tareasPendientes}</div>
            <p className="text-xs text-muted-foreground">Tareas que necesitan ser completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Entrega</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 días</div>
            <p className="text-xs text-muted-foreground">Tiempo restante para tu próxima entrega</p>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas de contenido */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="cursos">Mis Cursos</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
          <TabsTrigger value="calificaciones">Calificaciones</TabsTrigger>
          <TabsTrigger value="perfil">Mi Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="cursos" className="space-y-4">
          <h2 className="text-xl font-semibold">Mis Cursos</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((curso) => (
              <Card key={curso}>
                <CardHeader>
                  <CardTitle>Curso {curso}</CardTitle>
                  <CardDescription>Profesor: Nombre del Profesor</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Progreso del curso: 65%</p>
                  <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                    <div className="h-2 w-2/3 rounded-full bg-primary"></div>
                  </div>
                  <p className="mt-4 text-sm">Próxima clase: Lunes 10:00 AM</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tareas" className="space-y-4">
          <h2 className="text-xl font-semibold">Tareas Pendientes</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((tarea) => (
                  <div key={tarea} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-medium">Tarea {tarea}</h3>
                      <p className="text-sm text-muted-foreground">Curso {tarea}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Fecha límite: 15/Mar/2025</p>
                      <p className="text-xs text-muted-foreground">Prioridad: Alta</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calificaciones" className="space-y-4">
          <h2 className="text-xl font-semibold">Mis Calificaciones</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-4 text-left">Curso</th>
                      <th className="p-4 text-center">Parcial 1</th>
                      <th className="p-4 text-center">Parcial 2</th>
                      <th className="p-4 text-center">Parcial 3</th>
                      <th className="p-4 text-center">Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((curso) => (
                      <tr key={curso} className="border-b">
                        <td className="p-4">Curso {curso}</td>
                        <td className="p-4 text-center">8.5</td>
                        <td className="p-4 text-center">9.0</td>
                        <td className="p-4 text-center">8.7</td>
                        <td className="p-4 text-center font-medium">8.7</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perfil" className="space-y-4">
          <h2 className="text-xl font-semibold">Mi Perfil</h2>
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">{estudiante.nombre}</h3>
                  <p className="text-muted-foreground">Matrícula: {estudiante.matricula}</p>
                </div>
              </div>
              <div className="grid gap-4 pt-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-medium">Información Académica</h4>
                  <p className="text-sm">Carrera: Ingeniería en Sistemas</p>
                  <p className="text-sm">Semestre: 4to</p>
                  <p className="text-sm">Promedio General: {estudiante.promedio}</p>
                </div>
                <div>
                  <h4 className="mb-2 font-medium">Información de Contacto</h4>
                  <p className="text-sm">Email: juan.perez@ejemplo.com</p>
                  <p className="text-sm">Teléfono: (123) 456-7890</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

