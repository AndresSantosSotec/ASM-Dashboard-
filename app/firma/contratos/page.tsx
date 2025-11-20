"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, Loader2, Search, CheckCircle2, Clock, XCircle } from "lucide-react"
import { API_BASE_URL } from '@/utils/apiConfig'

interface Contrato {
  id: number
  prospecto_id: number
  prospecto_nombre: string
  prospecto_email: string
  prospecto_telefono: string
  asesor_nombre: string
  asesor_email: string
  estado_firma: string
  fecha_envio: string
  fecha_firma_estudiante: string | null
  resultado: string
  tiene_firma_asesor: boolean
  tiene_firma_estudiante: boolean
  token_firma: string
}

export default function ContratosListPage() {
  const router = useRouter()

  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const cargarContratos = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: "15",
        ...(search && { search }),
        ...(estadoFiltro && { estado: estadoFiltro }),
      })

      const res = await fetch(`${API_BASE_URL}/api/contratos?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (data.success) {
        setContratos(data.data)
        setTotal(data.total)
        setTotalPages(data.last_page)
      }
    } catch (err) {
      console.error("Error al cargar contratos:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarContratos()
  }, [currentPage, search, estadoFiltro])

  const handleSearch = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleEstadoChange = (value: string) => {
    setEstadoFiltro(value === "todos" ? "" : value)
    setCurrentPage(1)
  }

  const verContrato = (id: number) => {
    router.push(`/firma/contratos/${id}`)
  }

  const estadoBadge = (estado: string) => {
    const config = {
      pendiente: { color: "bg-gray-500", texto: "Pendiente", icon: Clock },
      firmado_asesor: { color: "bg-yellow-500", texto: "Firmado Asesor", icon: Clock },
      firmado_completo: { color: "bg-green-500", texto: "Completo", icon: CheckCircle2 },
    }[estado] || { color: "bg-gray-500", texto: "Desconocido", icon: XCircle }

    const Icon = config.icon

    return (
      <Badge className={`${config.color} text-white text-xs`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.texto}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Contratos de Confidencialidad
          </h1>
          <p className="text-gray-600">
            Gestión y visualización de contratos firmados
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, email..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={estadoFiltro || "todos"} onValueChange={handleEstadoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="firmado_asesor">Firmado por Asesor</SelectItem>
                  <SelectItem value="firmado_completo">Firmado Completo</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{total}</span> contratos encontrados
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
              </div>
            ) : contratos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <XCircle className="h-12 w-12 mb-2" />
                <p>No se encontraron contratos</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Prospecto</TableHead>
                      <TableHead>Asesor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Firmas</TableHead>
                      <TableHead>Fecha Envío</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contratos.map((contrato) => (
                      <TableRow key={contrato.id}>
                        <TableCell className="font-medium">#{contrato.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{contrato.prospecto_nombre}</p>
                            <p className="text-xs text-gray-500">{contrato.prospecto_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{contrato.asesor_nombre}</p>
                            <p className="text-xs text-gray-500">{contrato.asesor_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{estadoBadge(contrato.estado_firma)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {contrato.tiene_firma_asesor && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                                Asesor
                              </Badge>
                            )}
                            {contrato.tiene_firma_estudiante && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                                Estudiante
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {new Date(contrato.fecha_envio).toLocaleDateString("es-GT")}
                            </p>
                            {contrato.fecha_firma_estudiante && (
                              <p className="text-xs text-gray-500">
                                Firmado: {new Date(contrato.fecha_firma_estudiante).toLocaleDateString("es-GT")}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verContrato(contrato.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
