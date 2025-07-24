"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2 } from "lucide-react"
import { API_BASE_URL } from "@/utils/apiConfig"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"

export default function MigrarEstudiantes() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const handleImport = async () => {
    if (!file) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Selecciona un archivo para importar"
      })
      toast({
        title: "Error",
        description: "Selecciona un archivo para importar",
        variant: "destructive"
      })
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    const token = localStorage.getItem("token")

    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/estudiantes/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        },
        body: formData
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || `HTTP error ${res.status}`)
      }

      const data = await res.json()
      Swal.fire({
        icon: "success",
        title: "Importación completada"
      })
      toast({
        title: "Éxito",
        description: data.message
      })
      router.refresh()
    } catch (error: any) {
      console.error("Error en import:", error)
      Swal.fire({
        icon: "error",
        title: "Error en la importación",
        text: error.message
      })
      toast({
        title: "Error",
        description: "No se pudieron importar los datos",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Migrar Estudiantes</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <label className="block text-sm font-medium">Archivo CSV o Excel</label>
        <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
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
      </div>
    </div>
  )
}
