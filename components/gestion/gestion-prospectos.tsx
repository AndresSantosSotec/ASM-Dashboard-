"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter, MoreHorizontal, Eye, Edit2, Trash2, UserPlus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import DetallesProspecto from "./detalles-prospecto"
import EditarProspecto from "./editar-prospecto"
import ConfirmarInscripcion from "./confirmar-inscripcion"
import CambiarEstado from "./cambiar-estado"

// Esta interfaz la usas en tu tabla
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
  const [modalType, setModalType] = useState<"detalles" | "editar" | "confirmar" | null>(null)
  const [showEstadoMenu, setShowEstadoMenu] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    const fetchProspectos = async () => {
      setLoading(true)
      setError("")

      try {
        // Ajusta la URL según tu backend (ejemplo con Laravel)
        const url = "http://127.0.0.1:8000/api/prospectos"
        const res = await fetch(url)

        console.log("Respuesta de fetch, status:", res.status)

        if (!res.ok) {
          throw new Error(`Error al obtener prospectos: status ${res.status}`)
        }

        const json = await res.json()
        console.log("JSON recibido:", json)

        // Mapeamos los campos que tu API devuelve (nombre_completo, correo_electronico, etc.)
        // a los que usa tu tabla (nombre, email, etc.)
        const prospectosTransformados = json.data.map((item: any) => ({
          // En tu tabla usas strings como 'id', aquí nos aseguramos de convertir si es numérico.
          id: String(item.id),
          nombre: item.nombre_completo,
          email: item.correo_electronico,
          telefono: item.telefono,
          // Asigna algo para "departamento" si no existe en la base de datos.
          departamento: item.empresa_donde_labora_actualmente ?? "Sin Departamento",
          // Podrías venirlo leyendo de la BD, o bien asignar un valor según la lógica que manejes.
          estado: "Nuevo",
          // Mapeamos "ultimoCambio" a updated_at (o el campo que desees)
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(prospectos.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id))
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Nuevo":
        return "bg-blue-100 text-blue-800"
      case "En proceso":
        return "bg-yellow-100 text-yellow-800"
      case "Perdido":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex items-center gap-4">
        <Input placeholder="Buscar prospectos..." className="max-w-xs" />
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="nuevo">Nuevo</SelectItem>
            <SelectItem value="proceso">En proceso</SelectItem>
            <SelectItem value="perdido">Perdido</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {loading && <p className="p-4">Cargando prospectos...</p>}
      {error && <p className="p-4 text-red-500">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="py-3 px-4 text-left">
                <Checkbox
                  checked={selectedIds.length === prospectos.length}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
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
            {prospectos.map((prospecto) => (
              <tr key={prospecto.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <Checkbox
                    checked={selectedIds.includes(prospecto.id)}
                    onCheckedChange={(checked) => handleSelectOne(prospecto.id, checked as boolean)}
                  />
                </td>
                <td className="py-3 px-4">{prospecto.nombre}</td>
                <td className="py-3 px-4">{prospecto.email}</td>
                <td className="py-3 px-4">{prospecto.telefono}</td>
                <td className="py-3 px-4">{prospecto.departamento}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(prospecto.estado)}`}
                    >
                      {prospecto.estado}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Último cambio: {prospecto.ultimoCambio}</span>
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
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                            setShowEstadoMenu(true)
                          }}
                        >
                          Cambiar Estado
                        </DropdownMenuItem>
                        <DropdownMenuItem>Enviar Email</DropdownMenuItem>
                        <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                        <DropdownMenuItem>Llamar</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProspecto(prospecto)
                            setModalType("confirmar")
                          }}
                        >
                          Inscribir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {selectedProspecto && modalType === "confirmar" && (
        <ConfirmarInscripcion
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
