"use client"

import { useState } from "react"
import Swal from "sweetalert2"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { API_BASE_URL } from "@/utils/apiConfig"

interface Prospecto {
  id: string
  nombre: string
  estado: string
}

interface CambiarEstadoProps {
  prospecto: Prospecto
  onClose: () => void
}

const API_URL = `${API_BASE_URL}/api`

export default function CambiarEstado({ prospecto, onClose }: CambiarEstadoProps) {
  const [selectedEstado, setSelectedEstado] = useState(prospecto.estado)

  const handleSave = async () => {
    const payload = { status: selectedEstado }
    console.log("🔄 Enviando cambio de estado:", payload)

    try {
      const token = localStorage.getItem("token") || ""
      const res = await fetch(
        `${API_URL}/prospectos/${prospecto.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      const body = await res.json()
      console.log("📥 Respuesta status API:", body)

      if (!res.ok) {
        throw new Error(body.message || `HTTP ${res.status}`)
      }

      // 1) Cierro el modal
      onClose()

      // 2) Muestro SweetAlert sin el modal encima
      await Swal.fire({
        icon: "success",
        title: "¡Estado actualizado!",
        text: `El prospecto ahora está en "${selectedEstado}".`,
        confirmButtonText: "Aceptar"
      })

      // 3) Recargo la página
      window.location.reload()

    } catch (err: any) {
      console.error("❌ Error actualizando estado:", err)
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo actualizar el estado.",
      })
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Estado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={selectedEstado} onValueChange={(val) => setSelectedEstado(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="No contactado">No contactado</SelectItem>
              <SelectItem value="En seguimiento">En seguimiento</SelectItem>
              <SelectItem value="Le interesa a futuro">Le interesa a futuro</SelectItem>
              <SelectItem value="Perdido">Perdido</SelectItem>
              <SelectItem value="Inscrito">Inscrito</SelectItem>
              <SelectItem value="Promesa de pago">Promesa de pago</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}