"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Key, Lock, QrCode, Smartphone } from "lucide-react"

export default function Autenticacion2FA() {
  const [searchTerm, setSearchTerm] = useState("")

  // Datos de ejemplo
  const usuarios = [
    {
      id: 1,
      nombre: "Juan Pérez",
      email: "juan.perez@ejemplo.com",
      rol: "Administrador",
      estado: "Activo",
      metodo2fa: "App Autenticador",
      estado2fa: true,
    },
    {
      id: 2,
      nombre: "María López",
      email: "maria.lopez@ejemplo.com",
      rol: "Docente",
      estado: "Activo",
      metodo2fa: "SMS",
      estado2fa: true,
    },
    {
      id: 3,
      nombre: "Carlos Rodríguez",
      email: "carlos.rodriguez@ejemplo.com",
      rol: "Estudiante",
      estado: "Activo",
      metodo2fa: "No configurado",
      estado2fa: false,
    },
    {
      id: 4,
      nombre: "Ana Martínez",
      email: "ana.martinez@ejemplo.com",
      rol: "Administrativo",
      estado: "Activo",
      metodo2fa: "App Autenticador",
      estado2fa: true,
    },
    {
      id: 5,
      nombre: "Roberto Sánchez",
      email: "roberto.sanchez@ejemplo.com",
      rol: "Docente",
      estado: "Activo",
      metodo2fa: "Email",
      estado2fa: true,
    },
    {
      id: 6,
      nombre: "Laura Gómez",
      email: "laura.gomez@ejemplo.com",
      rol: "Estudiante",
      estado: "Activo",
      metodo2fa: "No configurado",
      estado2fa: false,
    },
    {
      id: 7,
      nombre: "Pedro Díaz",
      email: "pedro.diaz@ejemplo.com",
      rol: "Administrativo",
      estado: "Inactivo",
      metodo2fa: "SMS",
      estado2fa: true,
    },
    {
      id: 8,
      nombre: "Sofía Hernández",
      email: "sofia.hernandez@ejemplo.com",
      rol: "Docente",
      estado: "Activo",
      metodo2fa: "App Autenticador",
      estado2fa: true,
    },
  ]

  // Filtrar usuarios según la búsqueda
  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.metodo2fa.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Estadísticas
  const totalUsuarios = usuarios.length
  const usuariosCon2FA = usuarios.filter((u) => u.estado2fa).length
  const porcentaje2FA = Math.round((usuariosCon2FA / totalUsuarios) * 100)

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Autenticación de Dos Factores (2FA)</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Lock className="mr-2 h-4 w-4" />
          Configurar Políticas 2FA
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado 2FA</CardTitle>
            <CardDescription>Resumen de implementación 2FA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Key className="h-10 w-10 text-blue-600 mr-4" />
                <div>
                  <p className="text-sm text-gray-500">Usuarios con 2FA</p>
                  <p className="text-3xl font-bold">
                    {usuariosCon2FA} / {totalUsuarios}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Porcentaje</p>
                <p className="text-3xl font-bold text-blue-600">{porcentaje2FA}%</p>
              </div>
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${porcentaje2FA}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métodos 2FA</CardTitle>
            <CardDescription>Distribución por método</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-green-600 mr-2" />
                  <span>App Autenticador</span>
                </div>
                <Badge variant="outline">{usuarios.filter((u) => u.metodo2fa === "App Autenticador").length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-yellow-600 mr-2" />
                  <span>SMS</span>
                </div>
                <Badge variant="outline">{usuarios.filter((u) => u.metodo2fa === "SMS").length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-blue-600 mr-2" />
                  <span>Email</span>
                </div>
                <Badge variant="outline">{usuarios.filter((u) => u.metodo2fa === "Email").length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Lock className="h-5 w-5 text-red-600 mr-2" />
                  <span>No configurado</span>
                </div>
                <Badge variant="outline">{usuarios.filter((u) => u.metodo2fa === "No configurado").length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración 2FA</CardTitle>
            <CardDescription>Opciones disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <QrCode className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="font-medium">App Autenticador</p>
                    <p className="text-sm text-gray-500">Google, Microsoft, Authy</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="font-medium">SMS</p>
                    <p className="text-sm text-gray-500">Código por mensaje de texto</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-500">Código por correo electrónico</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Key className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="font-medium">Llaves de seguridad</p>
                    <p className="text-sm text-gray-500">YubiKey, etc.</p>
                  </div>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado 2FA por Usuario</CardTitle>
          <div className="mt-2">
            <Input
              type="search"
              placeholder="Buscar usuarios..."
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Método 2FA</TableHead>
                <TableHead>Estado 2FA</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{usuario.nombre}</div>
                      <div className="text-sm text-gray-500">{usuario.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{usuario.rol}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {usuario.metodo2fa === "App Autenticador" && <QrCode className="h-4 w-4 mr-1 text-green-600" />}
                      {usuario.metodo2fa === "SMS" && <Smartphone className="h-4 w-4 mr-1 text-yellow-600" />}
                      {usuario.metodo2fa === "Email" && <Smartphone className="h-4 w-4 mr-1 text-blue-600" />}
                      {usuario.metodo2fa === "No configurado" && <Lock className="h-4 w-4 mr-1 text-red-600" />}
                      {usuario.metodo2fa}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={usuario.estado2fa ? "success" : "destructive"}>
                      {usuario.estado2fa ? "Activado" : "Desactivado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2">
                      Configurar
                    </Button>
                    <Button variant={usuario.estado2fa ? "destructive" : "default"} size="sm">
                      {usuario.estado2fa ? "Desactivar" : "Activar"}
                    </Button>
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

