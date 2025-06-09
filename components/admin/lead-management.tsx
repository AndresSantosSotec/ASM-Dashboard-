"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter, MoreHorizontal } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, } from "@/components/ui/dropdown-menu"
import swal from "sweetalert2"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/utils/apiConfig"


import EditProspectModal from "./Modals/EditProspectModal"
import ConfirmDeleteModal from "./Modals/ConfirmDeleteModal"
import Swal from "sweetalert2"

interface Prospecto {
  id: string
  nombre: string
  email: string
  telefono: string
  departamento: string
  estado: string
  ultimoCambio: string
  asesor_id: number | null
  asesor: { id: number; nombre: string } | null
}

interface Asesor {
  id: number
  nombre: string
}

export default function GestionProspectos() {
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [asesores, setAsesores] = useState<Asesor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [asesorFilter, setAsesorFilter] = useState("")
  const [pageSize, setPageSize] = useState("5")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // estados para modales
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeProspect, setActiveProspect] = useState<Prospecto | null>(null)
  // Selección individual:
  const [newAsesorId, setNewAsesorId] = useState<number | null>(null);
  const [bulkEditIds, setBulkEditIds] = useState<string[]>([])
  // Removed duplicate declaration of handleSelectOne

  // carga de prospectos
  useEffect(() => {
    setLoading(true)
    const qs = estadoFilter !== "todos" ? `?status=${estadoFilter}` : ""
    fetch(`${API_BASE_URL}/api/prospectos${qs}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(r => r.json())
      .then(json => {
        const arr: Prospecto[] = (json.data || []).map((item: any) => {
          const c = item.creator
          const nombreAsesor = c
            ? c.full_name ??
            (c.first_name && c.last_name
              ? `${c.first_name} ${c.last_name}`
              : c.username ?? "—")
            : null
          return {
            id: String(item.id),
            nombre: item.nombre_completo,
            email: item.correo_electronico,
            telefono: item.telefono,
            departamento:
              item.empresa_donde_labora_actualmente ?? "Sin Departamento",
            estado: item.status || "No contactado",
            ultimoCambio: item.updated_at ?? "N/A",
            asesor_id: c?.id ?? null,
            asesor: c ? { id: c.id, nombre: nombreAsesor } : null,
          }
        })
        setProspectos(arr)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [estadoFilter])

  // carga de asesores
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/role/7`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(r => r.json())
      .then(json => {
        const users: any[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []
        setAsesores(
          users.map(u => ({
            id: u.id,
            nombre:
              u.full_name ??
              (u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username ?? "—"),
          }))
        )
      })
      .catch(() => setAsesores([]))
  }, [])

  // reasignar
  const handleReasignar = async (id: string, asesorId: number) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/prospectos/${id}/assign`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ asesor_id: asesorId }),
        }
      )
      const json = await res.json()
      setProspectos(ps =>
        ps.map(p =>
          p.id === id
            ? {
              ...p,
              asesor_id: json.data.created_by,
              asesor: json.data.creator
                ? {
                  id: json.data.creator.id,
                  nombre:
                    json.data.creator.full_name ??
                    (json.data.creator.first_name && json.data.creator.last_name
                      ? `${json.data.creator.first_name} ${json.data.creator.last_name}`
                      : json.data.creator.username ?? "—"),
                }
                : null,
            }
            : p
        )
      )
    } catch (e) {
      console.error(e)
    }
  }

  // acciones de fila
  const handleView = (id: string) => {
    setActiveProspect(prospectos.find(p => p.id === id) || null)
    setViewOpen(true)
  }
  const handleUpdate = (id: string) => {
    setActiveProspect(prospectos.find(p => p.id === id) || null)
    setEditOpen(true)
  }
  const handleDelete = (id: string) => {
    setActiveProspect(prospectos.find(p => p.id === id) || null)
    setDeleteOpen(true)
  }

  // selección
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? prospectos.map(p => p.id) : [])
  }
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => (checked ? [...prev, id] : prev.filter(x => x !== id)))
  }

  const getEstadoColor = (e: string) => {
    switch (e.toLowerCase()) {
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

  // filtrado
  const filteredProspectos = useMemo(() => {
    const term = searchTerm.toLowerCase()
    const asesorTerm = asesorFilter.toLowerCase()
    return prospectos.filter(p => {
      const matchesText =
        p.nombre.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.telefono.toLowerCase().includes(term)
      const matchesAsesor =
        !asesorTerm || p.asesor?.nombre.toLowerCase().includes(asesorTerm)
      return matchesText && matchesAsesor
    })
  }, [prospectos, searchTerm, asesorFilter])

  // paginación
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

  return (
    <div className="bg-white rounded-lg shadow">
      {/* FILTROS */}
      <div className="p-4 border-b flex flex-wrap gap-4">
        <Input
          placeholder="Buscar prospectos..."
          className="max-w-xs"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
        />

        <Select
          value={estadoFilter}
          onValueChange={(val: string) => { setEstadoFilter(val); setCurrentPage(1) }}
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

        <Input
          placeholder="Filtrar por asesor..."
          list="asesores-filter-list"
          className="max-w-xs"
          value={asesorFilter}
          onChange={e => { setAsesorFilter(e.target.value); setCurrentPage(1) }}
        />
        <datalist id="asesores-filter-list">
          {asesores.map(a => (
            <option key={a.id} value={a.nombre} />
          ))}
        </datalist>

        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
        <Button
          variant="destructive"
          onClick={async () => {
            // Verifica que se haya seleccionado al menos un prospecto
            if (selectedIds.length === 0) {
              Swal.fire({
                icon: "warning",
                title: "Sin selección",
                text: "Debes seleccionar al menos un prospecto para eliminar.",
              });
              return;
            }
            // Muestra una confirmación antes de continuar
            const result = await Swal.fire({
              title: "¿Estás seguro?",
              text: `Se eliminarán ${selectedIds.length} prospectos de forma masiva.`,
              icon: "warning",
              showCancelButton: true,
              confirmButtonText: "Sí, eliminar",
              cancelButtonText: "Cancelar",
            });
            if (result.isConfirmed) {
              try {
                // Realiza las peticiones DELETE de forma paralela; si la API no tiene endpoint masivo, se envían individualmente.
                await Promise.all(
                  selectedIds.map(id =>
                    fetch(`${API_BASE_URL}/api/prospectos/${id}`, {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        Accept: "application/json",
                      },
                    })
                  )
                );
                // Actualiza el estado eliminando los prospectos borrados
                setProspectos(prev => prev.filter(p => !selectedIds.includes(p.id)));
                setSelectedIds([]); // Limpia la selección
                Swal.fire({
                  icon: "success",
                  title: "Eliminación exitosa",
                  text: "Los prospectos seleccionados se han eliminado correctamente.",
                });
              } catch (error) {
                console.error("Error eliminando prospectos:", error);
                Swal.fire({
                  icon: "error",
                  title: "Error inesperado",
                  text: "Ocurrió un problema al comunicarse con el servidor.",
                });
              }
            }
          }}
        >
          Eliminar seleccionados
        </Button>



        <Button
          variant="outline"
          onClick={async () => {
            if (selectedIds.length === 0) {
              Swal.fire({
                icon: "warning",
                title: "Sin selección",
                text: "Debes seleccionar al menos un prospecto para actualizar.",
              });
              return;
            }
            // Se muestra confirmación (opcional)
            const result = await Swal.fire({
              title: "¿Estás seguro?",
              text: `Se reasignará el asesor a ${selectedIds.length} prospectos.`,
              icon: "question",
              showCancelButton: true,
              confirmButtonText: "Sí, actualizar",
              cancelButtonText: "Cancelar",
            });
            if (result.isConfirmed) {
              // Aquí asignamos los IDs seleccionados al modo bulk y desplegamos el modal
              setBulkEditIds(selectedIds);
              // Aseguramos que se limpie la opción individual
              setActiveProspect(null);
              setEditOpen(true);
            }
          }}
        >
          Reasignar prospectos
        </Button>

      </div>

      {loading && <p className="p-4">Cargando prospectos…</p>}
      {error && <p className="p-4 text-red-500">{error}</p>}

      {/* TABLA */}
      <div className="overflow-x-auto p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedIds.length === prospectos.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Donde Labora</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Asesor</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProspectos.length > 0 ? (
              paginatedProspectos.map(p => (
                <TableRow key={p.id} className="hover:bg-gray-50">
                  <TableCell className="w-10">
                    <Checkbox
                      checked={selectedIds.includes(p.id)}
                      onCheckedChange={c => handleSelectOne(p.id, c as boolean)}
                    />
                  </TableCell>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>{p.telefono}</TableCell>
                  <TableCell>{p.departamento}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <Badge className={getEstadoColor(p.estado)}>
                        {p.estado}
                      </Badge>
                      <span className="text-xs text-gray-500 mt-1">
                        Últ. cambio: {p.ultimoCambio}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{p.asesor?.nombre ?? "Sin asignar"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdate(p.id)}>
                          Actualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(p.id)}>
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-4 text-center text-gray-500">
                  No se encontraron prospectos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex items-center justify-end gap-2 p-4">
        <Select
          value={pageSize}
          onValueChange={(val: string) => {
            setPageSize(val)
            setCurrentPage(1)
          }}
        >
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
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </>
        )}
      </div>

      {/* MODALES */}

      <EditProspectModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        prospect={
          bulkEditIds.length === 0
            ? activeProspect
              ? { id: activeProspect.id, asesor_id: activeProspect.asesor_id }
              : undefined
            : undefined
        }
        bulkIds={bulkEditIds.length > 0 ? bulkEditIds : undefined}
        asesores={asesores}
        onSaved={() => {
          Swal.fire({
            icon: "success",
            title: "Actualización exitosa",
            text: "Los prospectos se han actualizado correctamente.",
          }).then(() => {
            // Recarga la página
            window.location.reload();
          });
          // También puedes actualizar el estado en caso de que no quieras recargar:
          setEstadoFilter(f => f);
          setSelectedIds([]);
          setBulkEditIds([]);
        }}
      />

      <ConfirmDeleteModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          if (!activeProspect) return;

          try {
            const res = await fetch(
              `${API_BASE_URL}/api/prospectos/${activeProspect.id}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                  Accept: "application/json",
                },
              }
            );

            const json = await res.json();

            if (res.ok) {
              // 1) Actualiza el estado local para quitar el prospecto
              setProspectos(ps => ps.filter(p => p.id !== activeProspect.id));

              // 2) Muestra el éxito
              Swal.fire({
                icon: "success",
                title: "Eliminación exitosa",
                text: json.message || "El prospecto se ha eliminado correctamente.",
              });

              // 3) Cierra el modal
              setDeleteOpen(false);
            } else {
              // Muestra el error devuelto por la API
              Swal.fire({
                icon: "error",
                title: "Error",
                text: json.message || "No se pudo eliminar el prospecto.",
              });
            }
          } catch (error) {
            console.error("Error eliminando prospecto:", error);
            Swal.fire({
              icon: "error",
              title: "Error inesperado",
              text: "Ocurrió un problema al comunicarse con el servidor.",
            });
          }
        }}
        prospectName={activeProspect?.nombre ?? ""}
      />

    </div>
  )
}
