"use client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Database, Download, HardDrive, RefreshCw, Save, Settings, Upload } from "lucide-react"

export default function RespaldosSeguridad() {
  // Datos de ejemplo
  const respaldos = [
    {
      id: 1,
      nombre: "Respaldo_Completo_20230515",
      tipo: "Completo",
      fecha: "2023-05-15",
      hora: "01:30:45",
      tamaño: "4.2 GB",
      estado: "Completado",
      ubicacion: "Servidor Principal",
    },
    {
      id: 2,
      nombre: "Respaldo_Incremental_20230514",
      tipo: "Incremental",
      fecha: "2023-05-14",
      hora: "01:30:45",
      tamaño: "1.1 GB",
      estado: "Completado",
      ubicacion: "Servidor Principal",
    },
    {
      id: 3,
      nombre: "Respaldo_Incremental_20230513",
      tipo: "Incremental",
      fecha: "2023-05-13",
      hora: "01:30:45",
      tamaño: "0.9 GB",
      estado: "Completado",
      ubicacion: "Servidor Principal",
    },
    {
      id: 4,
      nombre: "Respaldo_Incremental_20230512",
      tipo: "Incremental",
      fecha: "2023-05-12",
      hora: "01:30:45",
      tamaño: "1.3 GB",
      estado: "Completado",
      ubicacion: "Servidor Principal",
    },
    {
      id: 5,
      nombre: "Respaldo_Completo_20230508",
      tipo: "Completo",
      fecha: "2023-05-08",
      hora: "01:30:45",
      tamaño: "4.1 GB",
      estado: "Completado",
      ubicacion: "Servidor Principal",
    },
    {
      id: 6,
      nombre: "Respaldo_Incremental_20230507",
      tipo: "Incremental",
      fecha: "2023-05-07",
      hora: "01:30:45",
      tamaño: "0.8 GB",
      estado: "Completado",
      ubicacion: "Servidor Principal",
    },
    {
      id: 7,
      nombre: "Respaldo_Incremental_20230506",
      tipo: "Incremental",
      fecha: "2023-05-06",
      hora: "01:30:45",
      tamaño: "1.0 GB",
      estado: "Completado",
      ubicacion: "Servidor Principal",
    },
    {
      id: 8,
      nombre: "Respaldo_Incremental_20230505",
      tipo: "Incremental",
      fecha: "2023-05-05",
      hora: "01:30:45",
      tamaño: "1.2 GB",
      estado: "Completado",
      ubicacion: "Servidor Principal",
    },
  ]

  // Datos de programación
  const programacion = [
    {
      id: 1,
      tipo: "Completo",
      frecuencia: "Semanal",
      dia: "Lunes",
      hora: "01:30",
      ultimaEjecucion: "2023-05-15 01:30:45",
      proximaEjecucion: "2023-05-22 01:30:00",
      estado: "Activo",
    },
    {
      id: 2,
      tipo: "Incremental",
      frecuencia: "Diario",
      dia: "Todos",
      hora: "01:30",
      ultimaEjecucion: "2023-05-15 01:30:45",
      proximaEjecucion: "2023-05-16 01:30:00",
      estado: "Activo",
    },
    {
      id: 3,
      tipo: "Diferencial",
      frecuencia: "Semanal",
      dia: "Viernes",
      hora: "02:00",
      ultimaEjecucion: "2023-05-12 02:00:12",
      proximaEjecucion: "2023-05-19 02:00:00",
      estado: "Activo",
    },
    {
      id: 4,
      tipo: "Log",
      frecuencia: "Cada 6 horas",
      dia: "Todos",
      hora: "00:00, 06:00, 12:00, 18:00",
      ultimaEjecucion: "2023-05-15 18:00:03",
      proximaEjecucion: "2023-05-16 00:00:00",
      estado: "Activo",
    },
  ]

  // Estado de almacenamiento
  const almacenamiento = {
    total: 1000, // GB
    usado: 423, // GB
    disponible: 577, // GB
    porcentaje: 42.3,
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Respaldos de Seguridad</h1>
        <div>
          <Button variant="outline" className="mr-2">
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Save className="mr-2 h-4 w-4" />
            Crear Respaldo Manual
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Estado de Respaldos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="h-5 w-5 text-blue-600 mr-2" />
                  <span>Último respaldo completo</span>
                </div>
                <Badge variant="outline">2023-05-15</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="h-5 w-5 text-blue-600 mr-2" />
                  <span>Último respaldo incremental</span>
                </div>
                <Badge variant="outline">2023-05-15</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <span>Próximo respaldo programado</span>
                </div>
                <Badge variant="outline">2023-05-16 01:30</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <RefreshCw className="h-5 w-5 text-blue-600 mr-2" />
                  <span>Estado del sistema</span>
                </div>
                <Badge variant="success">Operativo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Almacenamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <HardDrive className="h-5 w-5 text-blue-600 mr-2" />
                  <span>Espacio total</span>
                </div>
                <span className="font-medium">{almacenamiento.total} GB</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <HardDrive className="h-5 w-5 text-green-600 mr-2" />
                  <span>Espacio disponible</span>
                </div>
                <span className="font-medium">{almacenamiento.disponible} GB</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <HardDrive className="h-5 w-5 text-red-600 mr-2" />
                  <span>Espacio usado</span>
                </div>
                <span className="font-medium">{almacenamiento.usado} GB</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uso de almacenamiento</span>
                  <span>{almacenamiento.porcentaje}%</span>
                </div>
                <Progress value={almacenamiento.porcentaje} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                Respaldo Completo
              </Button>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Save className="mr-2 h-4 w-4" />
                Respaldo Incremental
              </Button>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Upload className="mr-2 h-4 w-4" />
                Restaurar Respaldo
              </Button>
              <Button className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Descargar Respaldo
              </Button>
              <Button className="w-full" variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Verificar Integridad
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="historial" className="mb-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="historial">Historial de Respaldos</TabsTrigger>
          <TabsTrigger value="programacion">Programación</TabsTrigger>
        </TabsList>

        <TabsContent value="historial" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Respaldos</CardTitle>
              <CardDescription>Registro de respaldos realizados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Tamaño</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {respaldos.map((respaldo) => (
                    <TableRow key={respaldo.id}>
                      <TableCell className="font-medium">{respaldo.nombre}</TableCell>
                      <TableCell>
                        <Badge variant={respaldo.tipo === "Completo" ? "default" : "secondary"}>{respaldo.tipo}</Badge>
                      </TableCell>
                      <TableCell>{respaldo.fecha}</TableCell>
                      <TableCell>{respaldo.hora}</TableCell>
                      <TableCell>{respaldo.tamaño}</TableCell>
                      <TableCell>
                        <Badge variant="success">{respaldo.estado}</Badge>
                      </TableCell>
                      <TableCell>{respaldo.ubicacion}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="mr-1">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programacion" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Programación de Respaldos</CardTitle>
              <CardDescription>Configuración de respaldos automáticos</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Día</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Última Ejecución</TableHead>
                    <TableHead>Próxima Ejecución</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programacion.map((tarea) => (
                    <TableRow key={tarea.id}>
                      <TableCell>
                        <Badge
                          variant={
                            tarea.tipo === "Completo"
                              ? "default"
                              : tarea.tipo === "Incremental"
                                ? "secondary"
                                : tarea.tipo === "Diferencial"
                                  ? "outline"
                                  : "destructive"
                          }
                        >
                          {tarea.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{tarea.frecuencia}</TableCell>
                      <TableCell>{tarea.dia}</TableCell>
                      <TableCell>{tarea.hora}</TableCell>
                      <TableCell>{tarea.ultimaEjecucion}</TableCell>
                      <TableCell>{tarea.proximaEjecucion}</TableCell>
                      <TableCell>
                        <Badge variant="success">{tarea.estado}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-1">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
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
  )
}

