"use client"

import { useState, useEffect, useMemo } from "react"
import Swal from "sweetalert2"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter, MoreHorizontal, Eye, Edit2, UserPlus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import DetallesProspecto from "./detalles-prospecto"
import EditarProspecto from "./editar-prospecto"
import CambiarEstado from "./cambiar-estado"

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
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null)
  const [modalType, setModalType] = useState<"detalles" | "editar" | null>(null)
  const [showEstadoMenu, setShowEstadoMenu] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [estadoFilter, setEstadoFilter] = useState<string>("todos")
  const [pageSize, setPageSize] = useState<string>("5")
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Usuario actual
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Carga inicial de prospectos
  useEffect(() => {
    const fetchProspectos = async () => {
      setLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("http://127.0.0.1:8000/api/prospectos", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) throw new Error(`Error al obtener prospectos: status ${res.status}`)
        const json = await res.json()
        const prospectosTransformados = json.data
          .map((item: any) => ({
            id: String(item.id),
            nombre: item.nombre_completo,
            email: item.correo_electronico,
            telefono: item.telefono,
            departamento: item.empresa_donde_labora_actualmente ?? "Sin Departamento",
            estado: item.status || "No contactado",
            ultimoCambio: item.updated_at ?? "N/A",
          }))
          // Excluir los que ya están en preinscripción
          .filter((p: Prospecto) => p.estado.toLowerCase() !== "preinscripción")
        setProspectos(prospectosTransformados)
      } catch (err: any) {
        setError(err.message || "Error inesperado")
      } finally {
        setLoading(false)
      }
    }
    fetchProspectos()
  }, [])

  // Carga del usuario actual
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user")
      if (storedUser) setCurrentUser(JSON.parse(storedUser))
    }
  }, [])

  // Función para inscribir (preinscripción)
  const handleInscribir = async (id: string) => {
    const result = await Swal.fire({
      title: "Pasar a preinscripción",
      text: "¿Confirmas que deseas Pasar al modulo de Inscripcion este prospecto?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, Pasar a Inscripción",
      cancelButtonText: "Cancelar",
    })
    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://127.0.0.1:8000/api/prospectos/${id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Preinscripción" }),
      })
      if (!res.ok) throw new Error(`Error al actualizar estado: status ${res.status}`)
      await res.json()
      // Eliminar de la lista local
      setProspectos(prospectos.filter((p) => p.id !== id))
      Swal.fire("¡Listo!", "El prospecto ha sido pasado a Inscripción.", "success")
    } catch (err: any) {
      Swal.fire("Error", err.message || "No se pudo actualizar el estado.", "error")
    }
  }

  // Seleccionar todos / uno
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? prospectos.map((p) => p.id) : [])
  }
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter((i) => i !== id))
  }

  // Color según estado
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
        estadoFilter === "todos" ? true : p.estado.toLowerCase() === estadoFilter.toLowerCase()
      return matchesSearch && matchesEstado
    })
  }, [prospectos, searchTerm, estadoFilter])

  // Paginación
  const paginatedProspectos = useMemo(() => {
    if (pageSize === "all") return filteredProspectos
    const size = Number(pageSize)
    const start = (currentPage - 1) * size
    return filteredProspectos.slice(start, start + size)
  }, [filteredProspectos, currentPage, pageSize])

  const totalPages = useMemo(() => {
    if (pageSize === "all") return 1
    return Math.ceil(filteredProspectos.length / Number(pageSize))
  }, [filteredProspectos, pageSize])

  const handlePageSizeChange = (value: string) => {
    setPageSize(value)
    setCurrentPage(1)
  }
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1)
  const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1)

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filtros */}
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
          onValueChange={(v) => {
            setEstadoFilter(v)
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

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="py-3 px-4">
                <Checkbox
                  checked={selectedIds.length === prospectos.length}
                  onCheckedChange={(c) => handleSelectAll(c as boolean)}
                />
              </th>
              <th className="py-3 px-4 text-left">Nombre</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Teléfono</th>
              <th className="py-3 px-4 text-left">Departamento</th>
              <th className="py-3 px-4 text-left">Estado</th>
              <th className="py-3 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedProspectos.map((prospecto) => (
              <tr key={prospecto.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <Checkbox
                    checked={selectedIds.includes(prospecto.id)}
                    onCheckedChange={(c) => handleSelectOne(prospecto.id, c as boolean)}
                  />
                </td>
                <td className="py-3 px-4">{prospecto.nombre}</td>
                <td className="py-3 px-4">{prospecto.email}</td>
                <td className="py-3 px-4">{prospecto.telefono}</td>
                <td className="py-3 px-4">{prospecto.departamento}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(
                        prospecto.estado
                      )}`}
                    >
                      {prospecto.estado}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Último cambio: {prospecto.ultimoCambio}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedProspecto(prospecto)
                        setModalType("detalles")
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedProspecto(prospecto)
                        setModalType("editar")
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {currentUser?.rol === "administrador" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedProspecto(prospecto)
                          setModalType("editar")
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProspecto(prospecto)
                            setModalType("editar")
                          }}
                        >
                          Actualizar Prospecto
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProspecto(prospecto)
                            setShowEstadoMenu(true)
                          }}
                        >
                          Cambiar Estado
                        </DropdownMenuItem>
                        <DropdownMenuItem>Enviar Email</DropdownMenuItem>
                        <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                        <DropdownMenuItem>Llamar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleInscribir(prospecto.id)}>
                          Inscribir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedProspectos.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500">
                  No se encontraron prospectos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
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

      {/* Modales */}
      {selectedProspecto && modalType === "detalles" && (
        <DetallesProspecto
          prospecto={selectedProspecto}
          onClose={() => {
            setSelectedProspecto(null)
            setModalType(null)
          }}
        />
      )}
      {selectedProspecto && modalType === "editar" && (
        <EditarProspecto
          prospecto={selectedProspecto}
          onClose={() => {
            setSelectedProspecto(null)
            setModalType(null)
          }}
        />
      )}
      {selectedProspecto && showEstadoMenu && (
        <CambiarEstado
          prospecto={selectedProspecto}
          onClose={() => {
            setSelectedProspecto(null)
            setShowEstadoMenu(false)
          }}
        />
      )}
    </div>
)
}
