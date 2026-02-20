"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { API_BASE_URL } from "@/utils/apiConfig"
import { downloadExcelTemplate } from "@/lib/excel-template-generator"

interface Column {
  id: number
  name: string
  excelName: string
  columnNumber: number
  state: string
}

interface CargaMasivaProspectosProps {
  onImportSuccess?: () => void
}

export default function CargaMasivaProspectos({ onImportSuccess }: CargaMasivaProspectosProps) {
  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState<string>("")
  const [showStructure, setShowStructure] = useState(false)
  const [columns, setColumns] = useState<Column[]>([])
  const [searchFilter, setSearchFilter] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

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
  }, [toast])

  // Función para obtener columnas disponibles de la tabla prospectos
  // (Solo lectura - se usa para la estructura y plantilla)

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

    setIsImporting(true);
    console.log("[Import] iniciando petición", { confirm, file });

    // Mostrar loading con SweetAlert
    Swal.fire({
      title: 'Importando...',
      html: 'Procesando el archivo, esto puede tardar unos minutos para archivos grandes.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const formData = new FormData();
    formData.append("file", file);
    if (confirm) formData.append("confirm", "true");

    const token = localStorage.getItem("token");

    fetch(`${API_BASE_URL}/api/import`, {
      method: "POST",
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        console.log("[Import] respuesta fetch:", res);
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.message || `Error del servidor: ${res.status}`);
        }
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
                <p>Nuevos por insertar: ${data.insertable}</p>
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
              handleDownloadTemplate(); // Esta función existe en este componente
            }
          });
          return;
        }

        // Flujo final: éxito
        Swal.fire({
          icon: "success",
          title: "Importación completada",
          html: `
            <p>Insertados: ${data.inserted || 0}</p>
            ${data.skipped > 0 ? `<p>Duplicados omitidos: ${data.skipped}</p>` : ''}
            ${data.errors > 0 ? `<p>Filas con error: ${data.errors}</p>` : ''}
          `,
        });
        toast({
          title: "Importación completada",
          description: data.message,
        });
        setFile(null);
        if (onImportSuccess) onImportSuccess();
        router.refresh();
      })
      .catch((error) => {
        console.error("[Import] Error en fetch:", error);
        Swal.fire({
          icon: "error",
          title: "Error en la importación",
          html: `<p>${error.message}</p><p class="text-sm text-gray-500">Si el archivo es muy grande, intenta dividirlo en partes más pequeñas.</p>`,
        });
        toast({
          title: "Error",
          description: "No se pudieron importar los datos: " + error.message,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsImporting(false);
      });
  };

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
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Descargar Plantilla
              </Button>
              <Button onClick={() => handleImport()} disabled={isImporting || !file}>
                {isImporting ? "Importando..." : "Importar Leads"}
              </Button>
            </div>
          </div>
        </div>

        {/* Sección de estructura */}
        {showStructure && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Estructura esperada</h2>
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
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
