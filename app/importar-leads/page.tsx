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
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Plus, Info, Download, ShieldAlert, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { API_BASE_URL } from "@/utils/apiConfig"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { Badge } from "@/components/ui/badge"
import { downloadExcelTemplate } from "@/lib/excel-template-generator"

interface Column {
  id: number
  name: string              // column_name en BD
  excelName: string         // excel_column_name
  columnNumber: number      // column_number
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

export default function CargaMasivaProspectos() {
  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState<string>("")
  const [showStructure, setShowStructure] = useState(false)
  const [showAvailableColumns, setShowAvailableColumns] = useState(false)
  const [columns, setColumns] = useState<Column[]>([])
  const [availableColumns, setAvailableColumns] = useState<AvailableColumn[]>([])
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)
  const [selectedDbColumn, setSelectedDbColumn] = useState<string>("")
  const [progress, setProgress] = useState<number>(0)
  const [isImporting, setIsImporting] = useState<boolean>(false)

  // Estados para asignar asesor al importar
  const [asesores, setAsesores] = useState<{ id: number; nombre: string; username: string }[]>([])
  const [selectedAsesorId, setSelectedAsesorId] = useState<string>("")
  const [currentUser, setCurrentUser] = useState<{ id: number; rol: string } | null>(null)

  // Estados para filtros
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

  // Función para obtener el próximo número de columna disponible
  const getNextColumnNumber = (): number => {
    if (columns.length === 0) return 1
    const maxNumber = Math.max(...columns.map(col => col.columnNumber || 0))
    return maxNumber + 1
  }

  // Función para recargar las columnas desde el backend.
  const fetchColumns = () => {
    const token = localStorage.getItem("token")
    fetch(`${API_BASE_URL}/api/columns`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
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

    // Cargar usuario actual — primero desde localStorage, luego refrescar desde /user
    const token = localStorage.getItem("token")
    try {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const user = JSON.parse(storedUser)
        setCurrentUser({ id: user.id, rol: user.rol || "" })
        if ((user.rol || "").toLowerCase() === "asesor") {
          setSelectedAsesorId(String(user.id))
        }
      }
    } catch (e) {
      console.error("Error parsing user:", e)
    }

    // Obtener rol actualizado desde el backend (el localStorage puede no tener 'rol')
    if (token) {
      fetch(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(user => {
          if (user && user.id) {
            setCurrentUser({ id: user.id, rol: user.rol || "" })
            // Actualizar localStorage para futuras cargas
            const stored = localStorage.getItem("user")
            if (stored) {
              try {
                const parsed = JSON.parse(stored)
                parsed.rol = user.rol || ""
                localStorage.setItem("user", JSON.stringify(parsed))
              } catch { }
            }
            if ((user.rol || "").toLowerCase() === "asesor") {
              setSelectedAsesorId(String(user.id))
            }
          }
        })
        .catch(err => console.error("Error fetching user role:", err))
    }

    // Cargar lista de asesores (rol 7) + administrativos (rol 4)
    const aHeaders = token ? { Authorization: `Bearer ${token}` } : {}
    Promise.all([
      fetch(`${API_BASE_URL}/api/users/role/7`, { headers: aHeaders }).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE_URL}/api/users/role/4`, { headers: aHeaders }).then(r => r.json()).catch(() => []),
    ]).then(([json7, json4]) => {
      const toList = (json: any): any[] =>
        Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []
      const merged = [...toList(json7), ...toList(json4)]
      const unique = merged.filter((u, i, arr) => arr.findIndex(x => x.id === u.id) === i)
      setAsesores(
        unique
          .map(u => ({
            id: u.id,
            username: u.username ?? "",
            nombre:
              u.full_name ??
              (u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username ?? "—"),
          }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      )
    })
  }, [toast])

  // Función para obtener columnas disponibles de la tabla prospectos
  const fetchAvailableColumns = () => {
    const token = localStorage.getItem("token")
    fetch(`${API_BASE_URL}/api/columns/available`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setAvailableColumns(data.data || [])
      })
      .catch((error) => {
        console.error("Error fetching available columns:", error)
        toast({
          title: "Error",
          description: "No se pudieron obtener las columnas disponibles.",
          variant: "destructive",
        })
      })
  }

  // Manejo de cambio de archivo.
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      const allowedExtensions = ['.csv', '.xlsx', '.xls']
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
      if (!allowedExtensions.includes(fileExtension)) {
        Swal.fire({
          icon: 'error',
          title: 'Formato no permitido',
          html: `El archivo <strong>${selectedFile.name}</strong> no es un formato válido.<br/>Solo se permiten archivos <strong>CSV (.csv)</strong> y <strong>Excel (.xls, .xlsx)</strong>.`,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#d33',
        })
        // Limpiar el input
        event.target.value = ''
        setFile(null)
        return
      }
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

    // Validación: nombre de columna requerido
    if (!editingColumn.name) {
      toast({
        title: "Error",
        description: "Debe seleccionar un campo de base de datos",
        variant: "destructive",
      })
      return
    }

    // Validación: nombre en Excel requerido
    if (!editingColumn.excelName.trim()) {
      toast({
        title: "Error",
        description: "El nombre en Excel es requerido",
        variant: "destructive",
      })
      return
    }

    const payload = {
      columnName: editingColumn.name,
      excelColumnName: editingColumn.excelName,
      columnNumber: editingColumn.columnNumber,
    }

    const token = localStorage.getItem("token")
    if (editingColumn.id === 0) {
      fetch(`${API_BASE_URL}/api/columns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
          return res.json()
        })
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "Mapeo creado",
            text: "La configuración se guardó correctamente",
            timer: 2000
          })
          toast({
            title: "Mapeo creado",
            description: "La configuración se guardó correctamente",
          })
          fetchColumns()
          fetchAvailableColumns() // 🔄 Refrescar columnas disponibles
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
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
          return res.json()
        })
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "Mapeo actualizado",
            text: "La configuración se actualizó correctamente",
            timer: 2000
          })
          toast({
            title: "Mapeo actualizado",
            description: "La configuración se actualizó correctamente",
          })
          fetchColumns()
          fetchAvailableColumns() // 🔄 Refrescar columnas disponibles
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
      html: `
        <p>Se eliminará la parametrización de la columna <strong>${columnName}</strong></p>
        <p class="text-sm text-gray-600 mt-2">La columna seguirá existiendo en la base de datos, solo se eliminará su mapeo con Excel.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar mapeo',
      cancelButtonText: 'Cancelar'
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/api/columns/${columnId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      Swal.fire({
        icon: "success",
        title: "Mapeo eliminado",
        text: "La parametrización se eliminó correctamente",
        timer: 2000
      })

      toast({
        title: "Mapeo eliminado",
        description: "La columna ahora está disponible para mapear nuevamente",
      })

      fetchColumns()
      fetchAvailableColumns()
    } catch (error: any) {
      console.error("Error deleting mapping:", error)
      Swal.fire({
        icon: "error",
        title: "Error al eliminar",
        text: error.message,
      })
      toast({
        title: "Error",
        description: "No se pudo eliminar el mapeo",
        variant: "destructive",
      })
    }
  }

  // Abrir diálogo para crear columna nueva
  const handleOpenCreateColumn = () => {
    setNewColumnData({
      columnName: "",
      dataType: "string",
      length: 255,
      nullable: true,
      defaultValue: ""
    })
    setShowCreateColumnDialog(true)
  }

  // Crear columna en la tabla prospectos
  const handleCreateColumn = async () => {
    // Validar nombre de columna
    if (!newColumnData.columnName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la columna es requerido",
        variant: "destructive",
      })
      return
    }

    // Validar formato: solo minúsculas y guiones bajos
    const columnNameRegex = /^[a-z_]+$/
    if (!columnNameRegex.test(newColumnData.columnName)) {
      toast({
        title: "Error",
        description: "El nombre debe contener solo letras minúsculas y guiones bajos",
        variant: "destructive",
      })
      return
    }

    // Validar longitud mínima del nombre
    if (newColumnData.columnName.length < 3) {
      toast({
        title: "Error",
        description: "El nombre debe tener al menos 3 caracteres",
        variant: "destructive",
      })
      return
    }

    // Validar que no termine con guión bajo
    if (newColumnData.columnName.endsWith('_')) {
      toast({
        title: "Error",
        description: "El nombre no puede terminar con guión bajo",
        variant: "destructive",
      })
      return
    }

    // Mostrar confirmación con advertencia de tiempo
    const result = await Swal.fire({
      title: '¿Crear nueva columna en BD?',
      html: `
        <div class="text-left space-y-3">
          <p><strong>Columna:</strong> ${newColumnData.columnName}</p>
          <p><strong>Tipo:</strong> ${newColumnData.dataType}${newColumnData.dataType === 'string' ? ` (${newColumnData.length})` : ''}</p>
          <p><strong>Nullable:</strong> ${newColumnData.nullable ? 'Sí' : 'No'}</p>
          ${newColumnData.defaultValue ? `<p><strong>Valor por defecto:</strong> ${newColumnData.defaultValue}</p>` : ''}
          <div class="bg-yellow-50 border border-yellow-300 rounded p-3 mt-3">
            <p class="text-sm text-yellow-800">
              ⏱️ <strong>Este proceso puede tardar de 2 a 5 segundos</strong> mientras se modifica la estructura de la base de datos.
            </p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, crear columna',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading()
    })

    if (!result.isConfirmed) return

    // Mostrar loading
    Swal.fire({
      title: 'Creando columna...',
      html: 'Por favor espera, esto puede tardar unos segundos.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    try {
      const payload: any = {
        columnName: newColumnData.columnName,
        dataType: newColumnData.dataType,
        nullable: newColumnData.nullable,
      }

      // Agregar length solo si el tipo es string
      if (newColumnData.dataType === "string" && newColumnData.length) {
        payload.length = newColumnData.length
      }

      // Agregar defaultValue si existe
      if (newColumnData.defaultValue) {
        payload.defaultValue = newColumnData.defaultValue
      }

      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/api/columns/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error: ${response.status}`)
      }

      const data = await response.json()

      Swal.fire({
        icon: "success",
        title: "Columna creada",
        text: `La columna "${data.column.display_name}" se creó exitosamente`,
        timer: 2000
      })

      toast({
        title: "Columna creada",
        description: `La columna "${data.column.display_name}" está disponible para mapear`,
      })

      // Refrescar listas
      fetchColumns()
      fetchAvailableColumns()
      setShowCreateColumnDialog(false)
    } catch (error: any) {
      console.error("Error creating column:", error)
      Swal.fire({
        icon: "error",
        title: "Error al crear columna",
        text: error.message,
      })
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Abrir diálogo para eliminar columna
  const handleOpenDeleteColumn = (column: AvailableColumn) => {
    setColumnToDelete(column)
    setDeleteConfirmation("")
    setShowDeleteColumnDialog(true)
  }

  // Eliminar columna de la tabla prospectos
  const handleDeleteColumn = async () => {
    if (!columnToDelete) return

    // Validar confirmación
    if (deleteConfirmation !== "DELETE_COLUMN") {
      toast({
        title: "Error",
        description: "Debe escribir DELETE_COLUMN para confirmar",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/api/columns/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          columnName: columnToDelete.column_name,
          confirmation: "DELETE_COLUMN"
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error: ${response.status}`)
      }

      const data = await response.json()

      Swal.fire({
        icon: "warning",
        title: "Columna eliminada",
        html: `
          <p>${data.message}</p>
          ${data.warning ? `<p class="text-sm text-orange-600 mt-2">${data.warning}</p>` : ''}
          ${data.affected_rows ? `<p class="text-sm font-semibold mt-1">${data.affected_rows} registros afectados</p>` : ''}
        `,
        timer: 4000
      })

      toast({
        title: "Columna eliminada",
        description: `${data.message} (${data.affected_rows} registros afectados)`,
      })

      // Refrescar listas
      fetchColumns()
      fetchAvailableColumns()
      setShowDeleteColumnDialog(false)
      setColumnToDelete(null)
    } catch (error: any) {
      console.error("Error deleting column:", error)
      Swal.fire({
        icon: "error",
        title: "Error al eliminar columna",
        text: error.message,
      })
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Importar leads. El backend debe detectar duplicados por: correo_electronico, numero_identificacion (DPI), nombre_completo.
  // Si hay duplicados: devolver status "duplicates", skipped, duplicates[] y NO importar. Si no hay duplicados (o confirm=true): importar y devolver inserted, skipped, duplicates[] en el éxito.
  const handleImport = (confirm: boolean = false, action: string | null = null) => {
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
    if (action) formData.append("action", action);
    if (selectedAsesorId) formData.append("asesor_id", selectedAsesorId);
    formData.append("check_duplicates", "correo,dpi,nombre");

    const token = localStorage.getItem("token");
    console.log("[Import] headers y body preparados", {
      token,
      hasFile: formData.has("file"),
    });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/import`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    setIsImporting(true);
    setProgress(1); // mostrar barra de progreso de inmediato

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        // El upload ocupa el 0-80%, el procesamiento del servidor el 80-99%
        const percent = Math.round((e.loaded / e.total) * 80);
        console.log("[Import] progreso upload:", percent);
        setProgress(percent);
      }
    };

    xhr.upload.onload = () => {
      // Upload completado — ahora el servidor está procesando
      setProgress(85);
    };

    xhr.onload = () => {
      setIsImporting(false);
      setProgress(0);
      console.log("[Import] respuesta xhr:", xhr.status);
      if (xhr.status < 200 || xhr.status >= 300) {
        handleError(new Error(`HTTP error: ${xhr.status}`));
        return;
      }

      try {
        const data = JSON.parse(xhr.responseText);
        console.log("[Import] JSON recibido:", data);

        // Si el backend detectó duplicados y aún no seleccionaron una acción
        if (data.status === "duplicates" && !action) {
          const duplicatesHtml = (data.duplicates || [])
            .slice(0, 10)
            .map((d: any) => {
              const parts = [];
              if (d.correo_electronico) parts.push(`Correo: ${d.correo_electronico}`);
              if (d.numero_identificacion) parts.push(`DPI: ${d.numero_identificacion}`);
              if (d.nombre_completo) parts.push(`Nombre: ${d.nombre_completo}`);
              return `<li class="text-sm">${parts.join(' | ')}</li>`;
            })
            .join("");

          const moreCount = (data.skipped ?? (data.duplicates || []).length) - 10;

          Swal.fire({
            title: '¡Duplicados encontrados!',
            html: `
                <div class="text-left">
                  <p class="mb-2"><strong>Total de registros:</strong> ${data.total_rows}</p>
                  <p class="mb-2"><strong>Nuevos por insertar:</strong> ${data.insertable}</p>
                  <p class="mb-4"><strong>Duplicados detectados:</strong> ${data.skipped}</p>
                  <div class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                    <p class="text-sm font-semibold mb-2">Primeros duplicados encontrados:</p>
                    <ul class="list-disc pl-5 max-h-32 overflow-y-auto">${duplicatesHtml}</ul>
                    ${moreCount > 0 ? `<p class="text-xs text-gray-600 mt-2">... y ${moreCount} duplicados más</p>` : ''}
                  </div>
                  <p class="text-sm font-medium text-gray-700 mb-2">¿Qué desea hacer?</p>
                </div>
              `,
            icon: 'warning',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: `<i class="fas fa-filter"></i> Omitir duplicados (${data.insertable} nuevos)`,
            denyButtonText: `<i class="fas fa-exclamation-triangle"></i> Forzar todos (${data.total_rows})`,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#3085d6',
            denyButtonColor: '#f59e0b',
            cancelButtonColor: '#71717a',
            width: 700,
          }).then((result) => {
            if (result.isConfirmed) {
              // Omitir duplicados - importar solo nuevos
              handleImport(false, 'skip_duplicates');
            } else if (result.isDenied) {
              // Forzar importación de todos
              Swal.fire({
                title: '¿Está seguro?',
                text: `Se importarán ${data.total_rows} registros incluyendo ${data.skipped} duplicados. Esto puede crear datos redundantes.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, importar todo',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#d33',
              }).then((confirmResult) => {
                if (confirmResult.isConfirmed) {
                  handleImport(false, 'force_all');
                }
              });
            }
          });

          return;
        }

        // 🛡️ NUEVO: Manejo de error de estructura (columnas faltantes)
        if (data.status === "column_mismatch") {
          const missingList = data.missing_columns
            .map((col: string) => `<li>${col}</li>`)
            .join("");

          Swal.fire({
            icon: "warning",
            title: "Estructura incorrecta",
            html: `
                    <div class="text-left">
                        <p class="font-medium text-red-600 mb-2">Las columnas del archivo no coinciden con la configuración actual.</p>
                        <p class="text-sm text-gray-700 mb-1">Faltan las siguientes columnas:</p>
                        <ul class="list-disc pl-5 text-sm text-gray-600 mb-4 h-32 overflow-y-auto border p-2 rounded bg-gray-50">
                            ${missingList}
                        </ul>
                        <p class="text-sm">Por favor descarga la nueva plantilla y asegúrate de usar los encabezados correctos.</p>
                    </div>
                `,
            showCancelButton: true,
            confirmButtonText: "Descargar Plantilla",
            cancelButtonText: "Entendido",
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#71717a"
          }).then((result) => {
            if (result.isConfirmed) {
              handleDownloadTemplate();
            }
          });
          return;
        }

        // Flujo final: éxito — SIEMPRE mostrar resumen (importados y omitidos por duplicado)
        const imported = data.inserted ?? data.imported ?? 0;
        const skipped = data.skipped ?? 0;
        const duplicatesList = data.duplicates ?? [];
        const duplicatesHtml = duplicatesList.length > 0
          ? duplicatesList
              .map((d: any) => {
                const correo = d.correo_electronico ?? d.correo ?? "—";
                const dpi = d.numero_identificacion ?? d.dpi ?? "—";
                const nombre = d.nombre_completo ?? d.nombre ?? "—";
                return `<li><strong>${nombre}</strong> | ${correo} | DPI: ${dpi}</li>`;
              })
              .join("")
          : "";

        Swal.fire({
          icon: "success",
          title: "Importación completada",
          html: `
            <p class="text-left font-medium">Registros importados: <strong>${imported}</strong></p>
            ${skipped > 0 ? `
              <p class="text-left font-medium text-amber-700 mt-2">Registros omitidos por duplicado (correo, DPI o nombre): <strong>${skipped}</strong></p>
              ${duplicatesHtml ? `<ul class="text-left text-sm list-disc pl-5 max-h-32 overflow-y-auto border p-2 rounded bg-gray-50 mt-2">${duplicatesHtml}</ul>` : ""}
            ` : ""}
          `,
          width: 560,
        });
        toast({
          title: "Importación completada",
          description: skipped > 0
            ? `${imported} importados. ${skipped} omitidos por duplicado (correo, DPI, nombre).`
            : (data.message || `${imported} registros importados.`),
        });
        router.refresh();
      } catch (error: any) {
        handleError(error);
      }
    };

    xhr.onerror = () => {
      setIsImporting(false);
      setProgress(0);
      handleError(new Error("Network error"));
    };

    function handleError(error: Error) {
      console.error("[Import] Error en xhr:", error);
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
    }

    xhr.send(formData);
  };

  // Función para descargar plantilla Excel adaptativa
  const handleDownloadTemplate = async () => {
    const mappedColumns = columns.map(c => ({
      name: c.name,
      excelName: c.excelName,
      columnNumber: c.columnNumber,
    }))
    await downloadExcelTemplate(mappedColumns, "plantilla_importar_leads")
  }

  // Función para descargar listado de asesores en Excel
  const handleDownloadAsesores = async () => {
    if (asesores.length === 0) {
      toast({ title: "Sin asesores", description: "No hay asesores disponibles para descargar.", variant: "destructive" })
      return
    }
    const ExcelJS = (await import("exceljs")).default
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Asesores")
    sheet.columns = [
      { header: "Usuario", key: "username", width: 25 },
      { header: "Nombre completo", key: "nombre", width: 40 },
      { header: "ID", key: "id", width: 10 },
    ]
    // Estilo de encabezado
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } }
      cell.alignment = { vertical: "middle", horizontal: "center" }
    })
    asesores.forEach(a => sheet.addRow({ username: a.username, nombre: a.nombre, id: a.id }))
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `listado_asesores_${new Date().toISOString().slice(0,10)}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  }

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

        {/* Aviso: criterios de duplicados (correo, DPI, nombre) */}
        <Alert className="bg-amber-50 border-amber-200">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>Evitar duplicados:</strong> Los registros se consideran duplicados si ya existe uno con el mismo <strong>Correo</strong>, <strong>DPI (número de identificación)</strong> o <strong>Nombre completo</strong>. Esos registros <strong>nunca se importarán</strong> y se mostrarán en el resumen después de subir el archivo. Revisa tu archivo y quita filas ya subidas en cargas anteriores.
          </AlertDescription>
        </Alert>

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
            {/* Asignar asesor */}
            {asesores.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Asignar leads a asesor
                </label>
                <Select
                  value={selectedAsesorId}
                  onValueChange={setSelectedAsesorId}
                  disabled={currentUser?.rol?.toLowerCase() === "asesor"}
                >
                  <SelectTrigger className="w-full md:w-80">
                    <SelectValue placeholder="Seleccione un asesor (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {asesores.map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedAsesorId
                    ? `Los leads importados se asignarán a: ${asesores.find(a => String(a.id) === selectedAsesorId)?.nombre || "—"}`
                    : "Si no selecciona un asesor, los leads se asignarán al usuario que importa"}
                </p>
              </div>
            )}
            {/* Botones de acción */}
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="outline" onClick={() => setShowStructure(!showStructure)}>
                {showStructure ? "Ocultar Estructura" : "Mostrar Estructura"}
              </Button>
              {currentUser?.rol?.toLowerCase() === "administrador" && (
                <Button variant="outline" onClick={() => setShowAvailableColumns(!showAvailableColumns)}>
                  <Info className="h-4 w-4 mr-2" />
                  {showAvailableColumns ? "Ocultar Campos DB" : "Gestionar Campos DB"}
                </Button>
              )}
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Descargar Plantilla
              </Button>
              {asesores.length > 0 && (
                <Button variant="outline" onClick={handleDownloadAsesores}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Lista Asesores
                </Button>
              )}
              <Button
                onClick={() => handleImport()}
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {progress < 85 ? `Subiendo... ${progress}%` : "Procesando..."}
                  </>
                ) : (
                  "Importar Leads"
                )}
              </Button>
              {(progress > 0 || isImporting) && (
                <div className="flex-1">
                  <Progress value={isImporting && progress === 0 ? 99 : progress} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección de estructura */}
        {showStructure && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Estructura esperada</h2>
              {currentUser?.rol?.toLowerCase() === "administrador" && (
                <div className="flex gap-4">
                  <Button onClick={handleAddColumn}>Agregar Columna</Button>
                  <Button onClick={handleSaveConfiguration}>Guardar Configuración</Button>
                </div>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-sm text-blue-800">
                ℹ️ Esta tabla muestra las <strong>parametrizaciones activas</strong> (mapeos entre columnas de Excel y la base de datos).
                Al eliminar una fila, solo se elimina el mapeo, la columna seguirá existiendo en la base de datos.
              </p>
            </div>

            {/* Filtro de búsqueda */}
            <div className="mb-4 flex items-center gap-4">
              <Input
                type="text"
                placeholder="🔍 Buscar por nombre de columna o Excel..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="max-w-md"
              />
              {searchFilter && (
                <Badge variant="outline">
                  {columns.filter((column) => {
                    const search = searchFilter.toLowerCase()
                    return (
                      column.name.toLowerCase().includes(search) ||
                      column.excelName.toLowerCase().includes(search)
                    )
                  }).length} resultado(s)
                </Badge>
              )}
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
                    {currentUser?.rol?.toLowerCase() === "administrador" && (
                      <th className="px-4 py-2 text-right">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {columns
                    .filter((column) => {
                      if (!searchFilter) return true
                      const search = searchFilter.toLowerCase()
                      return (
                        column.name.toLowerCase().includes(search) ||
                        column.excelName.toLowerCase().includes(search)
                      )
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
                        {currentUser?.rol?.toLowerCase() === "administrador" && (
                          <td className="px-4 py-2 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" onClick={() => handleEditColumn(column)}>
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteMapping(column.id, column.name)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                🗑️ Eliminar
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sección de gestión de columnas de base de datos — Solo administradores */}
        {showAvailableColumns && currentUser?.rol?.toLowerCase() === "administrador" && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Gestión de Campos en Base de Datos</h2>
              <Button onClick={handleOpenCreateColumn} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Crear Nueva Columna
              </Button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Estas son todas las columnas disponibles en la tabla <code className="bg-gray-100 px-2 py-1 rounded">prospectos</code>.
              Puedes crear nuevas columnas o eliminar las que no necesites.
            </p>

            {/* Filtro de búsqueda */}
            <div className="mb-4 flex items-center gap-4">
              <Input
                type="text"
                placeholder="🔍 Buscar columna por nombre..."
                value={searchAvailableFilter}
                onChange={(e) => setSearchAvailableFilter(e.target.value)}
                className="max-w-md"
              />
              {searchAvailableFilter && (
                <Badge variant="outline">
                  {availableColumns.filter((col) => {
                    const search = searchAvailableFilter.toLowerCase()
                    return (
                      col.display_name.toLowerCase().includes(search) ||
                      col.column_name.toLowerCase().includes(search) ||
                      (col.excel_column_name && col.excel_column_name.toLowerCase().includes(search))
                    )
                  }).length} resultado(s)
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableColumns
                .filter((col) => {
                  if (!searchAvailableFilter) return true
                  const search = searchAvailableFilter.toLowerCase()
                  return (
                    col.display_name.toLowerCase().includes(search) ||
                    col.column_name.toLowerCase().includes(search) ||
                    (col.excel_column_name && col.excel_column_name.toLowerCase().includes(search))
                  )
                })
                .map((col) => (
                  <div
                    key={col.column_name}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={col.is_configured ? "secondary" : "outline"} className="text-xs">
                          {col.is_configured ? "✓ Mapeado" : "○ Disponible"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {col.data_type}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{col.display_name}</p>
                      {col.is_configured && (
                        <p className="text-xs text-gray-500">
                          Excel: {col.excel_column_name}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDeleteColumn(col)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
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
                <p className="text-xs text-yellow-800">
                  ⚠️ Esta acción modificará la estructura de la base de datos. Asegúrate de usar nombres descriptivos en minúsculas con guiones bajos.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-800">
                  ⏱️ <strong>Tiempo estimado:</strong> 2-5 segundos. El proceso puede tardar debido a modificaciones en la estructura de la base de datos.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre de la Columna *
                </label>
                <Input
                  placeholder="ejemplo: campo_personalizado"
                  value={newColumnData.columnName}
                  onChange={(e) => setNewColumnData({ ...newColumnData, columnName: e.target.value.toLowerCase() })}
                  className={
                    newColumnData.columnName && !/^[a-z_]+$/.test(newColumnData.columnName)
                      ? "border-red-300 focus:border-red-500"
                      : newColumnData.columnName.length >= 3 && /^[a-z_]+$/.test(newColumnData.columnName) && !newColumnData.columnName.endsWith('_')
                        ? "border-green-300 focus:border-green-500"
                        : ""
                  }
                />
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-gray-500">
                    Solo letras minúsculas y guiones bajos (_), mínimo 3 caracteres
                  </p>
                  {newColumnData.columnName && (
                    <div className="space-y-0.5">
                      {newColumnData.columnName.length < 3 && (
                        <p className="text-xs text-red-600">❌ Mínimo 3 caracteres</p>
                      )}
                      {!/^[a-z_]+$/.test(newColumnData.columnName) && (
                        <p className="text-xs text-red-600">❌ Solo minúsculas y guiones bajos</p>
                      )}
                      {newColumnData.columnName.endsWith('_') && (
                        <p className="text-xs text-red-600">❌ No puede terminar con guión bajo</p>
                      )}
                      {newColumnData.columnName.length >= 3 &&
                        /^[a-z_]+$/.test(newColumnData.columnName) &&
                        !newColumnData.columnName.endsWith('_') && (
                          <p className="text-xs text-green-600">✅ Nombre válido</p>
                        )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tipo de Dato *
                </label>
                <Select
                  value={newColumnData.dataType}
                  onValueChange={(value) => setNewColumnData({ ...newColumnData, dataType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Texto corto (string)</SelectItem>
                    <SelectItem value="text">Texto largo (text)</SelectItem>
                    <SelectItem value="integer">Número entero (integer)</SelectItem>
                    <SelectItem value="decimal">Número decimal (decimal)</SelectItem>
                    <SelectItem value="date">Fecha (date)</SelectItem>
                    <SelectItem value="datetime">Fecha y hora (datetime)</SelectItem>
                    <SelectItem value="boolean">Verdadero/Falso (boolean)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newColumnData.dataType === "string" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Longitud máxima
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="65535"
                    value={newColumnData.length}
                    onChange={(e) => setNewColumnData({ ...newColumnData, length: parseInt(e.target.value) || 255 })}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="nullable"
                  checked={newColumnData.nullable}
                  onChange={(e) => setNewColumnData({ ...newColumnData, nullable: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="nullable" className="text-sm">
                  Permitir valores vacíos (nullable)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Valor por defecto (opcional)
                </label>
                <Input
                  placeholder="Dejar vacío si no aplica"
                  value={newColumnData.defaultValue}
                  onChange={(e) => setNewColumnData({ ...newColumnData, defaultValue: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateColumnDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateColumn}
                disabled={
                  !newColumnData.columnName ||
                  newColumnData.columnName.length < 3 ||
                  !/^[a-z_]+$/.test(newColumnData.columnName) ||
                  newColumnData.columnName.endsWith('_')
                }
              >
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
                <p className="text-sm text-red-800 font-semibold mb-2">
                  🚨 ACCIÓN DESTRUCTIVA
                </p>
                <p className="text-xs text-red-700">
                  Esta acción eliminará permanentemente la columna y todos los datos que contenga.
                  No se puede deshacer.
                </p>
              </div>

              {columnToDelete && (
                <div className="border rounded p-3 bg-gray-50">
                  <p className="text-sm mb-2">
                    <span className="font-medium">Columna:</span> {columnToDelete.display_name}
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-medium">Tipo:</span> {columnToDelete.data_type}
                  </p>
                  {columnToDelete.is_configured && (
                    <Badge variant="secondary" className="text-xs">
                      ✓ Esta columna está mapeada a Excel
                    </Badge>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1 text-red-700">
                  Para confirmar, escribe: <code className="bg-red-100 px-2 py-1 rounded">DELETE_COLUMN</code>
                </label>
                <Input
                  placeholder="DELETE_COLUMN"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="border-red-300 focus:border-red-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteColumnDialog(false)
                  setColumnToDelete(null)
                  setDeleteConfirmation("")
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteColumn}
                disabled={deleteConfirmation !== "DELETE_COLUMN"}
              >
                Eliminar Columna
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de edición/creación de columnas */}
        <Dialog open={!!editingColumn} onOpenChange={() => {
          setEditingColumn(null)
          setSelectedDbColumn("")
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingColumn?.id === 0 ? "Agregar Mapeo de Columna" : "Editar Mapeo de Columna"}
              </DialogTitle>
              <p className="text-sm text-gray-500">
                Configura el mapeo entre las columnas de tu archivo Excel y los campos de la base de datos
              </p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingColumn?.id === 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Campo de Base de Datos <Badge variant="destructive">Requerido</Badge>
                  </label>
                  <Select
                    value={selectedDbColumn}
                    onValueChange={(value) => {
                      setSelectedDbColumn(value)
                      if (editingColumn) {
                        setEditingColumn({ ...editingColumn, name: value })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un campo de BD" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {availableColumns
                        .filter(col => !col.is_configured)
                        .map((col) => (
                          <SelectItem key={col.column_name} value={col.column_name}>
                            <div className="flex items-center justify-between w-full">
                              <span>{col.display_name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {col.data_type}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    💡 Solo se muestran columnas que aún no han sido configuradas
                  </p>
                </div>
              )}

              {editingColumn?.id !== 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Campo de BD (No editable)</label>
                  <Input value={editingColumn?.name || ""} disabled />
                  <p className="text-xs text-gray-500">
                    El nombre del campo de BD no puede modificarse. Para cambiar, elimina y crea uno nuevo.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  Nombre en Excel <Badge variant="destructive">Requerido</Badge>
                </label>
                <Input
                  placeholder="Ej: Nombre Completo, Email, Teléfono..."
                  value={editingColumn?.excelName || ""}
                  onChange={(e) =>
                    setEditingColumn(
                      editingColumn ? { ...editingColumn, excelName: e.target.value } : null
                    )
                  }
                />
                <p className="text-xs text-gray-500">
                  Escribe exactamente como aparece la columna en tu archivo Excel
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  Número de Columna <Info className="h-4 w-4 text-gray-400" />
                  {editingColumn?.id === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      ✨ Auto: {editingColumn.columnNumber}
                    </Badge>
                  )}
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ej: 1, 2, 3..."
                  value={editingColumn?.columnNumber || ""}
                  onChange={(e) =>
                    setEditingColumn(
                      editingColumn
                        ? { ...editingColumn, columnNumber: Number.parseInt(e.target.value, 10) }
                        : null
                    )
                  }
                />
                <p className="text-xs text-gray-500">
                  {editingColumn?.id === 0
                    ? `💡 Se asignó automáticamente el número ${editingColumn.columnNumber}. Puedes cambiarlo si lo deseas.`
                    : "Número de la columna en tu Excel (usado para ordenamiento)"
                  }
                </p>
              </div>

              {/* Botón para ver columnas disponibles */}
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAvailableColumns(!showAvailableColumns)}
                  className="w-full"
                >
                  {showAvailableColumns ? "Ocultar" : "Ver"} Columnas Disponibles en BD
                </Button>

                {showAvailableColumns && (
                  <div className="mt-4 border rounded-lg p-4 bg-gray-50 max-h-[200px] overflow-y-auto">
                    <h4 className="text-sm font-semibold mb-2">Columnas de la tabla prospectos:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {availableColumns.map((col) => (
                        <div key={col.column_name} className="text-xs flex items-center gap-2">
                          <Badge
                            variant={col.is_configured ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {col.is_configured ? "✓" : "○"}
                          </Badge>
                          <span className={col.is_configured ? "line-through text-gray-400" : ""}>
                            {col.display_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditingColumn(null)
                setSelectedDbColumn("")
              }}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveColumn}
                disabled={editingColumn?.id === 0 && !selectedDbColumn}
              >
                {editingColumn?.id === 0 ? "Crear Mapeo" : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
