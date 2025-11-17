"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Download, FileText, Filter, Search, Loader2, AlertCircle } from "lucide-react"
import * as auditoriaService from "@/services/auditoria"
import type { LogAuditoria, EstadisticasAuditoria } from "@/services/auditoria"

export default function LogsAuditoria() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"todos" | "activity" | "email" | "collection">("todos")
  const [nivelFilter, setNivelFilter] = useState<"todos" | "info" | "warning" | "error">("todos")
  const [logs, setLogs] = useState<LogAuditoria[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasAuditoria>({
    total: 0,
    activity: 0,
    email: 0,
    collection: 0,
    hoy: 0
  })
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 50,
    total: 0,
    has_more: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await auditoriaService.obtenerLogs({
        search: searchTerm || undefined,
        tipo: activeTab,
        nivel: nivelFilter === "todos" ? undefined : nivelFilter,
        page: pagination.current_page,
        per_page: 50
      })
      
      setLogs(data.logs)
      setEstadisticas(data.estadisticas)
      setPagination(data.pagination)
    } catch (err: any) {
      console.error("Error cargando logs:", err)
      setError(err.message || "Error al cargar logs de auditoría")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarLogs()
  }, [activeTab, nivelFilter, pagination.current_page])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, current_page: 1 }))
      cargarLogs()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchTerm])

  const getNivelBadgeVariant = (nivel: string) => {
    switch (nivel?.toLowerCase()) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'default'
      case 'info':
      default:
        return 'secondary'
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'activity': return 'Actividad'
      case 'email': return 'Email'
      case 'collection': return 'Cobranza'
      default: return tipo
    }
  }

  const from = (pagination.current_page - 1) * pagination.per_page + 1
  const to = Math.min(from + pagination.per_page - 1, pagination.total)

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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Resumen cards */}
            {/* ... */}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <Tabs value={activeTab} className="w-[500px]" onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
            <TabsTrigger value="email">Emails</TabsTrigger>
            <TabsTrigger value="collection">Cobranza</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={nivelFilter} className="w-[300px]" onValueChange={(v) => setNivelFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="warning">Alertas</TabsTrigger>
            <TabsTrigger value="error">Errores</TabsTrigger>
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
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Cargando logs...</span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-12 text-red-600">
              <AlertCircle className="h-8 w-8 mr-2" />
              <span>{error}</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex justify-center items-center py-12 text-gray-500">
              <FileText className="h-8 w-8 mr-2" />
              <span>No se encontraron logs</span>
            </div>
          ) : (
            <>
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        <div>{log.usuario}</div>
                        <div className="text-xs text-gray-500">{log.email}</div>
                      </TableCell>
                      <TableCell>{log.accion}</TableCell>
                      <TableCell>{log.modulo}</TableCell>
                      <TableCell>{log.fecha}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-500" />
                          {log.hora}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">{log.ip || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getNivelBadgeVariant(log.nivel)}>
                          {log.nivel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getTipoLabel(log.tipo_log)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{log.detalles || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-500">
                  Mostrando {from} - {to} de {pagination.total.toLocaleString()} logs
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(p => ({ ...p, current_page: p.current_page - 1 }))}
                    disabled={pagination.current_page === 1 || loading}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(p => ({ ...p, current_page: p.current_page + 1 }))}
                    disabled={!pagination.has_more || loading}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
