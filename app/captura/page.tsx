"use client"

import CapturaProspectos from "@/components/captura/captura-prospectos"
import { useToast } from "@/components/ui/use-toast"

export default function CapturaPage() {
  const { toast } = useToast()

  const handleSubmit = async (data: any) => {
    try {
      // Aquí iría la llamada a la API
      console.log("Datos del prospecto:", data)

      toast({
        title: "Prospecto guardado",
        description: "Los datos del prospecto se han guardado correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al guardar los datos. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-4">
      <CapturaProspectos onSubmit={handleSubmit} />
    </div>
  )
}

