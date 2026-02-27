// components/Duplicates.tsx
"use client"
import React, { useEffect, useMemo, useState } from "react"
import Swal from "sweetalert2"
import { RefreshCw } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/utils/apiConfig"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

const API_URL = `${API_BASE_URL}/api`

interface Prospect {
  id: number
  nombre_completo: string
  correo_electronico: string
  telefono: string
  updated_at?: string
}

interface Duplicate {
  id: number
  similarity_score: number
  status: "pending" | "resolved"
  originalProspect: Prospect
  duplicateProspect: Prospect
}

export default function Duplicates() {
  const [allDups, setAllDups] = useState<Duplicate[]>([])
  const [loading, setLoading] = useState(false)

  // filtros UI
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved">("all")
  const [minSim, setMinSim] = useState<number>(80)
  const [sortDesc, setSortDesc] = useState<boolean>(true)
  const [pageSize, setPageSize] = useState<number>(5)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedIds, setSelectedIds] = useState<number[]>([])


  const fetchDuplicates = async () => {
    const token = localStorage.getItem("token") || ""
    const res = await fetch(`${API_URL}/duplicates?per_page=999999`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const j = await res.json()
    setAllDups((j.data || []).map((r: any) => ({
      id: r.id,
      similarity_score: r.similarity_score,
      status: r.status,
      originalProspect: r.original_prospect,
      duplicateProspect: r.duplicate_prospect,
    })))
  }


  // Trae y detecta duplicados al entrar
  useEffect(() => {
    detectDuplicates()
  }, [])

  // 1) Detección en servidor
  const detectDuplicates = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token") || ""
      const res = await fetch(`${API_URL}/duplicates/detect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await res.json()
      Swal.fire("¡Hecho!", "Detección completada.", "success")
      await fetchDuplicates()
      setCurrentPage(1)
    } catch (err: any) {
      console.error(err)
      Swal.fire("Error", "No se pudo detectar duplicados.", "error")
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const ids = filtered.map(d => d.id)
    const allSelected = ids.every(id => selectedIds.includes(id))
    setSelectedIds(allSelected ? [] : ids)
  }

  const doBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return

    let dupsToDelete: Prospect[] = [];
    if (action === "keep_original" || action === "delete_duplicate") {
      dupsToDelete = allDups.filter(d => selectedIds.includes(d.id)).map(d => d.duplicateProspect);
    } else if (action === "keep_duplicate") {
      dupsToDelete = allDups.filter(d => selectedIds.includes(d.id)).map(d => d.originalProspect);
    }

    if (dupsToDelete.length > 0) {
      const listHtml = dupsToDelete.slice(0, 5).map(p => `<li>${p.nombre_completo}</li>`).join('');
      const moreHtml = dupsToDelete.length > 5 ? `<li class="text-gray-500">... y ${dupsToDelete.length - 5} más</li>` : '';

      const confirm = await Swal.fire({
        title: `¿Eliminar ${dupsToDelete.length} prospectos?`,
        html: `Se eliminarán permanentemente los siguientes prospectos y sus registros:<br/>
               <ul class="text-left mt-2 mb-2 bg-gray-50 p-3 rounded text-sm">${listHtml}${moreHtml}</ul>
               ¿Deseas continuar?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });
      if (!confirm.isConfirmed) return;
    }

    setLoading(true)
    try {

      const token = localStorage.getItem("token") || ""
      const res = await fetch(`${API_URL}/duplicates/bulk-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds, action }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || `HTTP ${res.status}`)
      }

      await fetchDuplicates()
      setCurrentPage(1)


      Swal.fire("¡Hecho!", "Operación completada.", "success")
      setSelectedIds([])
    } finally {
      setLoading(false)
    }
  }

  // 🔥 NUEVA FUNCIÓN: Eliminar TODOS los duplicados pendientes
  const deleteAllDuplicates = async () => {
    const pendingCount = allDups.filter(d => d.status === 'pending').length;
    
    if (pendingCount === 0) {
      Swal.fire("Sin duplicados", "No hay duplicados pendientes para eliminar.", "info");
      return;
    }

    // Confirmación paso 1: Advertencia general
    const confirm1 = await Swal.fire({
      title: `⚠️ ADVERTENCIA CRÍTICA`,
      html: `
        <div class="text-left space-y-3">
          <p class="font-bold text-red-600">Esta acción es IRREVERSIBLE</p>
          <p>Se eliminarán <strong>${pendingCount} prospectos duplicados</strong> y TODOS sus registros relacionados:</p>
          <ul class="list-disc pl-5 text-sm bg-red-50 p-3 rounded">
            <li>Cuotas de pago</li>
            <li>Programas inscritos (estudiante_programa)</li>
            <li>Documentos adjuntos</li>
            <li>Relaciones con cursos</li>
            <li>Registros de duplicados</li>
          </ul>
          <p class="text-sm text-gray-600 mt-3">Se mantendrá ÚNICAMENTE el registro original en cada caso.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      width: 600
    });

    if (!confirm1.isConfirmed) return;

    // Confirmación paso 2: Escribir para confirmar
    const confirm2 = await Swal.fire({
      title: 'Confirmación final',
      html: `
        <p class="mb-4">Escribe <strong class="text-red-600">ELIMINAR TODO</strong> para confirmar:</p>
        <input id="confirm-input" type="text" class="swal2-input" placeholder="ELIMINAR TODO" style="text-transform: uppercase;">
      `,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ejecutar eliminación',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const input = (document.getElementById('confirm-input') as HTMLInputElement)?.value?.toUpperCase();
        if (input !== 'ELIMINAR TODO') {
          Swal.showValidationMessage('Debes escribir exactamente "ELIMINAR TODO"');
          return false;
        }
        return true;
      }
    });

    if (!confirm2.isConfirmed) return;

    // Ejecutar eliminación
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/duplicates/delete-all-duplicates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();

      await fetchDuplicates();
      setCurrentPage(1);
      setSelectedIds([]);

      Swal.fire({
        icon: "success",
        title: "✅ Eliminación masiva completada",
        html: `
          <p class="text-lg font-bold text-green-600">${data.deleted} duplicados eliminados</p>
          <p class="text-sm text-gray-600 mt-2">Los registros originales se han mantenido intactos.</p>
        `,
        confirmButtonText: "Entendido"
      });
    } catch (error: any) {
      console.error("Error eliminando duplicados:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo completar la eliminación masiva",
      });
    } finally {
      setLoading(false);
    }
  };

  // Seleccionar todos los de la página actual
  const selectCurrentPage = () => {
    const pageIds = paginated.map(d => d.id);
    setSelectedIds(prev => {
      const newSet = new Set([...prev, ...pageIds]);
      return Array.from(newSet);
    });
  };

  // Deseleccionar todos
  const clearSelection = () => {
    setSelectedIds([]);
  };

  // 2) Acción sobre un duplicado
  const doAction = async (d: Duplicate, action: string, silent = false) => {
    // Determine what is being deleted
    let toDelete = null;
    let actionText = "";
    if (action === "keep_original" || action === "delete_duplicate") {
      toDelete = d.duplicateProspect;
      actionText = "el duplicado";
    } else if (action === "keep_duplicate") {
      toDelete = d.originalProspect;
      actionText = "el original";
    }

    if (toDelete) {
      const confirm = await Swal.fire({
        title: `¿Eliminar ${actionText}?`,
        html: `Se eliminará PERMANENTEMENTE el siguiente prospecto y sus registros relacionados:<br/><br/>
               <b>Nombre:</b> ${toDelete.nombre_completo}<br/>
               <b>Email:</b> ${toDelete.correo_electronico || 'N/A'}<br/>
               <b>Teléfono:</b> ${toDelete.telefono || 'N/A'}<br/><br/>
               ¿Deseas continuar?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });
      if (!confirm.isConfirmed) return;
    }

    try {
      const token = localStorage.getItem("token") || ""
      const res = await fetch(`${API_URL}/duplicates/${d.id}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || `HTTP ${res.status}`)
      }
      if (!silent) {
        Swal.fire("¡Hecho!", "Operación completada.", "success")
      }

      await fetchDuplicates()
      setCurrentPage(1)
    } catch (err: any) {
      console.error(err)
      if (!silent) {
        Swal.fire("Error", err.message, "error")
      }
    }
  }

  // 3) Aplicamos TODOS los filtros / orden / búsqueda
  const filtered = useMemo(() => {
    return allDups
      .filter(d =>
        statusFilter === "all" || d.status === statusFilter
      )
      .filter(d => d.similarity_score >= minSim)
      .filter(d => {
        if (!searchTerm) return true
        const term = searchTerm.toLowerCase()
        return (
          d.originalProspect.nombre_completo.toLowerCase().includes(term) ||
          d.originalProspect.correo_electronico.toLowerCase().includes(term) ||
          d.duplicateProspect.nombre_completo.toLowerCase().includes(term) ||
          d.duplicateProspect.correo_electronico.toLowerCase().includes(term)
        )
      })
  }, [allDups, statusFilter, minSim, searchTerm])

  // 4) ordenamos
  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => sortDesc
      ? b.similarity_score - a.similarity_score
      : a.similarity_score - b.similarity_score
    )
    return arr
  }, [filtered, sortDesc])

  // 5) paginamos
  const totalPages = useMemo(() => (
    pageSize === 0
      ? 1
      : Math.max(1, Math.ceil(sorted.length / pageSize))
  ), [sorted.length, pageSize])

  const paginated = useMemo(() => {
    if (pageSize === 0) return sorted
    const start = (currentPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, pageSize, currentPage])

  // Estadísticas
  const totalDuplicates = allDups.length;
  const pendingDuplicates = allDups.filter(d => d.status === 'pending').length;
  const resolvedDuplicates = allDups.filter(d => d.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Panel de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{totalDuplicates}</div>
            <p className="text-xs text-muted-foreground">Total duplicados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{pendingDuplicates}</div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{resolvedDuplicates}</div>
            <p className="text-xs text-muted-foreground">Resueltos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{filtered.length}</div>
            <p className="text-xs text-muted-foreground">Filtrados</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow">
        <CardHeader className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <CardTitle>Registros duplicados</CardTitle>
            {pendingDuplicates > 0 && (
              <Badge variant="destructive" className="text-xs">
                {pendingDuplicates} pendientes
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Buscador libre */}
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />

            {/* Estado */}
            <Select
              value={statusFilter}
              onValueChange={v => {
                setStatusFilter(v as any)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="resolved">Resuelto</SelectItem>
              </SelectContent>
            </Select>

            {/* Umbral mínimo */}
            <Select
              value={String(minSim)}
              onValueChange={v => {
                setMinSim(Number(v))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Sim≥" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="80">≥ 80%</SelectItem>
                <SelectItem value="90">≥ 90%</SelectItem>
                <SelectItem value="95">≥ 95%</SelectItem>
              </SelectContent>
            </Select>

            {/* Orden */}
            <Select
              value={sortDesc ? "desc" : "asc"}
              onValueChange={v => setSortDesc(v === "desc")}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Sim ▼</SelectItem>
                <SelectItem value="asc">Sim ▲</SelectItem>
              </SelectContent>
            </Select>

            {/* Filas por página */}
            <Select
              value={String(pageSize)}
              onValueChange={v => {
                const n = v === "all" ? 0 : Number(v)
                setPageSize(n)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Filas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>

            {/* Detectar */}
            <Button variant="outline" onClick={detectDuplicates} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" /> Buscar duplicados
            </Button>

            {/* Botón de eliminación masiva total */}
            {pendingDuplicates > 0 && (
              <Button 
                variant="destructive" 
                onClick={deleteAllDuplicates} 
                disabled={loading}
                className="border-2 border-red-600 font-bold"
              >
                🗑️ Eliminar TODOS ({pendingDuplicates})
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <p className="p-4">Cargando…</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-4 text-center">
                        <input
                          type="checkbox"
                          onChange={toggleSelectAll}
                          checked={filtered.length > 0 && filtered.every(d => selectedIds.includes(d.id))}
                        />
                      </TableHead>
                      <TableHead>Original</TableHead>
                      <TableHead>Duplicado</TableHead>
                      <TableHead>Similitud</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginated.map(d => {
                      const o = d.originalProspect
                      const u = d.duplicateProspect
                      return (
                        <TableRow key={d.id} className="hover:bg-gray-50">
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(d.id)}
                              onChange={() => toggleSelect(d.id)}
                            />
                          </TableCell>
                          <TableCell>
                            {o?.id ? (
                              <div className="space-y-1">
                                <div className="font-medium">{o.nombre_completo}</div>
                                <div className="text-xs text-gray-500">{o.correo_electronico}</div>
                                <div className="text-xs text-gray-500">{o.telefono}</div>
                                {!!o.updated_at && (
                                  <div className="text-xs text-gray-500">
                                    Últ. act.: {new Date(o.updated_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : <em className="text-xs text-gray-500">—</em>}
                          </TableCell>
                          <TableCell>
                            {u?.id ? (
                              <div className="space-y-1">
                                <div className="font-medium">{u.nombre_completo}</div>
                                <div className="text-xs text-gray-500">{u.correo_electronico}</div>
                                <div className="text-xs text-gray-500">{u.telefono}</div>
                                {!!u.updated_at && (
                                  <div className="text-xs text-gray-500">
                                    Últ. act.: {new Date(u.updated_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : <em className="text-xs text-gray-500">—</em>}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={d.similarity_score >= 90
                                ? "destructive"
                                : d.similarity_score >= 80
                                  ? "secondary"
                                  : "outline"
                              }
                              className="min-w-[50px] text-center"
                            >
                              {d.similarity_score}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {d.status === "pending" ? "Pendiente" : "Resuelto"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="grid gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => doAction(d, "keep_original")}
                              >Mantener original</Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => doAction(d, "keep_duplicate")}
                              >Mantener duplicado</Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => doAction(d, "delete_duplicate")}
                              >Eliminar duplicado</Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => doAction(d, "mark_reviewed")}
                              >Marcar revisado</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No se encontraron duplicados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Barra de acciones masivas */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-gray-50 border-t">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedIds.length > 0 ? (
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {selectedIds.length} seleccionados
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Ninguno seleccionado</span>
                    )}
                  </span>
                  
                  {/* Botones de selección */}
                  <div className="flex gap-1 ml-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={selectCurrentPage}
                      disabled={paginated.length === 0}
                      title="Seleccionar todos los de esta página"
                    >
                      Seleccionar página
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={toggleSelectAll}
                      disabled={filtered.length === 0}
                      title="Seleccionar/deseleccionar todos los filtrados"
                    >
                      {filtered.length > 0 && filtered.every(d => selectedIds.includes(d.id)) ? 'Deseleccionar' : 'Seleccionar'} filtrados ({filtered.length})
                    </Button>
                    {selectedIds.length > 0 && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={clearSelection}
                        title="Limpiar selección"
                      >
                        ✕ Limpiar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Acciones masivas */}
                {selectedIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => doBulkAction('keep_original')}>
                      ✓ Mantener originales
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => doBulkAction('keep_duplicate')}>
                      Mantener duplicados
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => doBulkAction('delete_duplicate')}>
                      🗑️ Eliminar duplicados
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => doBulkAction('mark_reviewed')}>
                      👁️ Marcar revisados
                    </Button>
                  </div>
                )}
              </div>

              {/* Paginación */}
              {pageSize !== 0 && (
                <div className="flex justify-end items-center gap-2 p-4">
                  <Button
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >Anterior</Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >Siguiente</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
