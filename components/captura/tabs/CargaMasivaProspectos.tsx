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
import { ArrowLeft, Download, Plus, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { API_BASE_URL } from "@/utils/apiConfig"
import { Badge } from "@/components/ui/badge"
import { downloadExcelTemplate } from "@/lib/excel-template-generator"

interface Column {
  id: number
  name: string
  excelName: string
  columnNumber: number
  state: string
}

interface AvailableColumn {
  column_name: string
  display_name: string
  is_configured: boolean
  excel_column_name: string
  column_number: number | null
  config_id: number | null
  data_type: string
}

interface CargaMasivaProspectosProps {
  onImportSuccess?: () => void
}

export default function CargaMasivaProspectos({ onImportSuccess }: CargaMasivaProspectosProps) {
  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState<string>("")
  const [showStructure, setShowStructure] = useState(false)
  const [showAvailableColumns, setShowAvailableColumns] = useState(false)
  const [columns, setColumns] = useState<Column[]>([])
  const [availableColumns, setAvailableColumns] = useState<AvailableColumn[]>([])
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)
  const [selectedDbColumn, setSelectedDbColumn] = useState<string>("")
  const [searchFilter, setSearchFilter] = useState("")
  const [searchAvailableFilter, setSearchAvailableFilter] = useState("")
  
  // Estados para crear columna
  const [showCreateColumnDialog, setShowCreateColumnDialog] = useState(false)
  const [newColumnData, setNewColumnData] = useState({
    columnName: "",
    dataType: "string",
    length: 255,
    nullable: true,
    defaultValue: ""
  })
  
  // Estados para eliminar columna
  const [showDeleteColumnDialog, setShowDeleteColumnDialog] = useState(false)
  const [columnToDelete, setColumnToDelete] = useState<AvailableColumn | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  
  const { toast } = useToast()
  const router = useRouter()

  // Función para recargar las columnas desde el backend.
  const fetchColumns = () => {
    fetch(`${API_BASE_URL}/api/columns`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const fetchedColumns = Object.values(data.data).map((col: any) => ({
          id: col.id || 0,
          name: col.column_name,
          excelName: col.excel_column_name,
          columnNumber: Number(col.column_number),
          state: col.status,
        }))
        setColumns(fetchedColumns)
      })
      .catch((error) => {
        console.error("Error fetching columns:", error)
        Swal.fire({
          icon: "error",
          title: "Error de carga",
          text: "No se pudieron obtener las columnas configuradas. Detalle: " + error.message,
        })
        toast({
          title: "Error",
          description: "No se pudieron obtener las columnas configuradas.",
          variant: "destructive",
        })
      })
  }

  useEffect(() => {
    fetchColumns()
    fetchAvailableColumns()
  }, [toast])

  // Función para obtener columnas disponibles de la tabla prospectos
  const fetchAvailableColumns = () => {
    fetch(`${API_BASE_URL}/api/columns/available`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setAvailableColumns(data.data || [])
      })
      .catch((error) => {
        console.error("Error fetching available columns:", error)
      })
  }

  // Función para obtener el próximo número de columna disponible
  const getNextColumnNumber = (): number => {
    if (columns.length === 0) return 1
    const maxNumber = Math.max(...columns.map(col => col.columnNumber || 0))
    return maxNumber + 1
  }

  // Manejo de cambio de archivo.
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  // Abre el diálogo para editar una columna.
  const handleEditColumn = (column: Column) => {
    setEditingColumn(column)
  }

  // Abre el diálogo para agregar una nueva columna (estado "Activo" por defecto).
  const handleAddColumn = () => {
    setSelectedDbColumn("")
    const nextNumber = getNextColumnNumber()
    setEditingColumn({
      id: 0,
      name: "",
      excelName: "",
      columnNumber: nextNumber,
      state: "Activo",
    })
  }

  // Guarda los cambios en la columna (POST para nueva, PUT para existente)
  const handleSaveColumn = () => {
    if (!editingColumn) return
    
    if (!editingColumn.name) {
      toast({ title: "Error", description: "Debe seleccionar un campo de base de datos", variant: "destructive" })
      return
    }
    if (!editingColumn.excelName.trim()) {
      toast({ title: "Error", description: "El nombre en Excel es requerido", variant: "destructive" })
      return
    }

    const payload = {
      columnName: editingColumn.name,
      excelColumnName: editingColumn.excelName,
      columnNumber: editingColumn.columnNumber,
    }

    if (editingColumn.id === 0) {
      fetch(`${API_BASE_URL}/api/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
          return res.json()
        })
        .then(() => {
          Swal.fire({ icon: "success", title: "Mapeo creado", text: "La configuración se guardó correctamente", timer: 2000 })
          fetchColumns()
          fetchAvailableColumns()
        })
        .catch((error) => {
          console.error("Error saving column:", error)
          Swal.fire({
            icon: "error",
            title: "Error al guardar",
            text: "No se pudo guardar la configuración. Detalle: " + error.message,
          })
          toast({
            title: "Error",
            description: "No se pudo guardar la configuración",
            variant: "destructive",
          })
        })
    } else {
      fetch(`${API_BASE_URL}/api/columns/${editingColumn.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
          return res.json()
        })
        .then(() => {
          Swal.fire({ icon: "success", title: "Mapeo actualizado", text: "La configuración se actualizó correctamente", timer: 2000 })
          fetchColumns()
          fetchAvailableColumns()
        })
        .catch((error) => {
          console.error("Error updating column:", error)
          Swal.fire({
            icon: "error",
            title: "Error al actualizar",
            text: "No se pudo actualizar la configuración. Detalle: " + error.message,
          })
          toast({
            title: "Error",
            description: "No se pudo actualizar la configuración",
            variant: "destructive",
          })
        })
    }
    setEditingColumn(null)
    setSelectedDbColumn("")
  }

  // Eliminar parametrización de columna (mapeo)
  const handleDeleteMapping = async (columnId: number, columnName: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar mapeo?',
      html: `<p>Se eliminará la parametrización de la columna <strong>${columnName}</strong></p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar mapeo',
      cancelButtonText: 'Cancelar'
    })
    if (!result.isConfirmed) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/columns/${columnId}`, { method: "DELETE" })
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
      Swal.fire({ icon: "success", title: "Mapeo eliminado", timer: 2000 })
      fetchColumns()
      fetchAvailableColumns()
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Error al eliminar", text: error.message })
    }
  }

  // Crear columna en la tabla prospectos
  const handleOpenCreateColumn = () => {
    setNewColumnData({ columnName: "", dataType: "string", length: 255, nullable: true, defaultValue: "" })
    setShowCreateColumnDialog(true)
  }

  const handleCreateColumn = async () => {
    if (!newColumnData.columnName.trim() || newColumnData.columnName.length < 3) return
    if (!/^[a-z_]+$/.test(newColumnData.columnName) || newColumnData.columnName.endsWith('_')) return

    const result = await Swal.fire({
      title: '¿Crear nueva columna en BD?',
      html: `<p><strong>Columna:</strong> ${newColumnData.columnName}</p><p><strong>Tipo:</strong> ${newColumnData.dataType}</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear columna',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return

    Swal.fire({ title: 'Creando columna...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } })

    try {
      const payload: any = { columnName: newColumnData.columnName, dataType: newColumnData.dataType, nullable: newColumnData.nullable }
      if (newColumnData.dataType === "string" && newColumnData.length) payload.length = newColumnData.length
      if (newColumnData.defaultValue) payload.defaultValue = newColumnData.defaultValue

      const response = await fetch(`${API_BASE_URL}/api/columns/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error: ${response.status}`)
      }
      const data = await response.json()
      Swal.fire({ icon: "success", title: "Columna creada", text: `La columna "${data.column.display_name}" se creó exitosamente`, timer: 2000 })
      fetchColumns()
      fetchAvailableColumns()
      setShowCreateColumnDialog(false)
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Error al crear columna", text: error.message })
    }
  }

  // Eliminar columna de la tabla prospectos
  const handleOpenDeleteColumn = (column: AvailableColumn) => {
    setColumnToDelete(column)
    setDeleteConfirmation("")
    setShowDeleteColumnDialog(true)
  }

  const handleDeleteColumn = async () => {
    if (!columnToDelete || deleteConfirmation !== "DELETE_COLUMN") return
    try {
      const response = await fetch(`${API_BASE_URL}/api/columns/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnName: columnToDelete.column_name, confirmation: "DELETE_COLUMN" }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error: ${response.status}`)
      }
      const data = await response.json()
      Swal.fire({ icon: "warning", title: "Columna eliminada", html: `<p>${data.message}</p>`, timer: 4000 })
      fetchColumns()
      fetchAvailableColumns()
      setShowDeleteColumnDialog(false)
      setColumnToDelete(null)
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Error al eliminar columna", text: error.message })
    }
  }

  // Función para importar leads: se envía el archivo mediante FormData al endpoint /api/import.
  const handleImport = (confirm: boolean = false) => {
    if (!file) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor selecciona un archivo para importar",
      });
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo para importar",
        variant: "destructive",
      });
      return;
    }

    console.log("[Import] iniciando petición", { confirm, file });

    const formData = new FormData();
    formData.append("file", file);
    if (confirm) formData.append("confirm", "true");

    const token = localStorage.getItem("token");
    console.log("[Import] headers y body preparados", {
      token,
      hasFile: formData.has("file"),
    });

    fetch(`${API_BASE_URL}/api/import`, {
      method: "POST",
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        console.log("[Import] respuesta fetch:", res);
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("[Import] JSON recibido:", data);

        // Si el backend detectó duplicados y aún no confirmamos
        if (data.status === "duplicates" && !confirm) {
          const duplicatesHtml = data.duplicates
            .map((d: any) => `<li>${d.correo_electronico}: ${d.count} duplicado(s)</li>`)
            .join("");

          Swal.fire({
            title: '¡Duplicados encontrados!',
            html: `
                <p>Total filas enviadas: ${data.inserted}</p>
                <p>Duplicados detectados: ${data.skipped}</p>
                <ul style="text-align:left;">${duplicatesHtml}</ul>
                <p>Por favor corrige tu archivo Excel y vuelve a intentarlo.</p>
              `,
            icon: 'warning',
            confirmButtonText: 'Entendido',
            width: 600,
          });


          return;
        }

        // Flujo final: éxito (sin duplicados o tras confirmación)
        Swal.fire({
          icon: "success",
          title: "Importación completada",
          html: `
            ${data.skipped > 0
              ? `<p>Duplicados importados: ${data.skipped}</p>`
              : ''
            }
          `,
        });
        toast({
          title: "Importación completada",
          description: data.message,
        });
        if (onImportSuccess) onImportSuccess();
        router.refresh();
      })
      .catch((error) => {
        console.error("[Import] Error en fetch:", error);
        Swal.fire({
          icon: "error",
          title: "Error en la importación",
          text: "Detalle: " + error.message,
        });
        toast({
          title: "Error",
          description: "No se pudieron importar los datos",
          variant: "destructive",
        });
      });
  };

  // Función para "guardar" la configuración de columnas (opcional)
  const handleSaveConfiguration = () => {
    Swal.fire({
      icon: "success",
      title: "Configuración guardada",
      text: "La configuración se guardó correctamente",
    })
    toast({
      title: "Configuración guardada",
      description: "La configuración se guardó correctamente",
    })
  }

  // Función para descargar plantilla Excel adaptativa
  const handleDownloadTemplate = async () => {
    const mappedColumns = columns.map(c => ({
      name: c.name,
      excelName: c.excelName,
      columnNumber: c.columnNumber,
    }))
    await downloadExcelTemplate(mappedColumns, "plantilla_carga_masiva_prospectos")
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="space-y-8">
        {/* Encabezado */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Importar Leads</h1>
          <Button variant="outline" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </div>

        {/* Card de acciones principales */}
        <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
          <div className="space-y-4">
            {/* Subir archivo */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Archivo CSV o Excel
              </label>
              <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
            </div>
            {/* Botones de acción */}
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={() => setShowStructure(!showStructure)}>
                {showStructure ? "Ocultar Estructura" : "Mostrar Estructura"}
              </Button>
              <Button variant="outline" onClick={() => setShowAvailableColumns(!showAvailableColumns)}>
                <Info className="h-4 w-4 mr-2" />
                {showAvailableColumns ? "Ocultar Campos DB" : "Gestionar Campos DB"}
              </Button>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Descargar Plantilla
              </Button>
              <Button onClick={() => handleImport()}>Importar Leads</Button>
            </div>
          </div>
        </div>

        {/* Sección de estructura */}
        {showStructure && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Estructura esperada</h2>
              <div className="flex gap-4">
                <Button onClick={handleAddColumn}>Agregar Columna</Button>
                <Button onClick={handleSaveConfiguration}>Guardar Configuración</Button>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-sm text-blue-800">
                ℹ️ Esta tabla muestra las <strong>parametrizaciones activas</strong> (mapeos entre columnas de Excel y la base de datos). 
                Al eliminar una fila, solo se elimina el mapeo, la columna seguirá existiendo en la base de datos.
              </p>
            </div>
            <div className="mb-4 flex items-center gap-4">
              <Input
                type="text"
                placeholder="🔍 Buscar por nombre de columna o Excel..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Nombre de la Columna</th>
                    <th className="px-4 py-2 text-left">Nombre en Excel</th>
                    <th className="px-4 py-2 text-left">Número de Columna</th>
                    <th className="px-4 py-2 text-left">Estado</th>
                    <th className="px-4 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {columns
                    .filter((column) => {
                      if (!searchFilter) return true
                      const search = searchFilter.toLowerCase()
                      return column.name.toLowerCase().includes(search) || column.excelName.toLowerCase().includes(search)
                    })
                    .map((column, index) => (
                    <tr
                      key={column.id ? column.id : `${column.name}-${index}`}
                      className="border-b odd:bg-white even:bg-gray-100"
                    >
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{column.name}</td>
                      <td className="px-4 py-2">{column.excelName}</td>
                      <td className="px-4 py-2">{column.columnNumber}</td>
                      <td className="px-4 py-2">{column.state}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => handleEditColumn(column)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteMapping(column.id, column.name)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            🗑️ Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sección de gestión de columnas de base de datos */}
        {showAvailableColumns && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Gestión de Campos en Base de Datos</h2>
              <Button onClick={handleOpenCreateColumn} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Crear Nueva Columna
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Columnas disponibles en la tabla <code className="bg-gray-100 px-2 py-1 rounded">prospectos</code>.
            </p>
            <div className="mb-4">
              <Input
                type="text"
                placeholder="🔍 Buscar columna por nombre..."
                value={searchAvailableFilter}
                onChange={(e) => setSearchAvailableFilter(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableColumns
                .filter((col) => {
                  if (!searchAvailableFilter) return true
                  const search = searchAvailableFilter.toLowerCase()
                  return col.display_name.toLowerCase().includes(search) || col.column_name.toLowerCase().includes(search)
                })
                .map((col) => (
                <div key={col.column_name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={col.is_configured ? "secondary" : "outline"} className="text-xs">
                        {col.is_configured ? "✓ Mapeado" : "○ Disponible"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{col.data_type}</Badge>
                    </div>
                    <p className="text-sm font-medium">{col.display_name}</p>
                    {col.is_configured && <p className="text-xs text-gray-500">Excel: {col.excel_column_name}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleOpenDeleteColumn(col)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    🗑️
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diálogo para crear columna */}
        <Dialog open={showCreateColumnDialog} onOpenChange={setShowCreateColumnDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Columna en Base de Datos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">⚠️ Esta acción modificará la estructura de la base de datos.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de la Columna *</label>
                <Input
                  placeholder="ejemplo: campo_personalizado"
                  value={newColumnData.columnName}
                  onChange={(e) => setNewColumnData({...newColumnData, columnName: e.target.value.toLowerCase()})}
                />
                <p className="text-xs text-gray-500 mt-1">Solo letras minúsculas y guiones bajos (_), mínimo 3 caracteres</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Dato *</label>
                <Select value={newColumnData.dataType} onValueChange={(value) => setNewColumnData({...newColumnData, dataType: value})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Texto corto (string)</SelectItem>
                    <SelectItem value="text">Texto largo (text)</SelectItem>
                    <SelectItem value="integer">Número entero</SelectItem>
                    <SelectItem value="decimal">Número decimal</SelectItem>
                    <SelectItem value="date">Fecha</SelectItem>
                    <SelectItem value="boolean">Verdadero/Falso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newColumnData.dataType === "string" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Longitud máxima</label>
                  <Input type="number" min="1" max="65535" value={newColumnData.length} onChange={(e) => setNewColumnData({...newColumnData, length: parseInt(e.target.value) || 255})} />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="nullable-carga" checked={newColumnData.nullable} onChange={(e) => setNewColumnData({...newColumnData, nullable: e.target.checked})} className="rounded" />
                <label htmlFor="nullable-carga" className="text-sm">Permitir valores vacíos (nullable)</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor por defecto (opcional)</label>
                <Input placeholder="Dejar vacío si no aplica" value={newColumnData.defaultValue} onChange={(e) => setNewColumnData({...newColumnData, defaultValue: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateColumnDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateColumn} disabled={!newColumnData.columnName || newColumnData.columnName.length < 3 || !/^[a-z_]+$/.test(newColumnData.columnName) || newColumnData.columnName.endsWith('_')}>
                Crear Columna
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo para eliminar columna */}
        <Dialog open={showDeleteColumnDialog} onOpenChange={setShowDeleteColumnDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>⚠️ Eliminar Columna de Base de Datos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-sm text-red-800 font-semibold mb-2">🚨 ACCIÓN DESTRUCTIVA</p>
                <p className="text-xs text-red-700">Esta acción eliminará permanentemente la columna y todos sus datos. No se puede deshacer.</p>
              </div>
              {columnToDelete && (
                <div className="border rounded p-3 bg-gray-50">
                  <p className="text-sm"><strong>Columna:</strong> {columnToDelete.display_name}</p>
                  <p className="text-sm"><strong>Tipo:</strong> {columnToDelete.data_type}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1 text-red-700">
                  Para confirmar, escribe: <code className="bg-red-100 px-2 py-1 rounded">DELETE_COLUMN</code>
                </label>
                <Input placeholder="DELETE_COLUMN" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} className="border-red-300" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDeleteColumnDialog(false); setColumnToDelete(null); setDeleteConfirmation("") }}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteColumn} disabled={deleteConfirmation !== "DELETE_COLUMN"}>Eliminar Columna</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de edición/creación de columnas */}
        <Dialog open={!!editingColumn} onOpenChange={() => { setEditingColumn(null); setSelectedDbColumn("") }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingColumn?.id === 0 ? "Agregar Mapeo de Columna" : "Editar Mapeo de Columna"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingColumn?.id === 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Campo de Base de Datos</label>
                  <Select value={selectedDbColumn} onValueChange={(value) => {
                    setSelectedDbColumn(value)
                    if (editingColumn) setEditingColumn({ ...editingColumn, name: value })
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un campo de BD" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {availableColumns.filter(col => !col.is_configured).map((col) => (
                        <SelectItem key={col.column_name} value={col.column_name}>
                          <div className="flex items-center gap-2">
                            <span>{col.display_name}</span>
                            <Badge variant="outline" className="text-xs">{col.data_type}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Solo se muestran columnas que aún no han sido configuradas</p>
                </div>
              )}
              {editingColumn?.id !== 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Campo de BD (No editable)</label>
                  <Input value={editingColumn?.name || ""} disabled />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre en Excel</label>
                <Input
                  placeholder="Ej: Nombre Completo, Email, Teléfono..."
                  value={editingColumn?.excelName || ""}
                  onChange={(e) => setEditingColumn(editingColumn ? { ...editingColumn, excelName: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Número de Columna</label>
                <Input
                  type="number"
                  value={editingColumn?.columnNumber || ""}
                  onChange={(e) => setEditingColumn(editingColumn ? { ...editingColumn, columnNumber: Number.parseInt(e.target.value, 10) } : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditingColumn(null); setSelectedDbColumn("") }}>Cancelar</Button>
              <Button onClick={handleSaveColumn} disabled={editingColumn?.id === 0 && !selectedDbColumn}>
                {editingColumn?.id === 0 ? "Crear Mapeo" : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
