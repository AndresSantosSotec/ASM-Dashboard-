"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft } from "lucide-react"

interface Column {
  id: number
  name: string
  columnNumber: number
}

const initialColumns: Column[] = [
  { id: 1, name: "Nombre", columnNumber: 1 },
  { id: 2, name: "Teléfono", columnNumber: 2 },
  { id: 3, name: "Correo", columnNumber: 3 },
  { id: 4, name: "Empresa donde labora", columnNumber: 4 },
  { id: 5, name: "Puesto", columnNumber: 5 },
  { id: 6, name: "Notas generales", columnNumber: 6 },
  { id: 7, name: "Observaciones", columnNumber: 7 },
  { id: 8, name: "Interés", columnNumber: 8 },
  { id: 9, name: "Status", columnNumber: 9 },
  { id: 10, name: "Nota 1", columnNumber: 10 },
  { id: 11, name: "Nota 2", columnNumber: 11 },
  { id: 12, name: "Nota 3", columnNumber: 12 },
  { id: 13, name: "Cierre", columnNumber: 13 },
]

interface EstructuraLeadsProps {
  onImport?: () => void
}

export default function EstructuraLeads({ onImport }: EstructuraLeadsProps) {
  const [showStructure, setShowStructure] = useState(false)
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column)
  }

  const handleSaveColumn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingColumn) return

    setColumns(columns.map((col) => (col.id === editingColumn.id ? editingColumn : col)))
    setEditingColumn(null)
  }

  const handleImportClick = () => {
    if (onImport) {
      onImport()
    }
  }

  if (!showStructure) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setShowStructure(true)}>
          Mostrar Estructura
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Estructura esperada</h2>
        <Button variant="ghost" onClick={() => setShowStructure(false)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead>Nombre de la columna</TableHead>
              <TableHead>No. de Columna</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {columns.map((column) => (
              <TableRow key={column.id}>
                <TableCell>{column.id}</TableCell>
                <TableCell>{column.name}</TableCell>
                <TableCell>{column.columnNumber}</TableCell>
                <TableCell className="text-right">
                  <Button variant="default" size="sm" onClick={() => handleEditColumn(column)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleImportClick}>
        Importar Leads
      </Button>

      <Dialog open={!!editingColumn} onOpenChange={() => setEditingColumn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Columna</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveColumn} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Columna</label>
              <Input value={editingColumn?.id || ""} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre de Columna</label>
              <Input
                value={editingColumn?.name || ""}
                onChange={(e) =>
                  setEditingColumn(
                    editingColumn
                      ? {
                          ...editingColumn,
                          name: e.target.value,
                        }
                      : null,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">No. de Columna</label>
              <Input
                type="number"
                value={editingColumn?.columnNumber || ""}
                onChange={(e) =>
                  setEditingColumn(
                    editingColumn
                      ? {
                          ...editingColumn,
                          columnNumber: Number.parseInt(e.target.value),
                        }
                      : null,
                  )
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingColumn(null)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

