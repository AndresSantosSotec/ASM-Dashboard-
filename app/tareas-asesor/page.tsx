"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdvisorTasks } from "@/components/advisor/advisor-tasks"
import { useRouter } from "next/navigation"

export default function TareasAsesorPage() {
  const router = useRouter()

  return (
    <div className="p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Tareas del Asesor</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>
      </div>

      <AdvisorTasks />
    </div>
  )
}

