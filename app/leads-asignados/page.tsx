"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { API_BASE_URL } from "@/utils/apiConfig"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Interfaz para prospecto (ajusta según tus campos)
interface Prospecto {
  id: string
  nombre: string
  email: string
  telefono: string
  departamento: string
  estado: string
  ultimoCambio: string
}

export default function GestionProspectos() {
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [estadoFilter, setEstadoFilter] = useState<string>("todos")

  // Estados para paginación
  const [pageSize, setPageSize] = useState<string>("5")
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Estado para el usuario actual obtenido de localStorage (se carga en el cliente)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Carga inicial de prospectos (se envía el token de autenticación)
  useEffect(() => {
    const fetchProspectos = async () => {
      setLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        const url = `${API_BASE_URL}/api/prospectos`
        const res = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) {
          throw new Error(`Error al obtener prospectos: status ${res.status}`)
        }
        const json = await res.json()
        // Mapeamos los datos del backend a nuestro modelo de prospecto
        const prospectosTransformados = json.data.map((item: any) => ({
          id: String(item.id),
          nombre: item.nombre_completo,
          email: item.correo_electronico,
          telefono: item.telefono,
          departamento: item.empresa_donde_labora_actualmente ?? "Sin Departamento",
          estado: item.status || "No contactado",
          ultimoCambio: item.updated_at ?? "N/A",
        }))
        setProspectos(prospectosTransformados)
      } catch (err: any) {
        setError(err.message || "Error inesperado")
      } finally {
        setLoading(false)
      }
    }
    fetchProspectos()
  }, [])

  // Cargar el usuario actual (solo en el cliente)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser))
      }
    }
  }, [])

  // Seleccionar/deseleccionar todos
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(prospectos.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }

  // Seleccionar/deseleccionar uno
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id))
    }
  }

  // Asignar color según estado
  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "no contactado":
        return "bg-gray-100 text-gray-800"
      case "en seguimiento":
        return "bg-blue-100 text-blue-800"
      case "le interesa a futuro":
        return "bg-yellow-100 text-yellow-800"
      case "perdido":
        return "bg-red-100 text-red-800"
      case "inscrito":
        return "bg-green-100 text-green-800"
      case "promesa de pago":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Filtrado por búsqueda y estado
  const filteredProspectos = useMemo(() => {
    return prospectos.filter((p) => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.telefono.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesEstado =
        estadoFilter === "todos"
          ? true
          : p.estado.toLowerCase() === estadoFilter.toLowerCase()
      return matchesSearch && matchesEstado
    })
  }, [prospectos, searchTerm, estadoFilter])

  // Paginación: cálculo de prospectos a mostrar
  const paginatedProspectos = useMemo(() => {
    if (pageSize === "all") {
      return filteredProspectos
    }
    const size = Number(pageSize)
    const startIndex = (currentPage - 1) * size
    const endIndex = startIndex + size
    return filteredProspectos.slice(startIndex, endIndex)
  }, [filteredProspectos, currentPage, pageSize])

  // Número total de páginas
  const totalPages = useMemo(() => {
    if (pageSize === "all") return 1
    return Math.ceil(filteredProspectos.length / Number(pageSize))
  }, [filteredProspectos, pageSize])

  // Cambiar el tamaño de página
  const handlePageSizeChange = (value: string) => {
    setPageSize(value)
    setCurrentPage(1)
  }

  // Navegación entre páginas
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filtros superiores */}
      <div className="p-4 border-b flex flex-wrap gap-4">
        <Input
          placeholder="Buscar prospectos..."
          className="max-w-xs"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
        />
        <Select
          value={estadoFilter}
          onValueChange={(value) => {
            setEstadoFilter(value)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="No contactado">No contactado</SelectItem>
            <SelectItem value="En seguimiento">En seguimiento</SelectItem>
            <SelectItem value="Le interesa a futuro">Le interesa a futuro</SelectItem>
            <SelectItem value="Perdido">Perdido</SelectItem>
            <SelectItem value="Inscrito">Inscrito</SelectItem>
            <SelectItem value="Promesa de pago">Promesa de pago</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {loading && <p className="p-4">Cargando prospectos...</p>}
      {error && <p className="p-4 text-red-500">{error}</p>}

      {/* Tabla de prospectos */}
      <div className="overflow-x-auto p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedIds.length === prospectos.length}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProspectos.length > 0 ? (
              paginatedProspectos.map((prospecto) => (
                <TableRow key={prospecto.id} className="hover:bg-gray-50">
                  <TableCell className="w-10">
                    <Checkbox
                      checked={selectedIds.includes(prospecto.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(prospecto.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>{prospecto.nombre}</TableCell>
                  <TableCell>{prospecto.email}</TableCell>
                  <TableCell>{prospecto.telefono}</TableCell>
                  <TableCell>{prospecto.departamento}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <Badge className={getEstadoColor(prospecto.estado)}>
                        {prospecto.estado}
                      </Badge>
                      <span className="text-xs text-gray-500 mt-1">
                        Último cambio: {prospecto.ultimoCambio}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-4 text-center text-gray-500">
                  No se encontraron prospectos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center justify-end gap-2 p-4">
        <Select value={pageSize} onValueChange={handlePageSizeChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Paginación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>

        {pageSize !== "all" && (
          <>
            <Button variant="outline" onClick={handlePrevPage} disabled={currentPage === 1}>
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Siguiente
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
