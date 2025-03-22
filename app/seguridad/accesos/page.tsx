"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Clock, Eye, Lock, Search, Shield, User } from "lucide-react"

export default function ControlAccesos() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("todos")

  // Datos de ejemplo
  const accesos = [
    {
      id: 1,
      usuario: "Juan Pérez",
      email: "juan.perez@ejemplo.com",
      rol: "Administrador",
      ip: "192.168.1.100",
      fecha: "2023-05-15",
      hora: "10:30:45",
      estado: "Exitoso",
      dispositivo: "Windows / Chrome",
    },
    {
      id: 2,
      usuario: "María López",
      email: "maria.lopez@ejemplo.com",
      rol: "Docente",
      ip: "192.168.1.101",
      fecha: "2023-05-15",
      hora: "09:15:22",
      estado: "Exitoso",
      dispositivo: "MacOS / Safari",
    },
    {
      id: 3,
      usuario: "Carlos Rodríguez",
      email: "carlos.rodriguez@ejemplo.com",
      rol: "Estudiante",
      ip: "192.168.1.102",
      fecha: "2023-05-15",
      hora: "08:45:10",
      estado: "Fallido",
      dispositivo: "Android / Chrome",
    },
    {
      id: 4,
      usuario: "Ana Martínez",
      email: "ana.martinez@ejemplo.com",
      rol: "Administrativo",
      ip: "192.168.1.103",
      fecha: "2023-05-14",
      hora: "16:20:33",
      estado: "Exitoso",
      dispositivo: "Windows / Edge",
    },
    {
      id: 5,
      usuario: "Roberto Sánchez",
      email: "roberto.sanchez@ejemplo.com",
      rol: "Docente",
      ip: "192.168.1.104",
      fecha: "2023-05-14",
      hora: "14:10:05",
      estado: "Exitoso",
      dispositivo: "iOS / Safari",
    },
    {
      id: 6,
      usuario: "Laura Gómez",
      email: "laura.gomez@ejemplo.com",
      rol: "Estudiante",
      ip: "192.168.1.105",
      fecha: "2023-05-14",
      hora: "12:05:18",
      estado: "Fallido",
      dispositivo: "Windows / Firefox",
    },
    {
      id: 7,
      usuario: "Pedro Díaz",
      email: "pedro.diaz@ejemplo.com",
      rol: "Administrativo",
      ip: "192.168.1.106",
      fecha: "2023-05-13",
      hora: "17:30:42",
      estado: "Exitoso",
      dispositivo: "Linux / Chrome",
    },
    {
      id: 8,
      usuario: "Sofía Hernández",
      email: "sofia.hernandez@ejemplo.com",
      rol: "Docente",
      ip: "192.168.1.107",
      fecha: "2023-05-13",
      hora: "11:25:37",
      estado: "Fallido",
      dispositivo: "MacOS / Chrome",
    },
  ]

  // Filtrar accesos según la búsqueda y la pestaña activa
  const filteredAccesos = accesos.filter((acceso) => {
    const matchesSearch =
      acceso.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acceso.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acceso.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acceso.dispositivo.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "todos") return matchesSearch
    if (activeTab === "exitosos") return matchesSearch && acceso.estado === "Exitoso"
    if (activeTab === "fallidos") return matchesSearch && acceso.estado === "Fallido"
    return matchesSearch
  })

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Control de Accesos</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Eye className="mr-2 h-4 w-4" />
          Ver Políticas de Acceso
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Resumen de Accesos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Accesos</p>
                  <p className="text-2xl font-bold">{accesos.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Accesos Exitosos</p>
                  <p className="text-2xl font-bold">{accesos.filter((a) => a.estado === "Exitoso").length}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Lock className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Accesos Fallidos</p>
                  <p className="text-2xl font-bold">{accesos.filter((a) => a.estado === "Fallido").length}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Hoy</p>
                  <p className="text-2xl font-bold">{accesos.filter((a) => a.fecha === "2023-05-15").length}</p>
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
            <TabsTrigger value="exitosos">Exitosos</TabsTrigger>
            <TabsTrigger value="fallidos">Fallidos</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar accesos..."
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
                <TableHead>Rol</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccesos.map((acceso) => (
                <TableRow key={acceso.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{acceso.usuario}</div>
                      <div className="text-sm text-gray-500">{acceso.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{acceso.rol}</TableCell>
                  <TableCell>{acceso.ip}</TableCell>
                  <TableCell>{acceso.fecha}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-gray-500" />
                      {acceso.hora}
                    </div>
                  </TableCell>
                  <TableCell>{acceso.dispositivo}</TableCell>
                  <TableCell>
                    <Badge variant={acceso.estado === "Exitoso" ? "success" : "destructive"}>{acceso.estado}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

