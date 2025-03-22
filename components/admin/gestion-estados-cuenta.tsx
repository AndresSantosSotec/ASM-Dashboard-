"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Search, Filter, Mail } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Estudiante {
  id: string
  nombre: string
  carrera: string
  saldoPendiente: number
  ultimoPago: string
  estado: "al_dia" | "mora_leve" | "mora_media" | "mora_grave"
}

export function GestionEstadosCuenta() {
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null)

  // Datos de ejemplo - en producción vendrían de una API
  const estudiantes: Estudiante[] = [
    {
      id: "est-001",
      nombre: "Juan Pérez",
      carrera: "Ingeniería",
      saldoPendiente: 1500,
      ultimoPago: "15/01/2025",
      estado: "al_dia",
    },
    {
      id: "est-002",
      nombre: "María López",
      carrera: "Medicina",
      saldoPendiente: 2500,
      ultimoPago: "10/12/2024",
      estado: "mora_leve",
    },
    {
      id: "est-003",
      nombre: "Carlos Rodríguez",
      carrera: "Derecho",
      saldoPendiente: 3500,
      ultimoPago: "05/11/2024",
      estado: "mora_media",
    },
    {
      id: "est-004",
      nombre: "Ana Martínez",
      carrera: "Psicología",
      saldoPendiente: 5000,
      ultimoPago: "20/09/2024",
      estado: "mora_grave",
    },
    {
      id: "est-005",
      nombre: "Roberto Sánchez",
      carrera: "Administración",
      saldoPendiente: 1000,
      ultimoPago: "25/01/2025",
      estado: "al_dia",
    },
    {
      id: "est-006",
      nombre: "Laura Gómez",
      carrera: "Arquitectura",
      saldoPendiente: 2000,
      ultimoPago: "12/12/2024",
      estado: "mora_leve",
    },
    {
      id: "est-007",
      nombre: "Pedro Díaz",
      carrera: "Contabilidad",
      saldoPendiente: 4000,
      ultimoPago: "08/10/2024",
      estado: "mora_media",
    },
    {
      id: "est-008",
      nombre: "Sofía Hernández",
      carrera: "Educación",
      saldoPendiente: 6000,
      ultimoPago: "15/08/2024",
      estado: "mora_grave",
    },
  ]

  const filtrarEstudiantes = () => {
    return estudiantes.filter((est) => {
      const coincideBusqueda =
        est.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        est.carrera.toLowerCase().includes(busqueda.toLowerCase())

      const coincideFiltro = filtroEstado === "todos" || est.estado === filtroEstado

      return coincideBusqueda && coincideFiltro
    })
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "al_dia":
        return <Badge className="bg-green-500">Al día</Badge>
      case "mora_leve":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            Mora 1 mes
          </Badge>
        )
      case "mora_media":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-500">
            Mora 2-3 meses
          </Badge>
        )
      case "mora_grave":
        return <Badge variant="destructive">Mora +3 meses</Badge>
      default:
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  const descargarEstadoCuenta = (estudianteId: string) => {
    // En una implementación real, esto generaría y descargaría un PDF
    alert(`Descargando estado de cuenta del estudiante ${estudianteId}...`)
  }

  const enviarEstadoCuenta = (estudianteId: string) => {
    // En una implementación real, esto enviaría el estado de cuenta por correo
    alert(`Enviando estado de cuenta por correo al estudiante ${estudianteId}...`)
  }

  const verDetalles = (estudiante: Estudiante) => {
    setEstudianteSeleccionado(estudiante)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Gestión de Estados de Cuenta
        </CardTitle>
        <CardDescription>Administra y genera estados de cuenta para los estudiantes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o carrera..."
                className="pl-8"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="al_dia">Al día</SelectItem>
                  <SelectItem value="mora_leve">Mora 1 mes</SelectItem>
                  <SelectItem value="mora_media">Mora 2-3 meses</SelectItem>
                  <SelectItem value="mora_grave">Mora +3 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="todos">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="al_dia">Al día</TabsTrigger>
              <TabsTrigger value="mora_leve">Mora 1 mes</TabsTrigger>
              <TabsTrigger value="mora_grave">Mora crítica</TabsTrigger>
            </TabsList>
            <TabsContent value="todos">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Carrera</TableHead>
                    <TableHead>Saldo Pendiente</TableHead>
                    <TableHead>Último Pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrarEstudiantes().map((estudiante) => (
                    <TableRow key={estudiante.id}>
                      <TableCell className="font-medium">{estudiante.nombre}</TableCell>
                      <TableCell>{estudiante.carrera}</TableCell>
                      <TableCell>Q {estudiante.saldoPendiente.toFixed(2)}</TableCell>
                      <TableCell>{estudiante.ultimoPago}</TableCell>
                      <TableCell>{getEstadoBadge(estudiante.estado)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => verDetalles(estudiante)}>
                                Ver
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Estado de Cuenta - {estudiante.nombre}</DialogTitle>
                                <DialogDescription>Información detallada del estado de cuenta</DialogDescription>
                              </DialogHeader>
                              <div className="mt-4">
                                {/* Aquí iría un componente detallado del estado de cuenta */}
                                <div className="grid gap-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold">Información del Estudiante</h4>
                                      <p>ID: {estudiante.id}</p>
                                      <p>Nombre: {estudiante.nombre}</p>
                                      <p>Carrera: {estudiante.carrera}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">Información Financiera</h4>
                                      <p>Saldo Pendiente: Q {estudiante.saldoPendiente.toFixed(2)}</p>
                                      <p>Último Pago: {estudiante.ultimoPago}</p>
                                      <p>Estado: {estudiante.estado.replace("_", " ")}</p>
                                    </div>
                                  </div>

                                  <div className="mt-4">
                                    <h4 className="font-semibold mb-2">Pagos Pendientes</h4>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Concepto</TableHead>
                                          <TableHead>Fecha Vencimiento</TableHead>
                                          <TableHead>Monto</TableHead>
                                          <TableHead>Estado</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        <TableRow>
                                          <TableCell>Mensualidad Marzo</TableCell>
                                          <TableCell>05/03/2025</TableCell>
                                          <TableCell>Q 500.00</TableCell>
                                          <TableCell>
                                            <Badge variant="outline">Pendiente</Badge>
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>Mensualidad Abril</TableCell>
                                          <TableCell>05/04/2025</TableCell>
                                          <TableCell>Q 500.00</TableCell>
                                          <TableCell>
                                            <Badge variant="outline">Pendiente</Badge>
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>Mensualidad Mayo</TableCell>
                                          <TableCell>05/05/2025</TableCell>
                                          <TableCell>Q 500.00</TableCell>
                                          <TableCell>
                                            <Badge variant="outline">Pendiente</Badge>
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>

                                  <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => enviarEstadoCuenta(estudiante.id)}>
                                      <Mail className="mr-2 h-4 w-4" />
                                      Enviar por Correo
                                    </Button>
                                    <Button onClick={() => descargarEstadoCuenta(estudiante.id)}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Descargar PDF
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="outline" size="sm" onClick={() => descargarEstadoCuenta(estudiante.id)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => enviarEstadoCuenta(estudiante.id)}>
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="al_dia">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Carrera</TableHead>
                    <TableHead>Saldo Pendiente</TableHead>
                    <TableHead>Último Pago</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantes
                    .filter((est) => est.estado === "al_dia")
                    .map((estudiante) => (
                      <TableRow key={estudiante.id}>
                        <TableCell className="font-medium">{estudiante.nombre}</TableCell>
                        <TableCell>{estudiante.carrera}</TableCell>
                        <TableCell>Q {estudiante.saldoPendiente.toFixed(2)}</TableCell>
                        <TableCell>{estudiante.ultimoPago}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => verDetalles(estudiante)}>
                              Ver
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => descargarEstadoCuenta(estudiante.id)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="mora_leve">
              {/* Contenido similar para estudiantes con mora leve */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Carrera</TableHead>
                    <TableHead>Saldo Pendiente</TableHead>
                    <TableHead>Último Pago</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantes
                    .filter((est) => est.estado === "mora_leve")
                    .map((estudiante) => (
                      <TableRow key={estudiante.id}>
                        <TableCell className="font-medium">{estudiante.nombre}</TableCell>
                        <TableCell>{estudiante.carrera}</TableCell>
                        <TableCell>Q {estudiante.saldoPendiente.toFixed(2)}</TableCell>
                        <TableCell>{estudiante.ultimoPago}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => verDetalles(estudiante)}>
                              Ver
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => descargarEstadoCuenta(estudiante.id)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="mora_grave">
              {/* Contenido similar para estudiantes con mora grave */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Carrera</TableHead>
                    <TableHead>Saldo Pendiente</TableHead>
                    <TableHead>Último Pago</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantes
                    .filter((est) => est.estado === "mora_grave" || est.estado === "mora_media")
                    .map((estudiante) => (
                      <TableRow key={estudiante.id}>
                        <TableCell className="font-medium">{estudiante.nombre}</TableCell>
                        <TableCell>{estudiante.carrera}</TableCell>
                        <TableCell>Q {estudiante.saldoPendiente.toFixed(2)}</TableCell>
                        <TableCell>{estudiante.ultimoPago}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => verDetalles(estudiante)}>
                              Ver
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => descargarEstadoCuenta(estudiante.id)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}

