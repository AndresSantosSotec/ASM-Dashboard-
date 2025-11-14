"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Loader2, Download } from "lucide-react"
import { API_BASE_URL } from "@/utils/apiConfig"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import api from "@/services/api"

export default function MigrarEstudiantes() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [skipErrors, setSkipErrors] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        Swal.fire({
          icon: "error",
          title: "No autenticado",
          text: "Debes iniciar sesión para descargar la plantilla"
        })
        return
      }

      toast({
        title: "Descargando...",
        description: "Preparando plantilla de ejemplo",
      })

      const response = await api.get("/estudiantes/template", {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "plantilla_estudiantes.xlsx")
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Éxito",
        description: "Plantilla descargada correctamente",
      })
    } catch (error: any) {
      console.error("Error downloading template:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo descargar la plantilla",
      })
      toast({
        title: "Error",
        description: "No se pudo descargar la plantilla",
        variant: "destructive",
      })
    }
  }

  const handleImport = async () => {
    if (!file) {
      Swal.fire({ icon: "error", title: "Error", text: "Selecciona un archivo para importar" })
      toast({
        title: "Error",
        description: "Selecciona un archivo para importar",
        variant: "destructive"
      })
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "No autenticado",
        text: "Debes iniciar sesión para importar estudiantes"
      })
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("skip_errors", skipErrors ? "1" : "0")

    try {
      setIsLoading(true)
      setProgress(0)

      const res = await api.post("/estudiantes/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded * 100) / e.total)
            setProgress(pct)
          }
        },
      })

      const data = res.data

      if (res.status < 200 || res.status >= 300) {
        let errorMsg = data.message || `HTTP error ${res.status}`
        let sampleErrors = data.sample_errors || []

        Swal.fire({
          icon: "error",
          title: "Error en la importación",
          html: errorMsg + (sampleErrors.length > 0
            ? "<hr class='my-2' /><pre style='text-align: left; font-size: 12px;'>" +
              sampleErrors.map((e: any) =>
                `Fila ${e.row} - Campo: ${e.attribute ?? '-'} - ${Array.isArray(e.errors) ? e.errors.join(", ") : e.error}`
              ).join("\n") +
              "</pre>"
            : "")
        })

        toast({
          title: "Error",
          description: "No se pudieron importar los datos",
          variant: "destructive"
        })
        return
      }

      Swal.fire({ icon: "success", title: "Importación completada" })
      toast({
        title: "Éxito",
        description: data.message || "Estudiantes importados correctamente",
      })
      router.refresh()
    } catch (error: any) {
      console.error("Error en import:", error)
      Swal.fire({
        icon: "error",
        title: "Error en la importación",
        text: error.message,
      })
      toast({
        title: "Error",
        description: "No se pudieron importar los datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Migrar Estudiantes</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        {/* Sección de descarga de plantilla */}
        <div className="border-b pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Plantilla de Ejemplo</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Descarga la plantilla con el formato correcto y datos de ejemplo
              </p>
            </div>
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>
          </div>
        </div>

        {/* Sección de importación */}
        <label className="block text-sm font-medium">Archivo CSV o Excel</label>
        <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />

        <label className="inline-flex items-center space-x-2">
          <input
            type="checkbox"
            checked={skipErrors}
            onChange={(e) => setSkipErrors(e.target.checked)}
            className="border rounded"
          />
          <span>Omitir errores y continuar con los registros válidos</span>
        </label>

        <Button onClick={handleImport} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importando...
            </>
          ) : (
            "Importar Estudiantes"
          )}
        </Button>
        {isLoading && (
          <div className="space-y-1">
            <Progress value={progress} />
            <div className="text-sm text-muted-foreground">{progress}%</div>
          </div>
        )}
      </div>
    </div>
  )
}
