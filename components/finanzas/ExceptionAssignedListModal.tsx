// components/finanzas/ExceptionAssignedListModal.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, X, Calendar, FileText } from "lucide-react"
import { getAssignedProspectos, removeCategoryFromProspecto } from "@/services/finance"
import { toast } from "@/hooks/use-toast"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface ExceptionAssignedListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: number
  categoryName: string
  onSuccess?: () => void
}

export function ExceptionAssignedListModal({
  open,
  onOpenChange,
  categoryId,
  categoryName,
}: ExceptionAssignedListModalProps) {
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState<number | null>(null)
  const [assigned, setAssigned] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(50)

  const loadAssigned = async () => {
    setLoading(true)
    try {
      const data = await getAssignedProspectos(categoryId)
      setAssigned(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error("Error loading assigned prospectos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los prospectos asignados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadAssigned()
      setSearchQuery("")
      setCurrentPage(1)
    }
  }, [open, categoryId])

  // Filtrar por búsqueda
  const filtered = assigned.filter((p) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      p.nombre_completo?.toLowerCase().includes(query) ||
      p.carnet?.toLowerCase().includes(query) ||
      p.correo_electronico?.toLowerCase().includes(query)
    )
  })

  // Paginación local
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const handleRemove = async (prospectoId: number) => {
    if (!confirm(`¿Está seguro de remover la categoría "${categoryName}" de este prospecto?`)) {
      return
    }

    setRemoving(prospectoId)
    try {
      await removeCategoryFromProspecto(categoryId, prospectoId)
      toast({
        title: "Categoría removida",
        description: "La categoría fue removida exitosamente",
      })
      await loadAssigned()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "No se pudo remover la categoría",
        variant: "destructive",
      })
    } finally {
      setRemoving(null)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Permanente"
    try {
      return new Date(dateString).toLocaleDateString("es-GT", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const isActive = (assignment: any) => {
    if (!assignment) return false
    const now = new Date()
    const from = assignment.effective_from ? new Date(assignment.effective_from) : null
    const until = assignment.effective_until ? new Date(assignment.effective_until) : null

    const validFrom = !from || from <= now
    const validUntil = !until || until >= now

    return validFrom && validUntil
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prospectos con Categoría "{categoryName}"</DialogTitle>
          <DialogDescription>
            Lista de todos los prospectos/estudiantes que tienen asignada esta categoría de excepción
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por nombre, carnet o correo..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>

          {/* Estadísticas */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{filtered.length}</span> prospecto{filtered.length !== 1 ? "s" : ""}{" "}
              {searchQuery && `encontrado${filtered.length !== 1 ? "s" : ""}`}
              {!searchQuery && "asignado" + (filtered.length !== 1 ? "s" : "")}
            </div>
            <div>
              Total: <span className="font-medium">{assigned.length}</span> asignación{assigned.length !== 1 ? "es" : ""}
            </div>
          </div>

          {/* Tabla */}
          <div className="border rounded-md max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Carnet</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Vigencia desde</TableHead>
                  <TableHead>Vigencia hasta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No se encontraron resultados" : "No hay prospectos asignados a esta categoría"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((prospecto: any) => {
                    const assignment = prospecto.assignment || {}
                    const active = isActive(assignment)

                    return (
                      <TableRow key={prospecto.id}>
                        <TableCell className="font-medium">{prospecto.nombre_completo || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{prospecto.carnet || "N/A"}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {prospecto.correo_electronico || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {assignment.effective_from ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatDate(assignment.effective_from)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Desde siempre</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {assignment.effective_until ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatDate(assignment.effective_until)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Permanente</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={active ? "default" : "outline"}>
                            {active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {assignment.notes || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(prospecto.id)}
                            disabled={removing === prospecto.id}
                            className="text-red-600 hover:text-red-800"
                          >
                            {removing === prospecto.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink isActive>
                    Página {currentPage} de {totalPages}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

