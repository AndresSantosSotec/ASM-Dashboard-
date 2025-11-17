"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Clock, Download, Lock, Search, Shield, User, X, Loader2, AlertCircle, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import seguridadService, { type AccesoSesion, type ResumenAccesos } from "@/services/seguridad"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ControlAccesos() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"todos" | "activo" | "cerrado">("todos")
  const [accesos, setAccesos] = useState<AccesoSesion[]>([])
  const [resumen, setResumen] = useState<ResumenAccesos>({ total: 0, activos: 0, cerrados: 0, hoy: 0 })
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [sessionToClose, setSessionToClose] = useState<number | null>(null)
  const [closingSession, setClosingSession] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 50,
    total: 0,
    total_pages: 1,
    from: 0,
    to: 0,
    has_more: false
  })

  // Cargar accesos desde el backend
  useEffect(() => {
    cargarAccesos()
  }, [activeTab, searchTerm, currentPage, perPage])

  const cargarAccesos = async () => {
    try {
      setLoading(true)
      const response = await seguridadService.obtenerAccesos({
        search: searchTerm || undefined,
        estado: activeTab,
        page: currentPage,
        per_page: perPage
      })

      setAccesos(response.accesos)
      setResumen(response.resumen)
      setPagination(response.pagination)
      setTotalPages(response.pagination.total_pages)
    } catch (error: any) {
      console.error("Error cargando accesos:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los accesos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDescargarReporte = async () => {
    try {
      setDownloading(true)
      await seguridadService.descargarReporteAccesos({
        search: searchTerm || undefined,
        estado: activeTab
      })
      toast({
        title: "✅ Reporte descargado",
        description: "El archivo PDF se descargó correctamente"
      })
    } catch (error: any) {
      console.error("Error descargando reporte:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo descargar el reporte",
        variant: "destructive"
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleCerrarSesion = async () => {
    if (!sessionToClose) return

    try {
      setClosingSession(true)
      await seguridadService.cerrarSesion(sessionToClose)
      toast({
        title: "✅ Sesión cerrada",
        description: "La sesión se cerró correctamente"
      })
      setSessionToClose(null)
      // Recargar lista
      cargarAccesos()
    } catch (error: any) {
      console.error("Error cerrando sesión:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cerrar la sesión",
        variant: "destructive"
      })
    } finally {
      setClosingSession(false)
    }
  }

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
                  <p className="text-2xl font-bold">{loading ? "-" : resumen.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Sesiones Activas</p>
                  <p className="text-2xl font-bold">{loading ? "-" : resumen.activos}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Lock className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Sesiones Cerradas</p>
                  <p className="text-2xl font-bold">{loading ? "-" : resumen.cerrados}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Hoy</p>
                  <p className="text-2xl font-bold">{loading ? "-" : resumen.hoy}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="todos" className="w-[400px]" onValueChange={(v) => setActiveTab(v as "todos" | "activo" | "cerrado")}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="activo">Activos</TabsTrigger>
            <TabsTrigger value="cerrado">Cerrados</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 items-center">
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
          <Button onClick={handleDescargarReporte} disabled={downloading} variant="outline">
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {downloading ? "Descargando..." : "Descargar Reporte"}
          </Button>
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
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Cargando accesos...</p>
                  </TableCell>
                </TableRow>
              ) : accesos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No se encontraron accesos</p>
                  </TableCell>
                </TableRow>
              ) : (
                accesos.map((acceso) => (
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
                    <Badge variant={acceso.estado === "Activo" ? "default" : "secondary"}>
                      {acceso.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {acceso.estado === "Activo" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSessionToClose(acceso.id)}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!loading && accesos.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {pagination.from} - {pagination.to} de {pagination.total} accesos
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!pagination.has_more}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para cerrar sesión */}
      <AlertDialog open={sessionToClose !== null} onOpenChange={(open) => !open && setSessionToClose(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar esta sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cerrará la sesión del usuario. El usuario deberá iniciar sesión nuevamente para acceder al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closingSession}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCerrarSesion} disabled={closingSession}>
              {closingSession ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cerrando...
                </>
              ) : (
                "Cerrar Sesión"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

