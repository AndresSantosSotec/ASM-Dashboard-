"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { API_BASE_URL } from "@/utils/apiConfig"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"

interface Column {
  id: number
  name: string       // column_name
  excelName: string  // excel_column_name
  columnNumber: number
  state: string
}

interface MigrarEstudiantesProps {
  onImportSuccess?: () => void
}

export default function MigrarEstudiantes({ onImportSuccess }: MigrarEstudiantesProps) {
  const [file, setFile] = useState<File | null>(null)
  const [showStructure, setShowStructure] = useState(false)
  const [columns, setColumns] = useState<Column[]>([])
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Carga la configuración de columnas del backend
  const fetchColumns = () => {
    fetch(`${API_BASE_URL}/api/columns`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        return res.json()
      })
      .then(data => {
        const fetched = Object.values(data.data).map((col: any) => ({
          id: col.id,
          name: col.column_name,
          excelName: col.excel_column_name,
          columnNumber: Number(col.column_number),
          state: col.status,
        }))
        setColumns(fetched)
      })
      .catch(error => {
        console.error("Error fetching columns:", error)
        Swal.fire({ icon: "error", title: "Error de carga", text: error.message })
        toast({ title: "Error", description: "No se pudieron cargar las columnas", variant: "destructive" })
      })
  }

  useEffect(() => {
    fetchColumns()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column)
  }

  const handleAddColumn = () => {
    setEditingColumn({ id: 0, name: "", excelName: "", columnNumber: 0, state: "Activo" })
  }

  const handleSaveColumn = () => {
    if (!editingColumn) return
    const payload = {
      columnName: editingColumn.name,
      excelColumnName: editingColumn.excelName,
      columnNumber: editingColumn.columnNumber,
    }
    const url = editingColumn.id === 0
      ? `${API_BASE_URL}/api/columns`
      : `${API_BASE_URL}/api/columns/${editingColumn.id}`
    const method = editingColumn.id === 0 ? 'POST' : 'PUT'

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        return res.json()
      })
      .then(() => {
        Swal.fire({ icon: "success", title: editingColumn.id === 0 ? "Columna creada" : "Columna actualizada" })
        toast({ title: "Éxito", description: "Configuración guardada" })
        fetchColumns()
      })
      .catch(error => {
        console.error("Error saving column:", error)
        Swal.fire({ icon: "error", title: "Error", text: error.message })
        toast({ title: "Error", description: "No se pudo guardar la configuración", variant: "destructive" })
      })
      .finally(() => setEditingColumn(null))
  }

  const handleImport = (confirm: boolean = false) => {
    if (!file) {
      Swal.fire({ icon: "error", title: "Error", text: "Selecciona un archivo" })
      toast({ title: "Error", description: "Selecciona un archivo para importar", variant: "destructive" })
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    if (confirm) formData.append("confirm", "true")
    const token = localStorage.getItem("token")

    fetch(`${API_BASE_URL}/api/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        return res.json()
      })
      .then(data => {
        // Manejo de duplicados
        if (data.status === 'duplicates' && !confirm) {
          const list = data.duplicates.map((d: any) => `<li>${d.key}: ${d.count}</li>`).join('')
          Swal.fire({
            icon: 'warning',
            title: 'Duplicados encontrados',
            html: `<ul style="text-align:left;">${list}</ul>`,
            confirmButtonText: 'Entendido',
          })
          return
        }
        Swal.fire({ icon: "success", title: "Importación completada" })
        toast({ title: "Éxito", description: data.message })
        if (onImportSuccess) onImportSuccess()
        router.refresh()
      })
      .catch(error => {
        console.error("Error en import:", error)
        Swal.fire({ icon: "error", title: "Error en la importación", text: error.message })
        toast({ title: "Error", description: "No se pudieron importar los datos", variant: "destructive" })
      })
  }

  const handleSaveConfiguration = () => {
    Swal.fire({ icon: "success", title: "Configuración guardada" })
    toast({ title: "Éxito", description: "Configuración guardada correctamente" })
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Importar Estudiantes</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/")}>          
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Archivo CSV o Excel</label>
          <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
        </div>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={() => setShowStructure(!showStructure)}>
            {showStructure ? "Ocultar Estructura" : "Mostrar Estructura"}
          </Button>
          <Button onClick={() => handleImport()}>Importar Estudiantes</Button>
        </div>
      </div>

      {showStructure && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Estructura esperada</h2>
            <div className="flex gap-4">
              <Button onClick={handleAddColumn}>Agregar Columna</Button>
              <Button onClick={handleSaveConfiguration}>Guardar Configuración</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Excel</th>
                  <th className="px-4 py-2 text-left"># Columna</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((col, idx) => (
                  <tr key={col.id || idx} className="border-b odd:bg-white even:bg-gray-100">
                    <td className="px-4 py-2">{idx + 1}</td>
                    <td className="px-4 py-2">{col.name}</td>
                    <td className="px-4 py-2">{col.excelName}</td>
                    <td className="px-4 py-2">{col.columnNumber}</td>
                    <td className="px-4 py-2">{col.state}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" onClick={() => handleEditColumn(col)}>Editar</Button>
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
            <DialogTitle>{editingColumn?.id === 0 ? "Agregar Columna" : "Editar Columna"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ID</label>
              <Input value={editingColumn?.id || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={editingColumn?.name || ''}
                onChange={e => editingColumn && setEditingColumn({ ...editingColumn, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Excel</label>
              <Input
                value={editingColumn?.excelName || ''}
                onChange={e => editingColumn && setEditingColumn({ ...editingColumn, excelName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Número</label>
              <Input
                type="number"
                value={editingColumn?.columnNumber || ''}
                onChange={e => editingColumn && setEditingColumn({ ...editingColumn, columnNumber: parseInt(e.target.value, 10) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingColumn(null)}>Cancelar</Button>
            <Button onClick={handleSaveColumn}>{editingColumn?.id === 0 ? "Crear" : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
