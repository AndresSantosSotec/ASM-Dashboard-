"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { API_BASE_URL } from "@/utils/apiConfig"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"

export default function MigrarEstudiantesPage() {
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    if (selected) setFile(selected)
  }

  const migrarEstudiantes = () => {
    if (!file) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor selecciona un archivo",
      })
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    const token = localStorage.getItem("token")

    fetch(`${API_BASE_URL}/migrar-estudiantes`, {
      method: "POST",
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        Swal.fire({ icon: "success", title: "Migración completada" })
        toast({ title: "Migración completada", description: data.message })
        router.refresh()
      })
      .catch((error) => {
        console.error("Error al migrar estudiantes:", error)
        Swal.fire({ icon: "error", title: "Error", text: error.message })
        toast({
          title: "Error",
          description: "No se pudieron migrar los estudiantes",
          variant: "destructive",
        })
      })
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Importar Estudiantes</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Archivo CSV o Excel</label>
          <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
        </div>
        <Button onClick={migrarEstudiantes}>Migrar Estudiantes</Button>
      </div>
    </div>
  )
}

