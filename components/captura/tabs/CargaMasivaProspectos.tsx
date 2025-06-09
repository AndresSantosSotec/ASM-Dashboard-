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
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { API_BASE_URL } from "@/utils/apiConfig"

interface Column {
  id: number
  name: string              // Corresponde a column_name
  excelName: string         // Corresponde a excel_column_name
  columnNumber: number      // Corresponde a column_number
  state: string             // Se asume siempre "Activo" en el frontend
}

interface CargaMasivaProspectosProps {
  onImportSuccess?: () => void
}

export default function CargaMasivaProspectos({ onImportSuccess }: CargaMasivaProspectosProps) {
  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState<string>("")
  const [showStructure, setShowStructure] = useState(false)
  const [columns, setColumns] = useState<Column[]>([])
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)
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
  }, [toast])

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
    setEditingColumn({
      id: 0,
      name: "",
      excelName: "",
      columnNumber: 0,
      state: "Activo",
    })
  }

  // Guarda los cambios en la columna (POST para nueva, PUT para existente)
  const handleSaveColumn = () => {
    if (!editingColumn) return

    const payload = {
      columnName: editingColumn.name,
      excelColumnName: editingColumn.excelName,
      columnNumber: editingColumn.columnNumber,
    }

    if (editingColumn.id === 0) {
      fetch(`${API_BASE_URL}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
          return res.json()
        })
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "Columna creada",
            text: "La configuración se guardó correctamente",
          })
          toast({
            title: "Nueva columna creada",
            description: "La configuración se guardó correctamente",
          })
          fetchColumns()
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
      fetch(`${API_BASE_URL}/columns/${editingColumn.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
          return res.json()
        })
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "Columna actualizada",
            text: "La configuración se actualizó correctamente",
          })
          toast({
            title: "Columna actualizada",
            description: "La configuración se actualizó correctamente",
          })
          fetchColumns()
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
                  {columns.map((column, index) => (
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

        {/* Diálogo de edición/creación de columnas */}
        <Dialog open={!!editingColumn} onOpenChange={() => setEditingColumn(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingColumn?.id === 0 ? "Agregar Columna" : "Editar Columna"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ID de Columna</label>
                <Input value={editingColumn?.id || ""} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de la Columna</label>
                <Input
                  value={editingColumn?.name || ""}
                  onChange={(e) =>
                    setEditingColumn(
                      editingColumn ? { ...editingColumn, name: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre en Excel</label>
                <Input
                  value={editingColumn?.excelName || ""}
                  onChange={(e) =>
                    setEditingColumn(
                      editingColumn ? { ...editingColumn, excelName: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Número de Columna</label>
                <Input
                  type="number"
                  value={editingColumn?.columnNumber || ""}
                  onChange={(e) =>
                    setEditingColumn(
                      editingColumn
                        ? { ...editingColumn, columnNumber: Number.parseInt(e.target.value, 10) }
                        : null
                    )
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingColumn(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveColumn}>
                {editingColumn?.id === 0 ? "Crear" : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
