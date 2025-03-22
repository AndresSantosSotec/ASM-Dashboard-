"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Filter, UserPlus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Datos de ejemplo
const estudiantes = [
  {
    id: "EST001",
    nombre: "Ana María Rodríguez",
    email: "ana.rodriguez@ejemplo.com",
    curso: "Matemáticas Avanzadas",
    asistencia: "85%",
    promedio: "8.7",
    estado: "Activo",
    ultimaActividad: "Hace 2 días",
  },
  {
    id: "EST002",
    nombre: "Carlos Mendoza",
    email: "carlos.mendoza@ejemplo.com",
    curso: "Matemáticas Avanzadas",
    asistencia: "92%",
    promedio: "9.3",
    estado: "Activo",
    ultimaActividad: "Hoy",
  },
  {
    id: "EST003",
    nombre: "Sofía Gutiérrez",
    email: "sofia.gutierrez@ejemplo.com",
    curso: "Matemáticas Avanzadas",
    asistencia: "78%",
    promedio: "7.5",
    estado: "En riesgo",
    ultimaActividad: "Hace 5 días",
  },
  {
    id: "EST004",
    nombre: "Miguel Ángel Torres",
    email: "miguel.torres@ejemplo.com",
    curso: "Matemáticas Avanzadas",
    asistencia: "65%",
    promedio: "6.8",
    estado: "En riesgo",
    ultimaActividad: "Hace 1 semana",
  },
  {
    id: "EST005",
    nombre: "Laura Sánchez",
    email: "laura.sanchez@ejemplo.com",
    curso: "Matemáticas Avanzadas",
    asistencia: "95%",
    promedio: "9.5",
    estado: "Activo",
    ultimaActividad: "Ayer",
  },
]

export default function AlumnosPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredEstudiantes = estudiantes.filter(
    (estudiante) =>
      estudiante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Alumnos</h1>
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Agregar Alumno
          </Button>
        </div>

        <Tabs defaultValue="todos" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="todos">Todos los Alumnos</TabsTrigger>
              <TabsTrigger value="activos">Activos</TabsTrigger>
              <TabsTrigger value="riesgo">En Riesgo</TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar alumno..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
              <Select defaultValue="matematicas">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matematicas">Matemáticas Avanzadas</SelectItem>
                  <SelectItem value="fisica">Física Aplicada</SelectItem>
                  <SelectItem value="quimica">Química Orgánica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="todos" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Listado de Alumnos</CardTitle>
                <CardDescription>Gestione la información de sus alumnos y su desempeño académico.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Asistencia</TableHead>
                      <TableHead>Promedio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Última Actividad</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEstudiantes.map((estudiante) => (
                      <TableRow key={estudiante.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                              <AvatarFallback>
                                {estudiante.nombre
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold">{estudiante.nombre}</div>
                              <div className="text-sm text-muted-foreground">{estudiante.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{estudiante.curso}</TableCell>
                        <TableCell>{estudiante.asistencia}</TableCell>
                        <TableCell>{estudiante.promedio}</TableCell>
                        <TableCell>
                          <Badge variant={estudiante.estado === "Activo" ? "default" : "destructive"}>
                            {estudiante.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>{estudiante.ultimaActividad}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Ver detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activos" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Alumnos Activos</CardTitle>
                <CardDescription>Alumnos con participación regular y buen desempeño.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  {/* Contenido similar filtrado para alumnos activos */}
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Asistencia</TableHead>
                      <TableHead>Promedio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Última Actividad</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEstudiantes
                      .filter((e) => e.estado === "Activo")
                      .map((estudiante) => (
                        <TableRow key={estudiante.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                                <AvatarFallback>
                                  {estudiante.nombre
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{estudiante.nombre}</div>
                                <div className="text-sm text-muted-foreground">{estudiante.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{estudiante.curso}</TableCell>
                          <TableCell>{estudiante.asistencia}</TableCell>
                          <TableCell>{estudiante.promedio}</TableCell>
                          <TableCell>
                            <Badge variant="default">{estudiante.estado}</Badge>
                          </TableCell>
                          <TableCell>{estudiante.ultimaActividad}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Ver detalles
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="riesgo" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Alumnos en Riesgo</CardTitle>
                <CardDescription>
                  Alumnos que requieren atención especial debido a su bajo rendimiento o asistencia.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  {/* Contenido similar filtrado para alumnos en riesgo */}
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Asistencia</TableHead>
                      <TableHead>Promedio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Última Actividad</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEstudiantes
                      .filter((e) => e.estado === "En riesgo")
                      .map((estudiante) => (
                        <TableRow key={estudiante.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                                <AvatarFallback>
                                  {estudiante.nombre
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{estudiante.nombre}</div>
                                <div className="text-sm text-muted-foreground">{estudiante.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{estudiante.curso}</TableCell>
                          <TableCell>{estudiante.asistencia}</TableCell>
                          <TableCell>{estudiante.promedio}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{estudiante.estado}</Badge>
                          </TableCell>
                          <TableCell>{estudiante.ultimaActividad}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Ver detalles
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

