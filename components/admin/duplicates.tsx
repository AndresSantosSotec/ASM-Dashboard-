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
  const [statusFilter, setStatusFilter] = useState<"all"|"pending"|"resolved">("all")
  const [minSim, setMinSim] = useState<number>(80)
  const [sortDesc, setSortDesc] = useState<boolean>(true)
  const [pageSize, setPageSize] = useState<number>(5)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Trae todos los duplicados de golpe
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token") || ""
        const res = await fetch(`${API_URL}/duplicates?per_page=999999`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        // normalizamos camelCase
        const list: Duplicate[] = (json.data || []).map((row: any) => ({
          id: row.id,
          similarity_score: row.similarity_score,
          status: row.status,
          originalProspect: row.original_prospect,
          duplicateProspect: row.duplicate_prospect,
        }))
        setAllDups(list)
      } catch (err: any) {
        console.error(err)
        Swal.fire("Error", "No se pudieron cargar los duplicados.", "error")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
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
      // recargar todo
      const reload = await fetch(`${API_URL}/duplicates?per_page=999999`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const j = await reload.json()
      setAllDups((j.data || []).map((r: any) => ({
        id: r.id,
        similarity_score: r.similarity_score,
        status: r.status,
        originalProspect: r.original_prospect,
        duplicateProspect: r.duplicate_prospect,
      })))
      setCurrentPage(1)
    } catch (err: any) {
      console.error(err)
      Swal.fire("Error", "No se pudo detectar duplicados.", "error")
    } finally {
      setLoading(false)
    }
  }

  // 2) Acción sobre un duplicado
  const doAction = async (id: number, action: string) => {
    try {
      const token = localStorage.getItem("token") || ""
      const res = await fetch(`${API_URL}/duplicates/${id}/action`, {
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
      Swal.fire("¡Hecho!", "Operación completada.", "success")
      // recarga local: quitamos el duplicado resuelto
      setAllDups((prev) => prev.map(d =>
        d.id === id ? { ...d, status: "resolved" } : d
      ))
    } catch (err: any) {
      console.error(err)
      Swal.fire("Error", err.message, "error")
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

  return (
    <div className="space-y-6">
      <Card className="shadow">
        <CardHeader className="flex flex-wrap justify-between items-center gap-2">
          <CardTitle>Registros duplicados</CardTitle>

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
                                onClick={() => doAction(d.id,"keep_original")}
                              >Mantener original</Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => doAction(d.id,"keep_duplicate")}
                              >Mantener duplicado</Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => doAction(d.id,"delete_duplicate")}
                              >Eliminar duplicado</Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => doAction(d.id,"mark_reviewed")}
                              >Marcar revisado</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No se encontraron duplicados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
