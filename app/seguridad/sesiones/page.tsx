"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, LogOut, Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react"

export default function SesionesActivas() {
  // Datos de ejemplo
  const sesiones = [
    {
      id: 1,
      usuario: "Juan Pérez",
      email: "juan.perez@ejemplo.com",
      rol: "Administrador",
      ip: "192.168.1.100",
      inicio: "2023-05-15 10:30:45",
      duracion: "01:45:22",
      dispositivo: "Windows / Chrome",
      tipo: "Desktop",
      activa: true,
    },
    {
      id: 2,
      usuario: "María López",
      email: "maria.lopez@ejemplo.com",
      rol: "Docente",
      ip: "192.168.1.101",
      inicio: "2023-05-15 09:15:22",
      duracion: "02:30:45",
      dispositivo: "MacOS / Safari",
      tipo: "Desktop",
      activa: true,
    },
    {
      id: 3,
      usuario: "Carlos Rodríguez",
      email: "carlos.rodriguez@ejemplo.com",
      rol: "Estudiante",
      ip: "192.168.1.102",
      inicio: "2023-05-15 08:45:10",
      duracion: "00:15:33",
      dispositivo: "Android / Chrome",
      tipo: "Mobile",
      activa: false,
    },
    {
      id: 4,
      usuario: "Ana Martínez",
      email: "ana.martinez@ejemplo.com",
      rol: "Administrativo",
      ip: "192.168.1.103",
      inicio: "2023-05-15 11:20:33",
      duracion: "00:45:12",
      dispositivo: "Windows / Edge",
      tipo: "Desktop",
      activa: true,
    },
    {
      id: 5,
      usuario: "Roberto Sánchez",
      email: "roberto.sanchez@ejemplo.com",
      rol: "Docente",
      ip: "192.168.1.104",
      inicio: "2023-05-15 10:10:05",
      duracion: "01:50:30",
      dispositivo: "iOS / Safari",
      tipo: "Tablet",
      activa: true,
    },
    {
      id: 6,
      usuario: "Laura Gómez",
      email: "laura.gomez@ejemplo.com",
      rol: "Estudiante",
      ip: "192.168.1.105",
      inicio: "2023-05-15 09:05:18",
      duracion: "00:30:45",
      dispositivo: "Windows / Firefox",
      tipo: "Desktop",
      activa: false,
    },
  ]

  const [sessionList, setSessionList] = useState(sesiones)

  // Función para cerrar una sesión
  const cerrarSesion = (id: number) => {
    setSessionList(sessionList.map((sesion) => (sesion.id === id ? { ...sesion, activa: false } : sesion)))
  }

  // Función para cerrar todas las sesiones
  const cerrarTodasSesiones = () => {
    setSessionList(sessionList.map((sesion) => ({ ...sesion, activa: false })))
  }

  // Contar sesiones por tipo de dispositivo
  const desktopSessions = sessionList.filter((s) => s.tipo === "Desktop" && s.activa).length
  const mobileSessions = sessionList.filter((s) => s.tipo === "Mobile" && s.activa).length
  const tabletSessions = sessionList.filter((s) => s.tipo === "Tablet" && s.activa).length

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sesiones Activas</h1>
        <div>
          <Button variant="outline" className="mr-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={cerrarTodasSesiones}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Todas las Sesiones
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Resumen de Sesiones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Sesiones Activas</p>
                  <p className="text-2xl font-bold">{sessionList.filter((s) => s.activa).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Monitor className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Desktop</p>
                  <p className="text-2xl font-bold">{desktopSessions}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Smartphone className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="text-2xl font-bold">{mobileSessions}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Tablet className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Tablet</p>
                  <p className="text-2xl font-bold">{tabletSessions}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Inicio de Sesión</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionList.map((sesion) => (
                <TableRow key={sesion.id} className={!sesion.activa ? "opacity-60" : ""}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{sesion.usuario}</div>
                      <div className="text-sm text-gray-500">{sesion.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{sesion.rol}</TableCell>
                  <TableCell>{sesion.ip}</TableCell>
                  <TableCell>{sesion.inicio}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-gray-500" />
                      {sesion.duracion}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {sesion.tipo === "Desktop" && <Monitor className="h-4 w-4 mr-1 text-green-600" />}
                      {sesion.tipo === "Mobile" && <Smartphone className="h-4 w-4 mr-1 text-yellow-600" />}
                      {sesion.tipo === "Tablet" && <Tablet className="h-4 w-4 mr-1 text-purple-600" />}
                      {sesion.dispositivo}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sesion.activa ? "success" : "secondary"}>
                      {sesion.activa ? "Activa" : "Cerrada"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {sesion.activa && (
                      <Button variant="destructive" size="sm" onClick={() => cerrarSesion(sesion.id)}>
                        <LogOut className="h-4 w-4 mr-1" />
                        Cerrar Sesión
                      </Button>
                    )}
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

