"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

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

export default function ImportarLeadsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState<string>("")
  const [showStructure, setShowStructure] = useState(false)
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column)
  }

  const handleSaveColumn = () => {
    if (editingColumn) {
      setColumns(columns.map((col) => (col.id === editingColumn.id ? editingColumn : col)))
      setEditingColumn(null)
      toast({
        title: "Columna actualizada",
        description: "Los cambios han sido guardados correctamente",
      })
    }
  }

  const handleImport = () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor seleccione un archivo para importar",
        variant: "destructive",
      })
      return
    }

    if (!source) {
      toast({
        title: "Error",
        description: "Por favor seleccione una fuente de leads",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Importación exitosa",
      description: "Los leads han sido importados correctamente",
    })
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Importar Leads</h1>
          <Button variant="outline" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </div>

        <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Archivo CSV o Excel</label>
              <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fuente de Leads</label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione la fuente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Formulario Web</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="referral">Referidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={() => setShowStructure(!showStructure)}>
                {showStructure ? "Ocultar Estructura" : "Mostrar Estructura"}
              </Button>
              <Button onClick={handleImport}>Importar Leads</Button>
            </div>
          </div>
        </div>

        {showStructure && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Estructura esperada</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Nombre de la columna</th>
                    <th className="px-4 py-2 text-left">No. de Columna</th>
                    <th className="px-4 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map((column) => (
                    <tr key={column.id} className="border-b">
                      <td className="px-4 py-2">{column.id}</td>
                      <td className="px-4 py-2">{column.name}</td>
                      <td className="px-4 py-2">{column.columnNumber}</td>
                      <td className="px-4 py-2 text-right">
                        <Button size="sm" onClick={() => handleEditColumn(column)}>
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Dialog open={!!editingColumn} onOpenChange={() => setEditingColumn(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Columna</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingColumn(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveColumn}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

