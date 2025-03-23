"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Download, FileText, Filter, Search } from "lucide-react"

export default function LogsAuditoria() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("todos")

  // Datos de ejemplo
  const logs = [
    {
      id: 1,
      usuario: "Juan Pérez",
      accion: "Inicio de sesión",
      modulo: "Seguridad",
      detalles: "Inicio de sesión exitoso",
      fecha: "2023-05-15",
      hora: "10:30:45",
      nivel: "Info",
      ip: "192.168.1.100",
    },
    {
      id: 2,
      usuario: "María López",
      accion: "Creación de registro",
      modulo: "Académico",
      detalles: "Creación de nuevo curso",
      fecha: "2023-05-15",
      hora: "09:15:22",
      nivel: "Info",
      ip: "192.168.1.101",
    },
    {
      id: 3,
      usuario: "Carlos Rodríguez",
      accion: "Eliminación de registro",
      modulo: "Estudiantes",
      detalles: "Eliminación de estudiante #1234",
      fecha: "2023-05-15",
      hora: "08:45:10",
      nivel: "Alerta",
      ip: "192.168.1.102",
    },
    {
      id: 4,
      usuario: "Ana Martínez",
      accion: "Modificación de registro",
      modulo: "Finanzas",
      detalles: "Actualización de estado de pago",
      fecha: "2023-05-14",
      hora: "16:20:33",
      nivel: "Info",
      ip: "192.168.1.103",
    },
    {
      id: 5,
      usuario: "Roberto Sánchez",
      accion: "Acceso denegado",
      modulo: "Seguridad",
      detalles: "Intento de acceso a módulo restringido",
      fecha: "2023-05-14",
      hora: "14:10:05",
      nivel: "Error",
      ip: "192.168.1.104",
    },
    {
      id: 6,
      usuario: "Laura Gómez",
      accion: "Descarga de reporte",
      modulo: "Reportes",
      detalles: "Descarga de reporte financiero",
      fecha: "2023-05-14",
      hora: "12:05:18",
      nivel: "Info",
      ip: "192.168.1.105",
    },
    {
      id: 7,
      usuario: "Pedro Díaz",
      accion: "Cambio de configuración",
      modulo: "Administración",
      detalles: "Modificación de parámetros del sistema",
      fecha: "2023-05-13",
      hora: "17:30:42",
      nivel: "Alerta",
      ip: "192.168.1.106",
    },
    {
      id: 8,
      usuario: "Sofía Hernández",
      accion: "Error del sistema",
      modulo: "Seguridad",
      detalles: "Error en la validación de credenciales",
      fecha: "2023-05-13",
      hora: "11:25:37",
      nivel: "Error",
      ip: "192.168.1.107",
    },
  ]

  // Filtrar logs según la búsqueda y la pestaña activa
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.modulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detalles.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "todos") return matchesSearch
    if (activeTab === "info") return matchesSearch && log.nivel === "Info"
    if (activeTab === "alertas") return matchesSearch && log.nivel === "Alerta"
    if (activeTab === "errores") return matchesSearch && log.nivel === "Error"
    return matchesSearch
  })

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Logs de Auditoría</h1>
        <div>
          <Button variant="outline" className="mr-2">
            <Filter className="mr-2 h-4 w-4" />
            Filtros Avanzados
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Exportar Logs
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Resumen de Actividad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Registros</p>
                  <p className="text-2xl font-bold">{logs.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Info</p>
                  <p className="text-2xl font-bold">{logs.filter((l) => l.nivel === "Info").length}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Alertas</p>
                  <p className="text-2xl font-bold">{logs.filter((l) => l.nivel === "Alerta").length}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Errores</p>
                  <p className="text-2xl font-bold">{logs.filter((l) => l.nivel === "Error").length}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="todos" className="w-[400px]" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="alertas">Alertas</TabsTrigger>
            <TabsTrigger value="errores">Errores</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar logs..."
            className="pl-8 w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.usuario}</TableCell>
                  <TableCell>{log.accion}</TableCell>
                  <TableCell>{log.modulo}</TableCell>
                  <TableCell>{log.fecha}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-gray-500" />
                      {log.hora}
                    </div>
                  </TableCell>
                  <TableCell>{log.ip}</TableCell>
                  <TableCell>
                    <Badge
                      variant={log.nivel === "Info" ? "default" : log.nivel === "Alerta" ? "secondary" : "destructive"}
                    >
                      {log.nivel}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{log.detalles}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}