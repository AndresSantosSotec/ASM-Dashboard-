// components/EditProspecto.tsx
"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Swal from "sweetalert2"
import { API_BASE_URL } from "@/utils/apiConfig"

interface Prospecto {
  id: string
  nombre: string       // en la lista padre esto es nombre_completo
  email: string        // en la lista padre esto es correo_electronico
  telefono: string
  estado: string       // en la lista padre esto es status
  observaciones?: string
}

interface EditarProspectoProps {
  prospecto: Prospecto
  onClose: () => void
}

const API_URL = `${API_BASE_URL}/api`

export default function EditarProspecto({ prospecto, onClose }: EditarProspectoProps) {
  // inicializa los estados con las props
  const [nombreCompleto, setNombreCompleto] = useState(prospecto.nombre)
  const [correoElectronico, setCorreoElectronico] = useState(prospecto.email)
  const [telefono, setTelefono] = useState(prospecto.telefono)
  const [status, setStatus] = useState(prospecto.estado)
  const [observaciones, setObservaciones] = useState(prospecto.observaciones || "")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // aquí sí uso los nombres que valida tu controlador
    const updatedData = {
      nombreCompleto,
      correoElectronico,
      telefono,
      status,
      observaciones,
    }

    console.log("🔄 Enviando datos de actualización:", updatedData)

    try {
      const token = localStorage.getItem("token") || ""
      const res = await fetch(`${API_URL}/prospectos/${prospecto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      })

      const body = await res.json()
      console.log("📥 Respuesta del backend:", body)

      if (!res.ok) {
        throw new Error(body.message || `HTTP ${res.status}`)
      }

      onClose() // cierra el modal primero

      await Swal.fire({
        icon: "success",
        title: "¡Listo!",
        text: "El prospecto ha sido actualizado correctamente.",
        confirmButtonText: "Aceptar"
      })

      window.location.reload()

    } catch (err: any) {
      console.error("❌ Error actualizando prospecto:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Ocurrió un error, intenta de nuevo más tarde.",
      })
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Editar Prospecto</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <Input
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-sm font-medium">Email</label>
            <Input
              value={correoElectronico}
              onChange={(e) => setCorreoElectronico(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium">Teléfono</label>
            <Input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium">Estado</label>
            <Select value={status} onValueChange={(val) => setStatus(val)}>
              <SelectTrigger className="mt-1">
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
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium">Observaciones</label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="mt-1"
              placeholder="Cambia o agrega observaciones..."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Guardar cambios</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
