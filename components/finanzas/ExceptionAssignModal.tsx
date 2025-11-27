// components/finanzas/ExceptionAssignModal.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Search, Loader2, Users, Calendar, FileText } from "lucide-react"
import { getProspectosInternos, assignCategoryBulk } from "@/services/finance"
import { toast } from "@/hooks/use-toast"
import { useExceptionCategories } from "@/hooks/useExceptionCategories"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface ExceptionAssignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: number
  categoryName: string
  onSuccess?: () => void
}

export function ExceptionAssignModal({
  open,
  onOpenChange,
  categoryId,
  categoryName,
  onSuccess,
}: ExceptionAssignModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [prospectos, setProspectos] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProspectos, setTotalProspectos] = useState(0)
  const [perPage] = useState(200)

  // Fechas de vigencia
  const [effectiveFrom, setEffectiveFrom] = useState<string>("")
  const [effectiveUntil, setEffectiveUntil] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  // Cargar prospectos
  const loadProspectos = async () => {
    setLoading(true)
    try {
      const response = await getProspectosInternos({
        per_page: perPage,
        page: currentPage,
        search: searchQuery || undefined,
      })
      
      setProspectos(response.data || [])
      setTotalPages(response.meta?.last_page || 1)
      setTotalProspectos(response.meta?.total || 0)
    } catch (error: any) {
      console.error("Error loading prospectos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los prospectos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadProspectos()
      // Reset form
      setSelectedIds(new Set())
      setEffectiveFrom("")
      setEffectiveUntil("")
      setNotes("")
    }
  }, [open, currentPage, searchQuery])

  // Filtrar prospectos localmente (por si la búsqueda del backend no funciona bien)
  const filteredProspectos = useMemo(() => {
    if (!searchQuery) return prospectos
    
    const query = searchQuery.toLowerCase()
    return prospectos.filter((p) => 
      p.nombre_completo?.toLowerCase().includes(query) ||
      p.carnet?.toLowerCase().includes(query) ||
      p.correo_electronico?.toLowerCase().includes(query)
    )
  }, [prospectos, searchQuery])

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProspectos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProspectos.map((p) => Number(p.id))))
    }
  }

  const handleAssign = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: "Sin selección",
        description: "Debe seleccionar al menos un prospecto",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await assignCategoryBulk(categoryId, {
        prospectos: Array.from(selectedIds),
        effective_from: effectiveFrom || null,
        effective_until: effectiveUntil || null,
        notes: notes || null,
      })

      toast({
        title: "Asignación exitosa",
        description: `Se asignó la categoría "${categoryName}" a ${selectedIds.size} prospecto(s)`,
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "No se pudo asignar la categoría",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar Categoría de Excepción</DialogTitle>
          <DialogDescription>
            Asignar "{categoryName}" a uno o más prospectos/estudiantes
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
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Información de selección */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{selectedIds.size}</span> de{" "}
              <span className="font-medium">{filteredProspectos.length}</span> prospectos seleccionados
            </div>
            <div>
              Total en sistema: <span className="font-medium">{totalProspectos}</span> prospectos
            </div>
          </div>

          {/* Tabla de prospectos */}
          <div className="border rounded-md max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={filteredProspectos.length > 0 && selectedIds.size === filteredProspectos.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Carnet</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Programa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredProspectos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No se encontraron prospectos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProspectos.map((prospecto) => (
                    <TableRow key={prospecto.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(Number(prospecto.id))}
                          onCheckedChange={() => toggleSelection(Number(prospecto.id))}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{prospecto.nombre_completo || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{prospecto.carnet || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>{prospecto.correo_electronico || "N/A"}</TableCell>
                      <TableCell>
                        {prospecto.programa?.nombre_del_programa || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
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

          <Separator />

          {/* Fechas de vigencia y notas */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effective-from">
                <Calendar className="inline h-4 w-4 mr-2" />
                Fecha de inicio (opcional)
              </Label>
              <Input
                id="effective-from"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Si no se especifica, la excepción será vigente desde ahora
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="effective-until">
                <Calendar className="inline h-4 w-4 mr-2" />
                Fecha de fin (opcional)
              </Label>
              <Input
                id="effective-until"
                type="date"
                value={effectiveUntil}
                onChange={(e) => setEffectiveUntil(e.target.value)}
                min={effectiveFrom || undefined}
              />
              <p className="text-xs text-muted-foreground">
                Si no se especifica, la excepción será permanente
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              <FileText className="inline h-4 w-4 mr-2" />
              Notas (opcional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Becados por convenio corporativo, Estudiantes con beca académica, etc."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Notas adicionales sobre por qué se asignó esta categoría
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={saving || selectedIds.size === 0}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Asignando...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Asignar a {selectedIds.size} prospecto{selectedIds.size !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

