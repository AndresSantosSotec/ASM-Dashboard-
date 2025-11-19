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
  departamento: string
  puesto: string
  estado: string       // en la lista padre esto es status
  origen?: string
  observaciones?: string
  notasGenerales?: string
  ultimoCambio: string
  programa?: string
  ciudad?: string
  pais?: string
  fechaCaptura?: string
  asesor?: string
}

interface EditarProspectoProps {
  prospecto: Prospecto
  onClose: () => void
  onUpdate?: (updatedProspecto: Prospecto) => void
}

const API_URL = `${API_BASE_URL}/api`

export default function EditarProspecto({ prospecto, onClose, onUpdate }: EditarProspectoProps) {
  // inicializa los estados con las props
  const [nombreCompleto, setNombreCompleto] = useState(prospecto.nombre)
  const [correoElectronico, setCorreoElectronico] = useState(prospecto.email)
  const [telefono, setTelefono] = useState(prospecto.telefono)
  const [status, setStatus] = useState(prospecto.estado)
  const [observaciones, setObservaciones] = useState(prospecto.observaciones || "")
  const [loading, setLoading] = useState(false)

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

    setLoading(true);
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
        const errorMsg = body.messages?.correoElectronico?.[0] || body.message || `HTTP ${res.status}`;
        throw new Error(errorMsg)
      }

      // ✅ Actualización optimista: actualizar datos sin recargar
      const updatedProspecto: Prospecto = {
        ...prospecto,
        nombre: nombreCompleto,
        email: correoElectronico,
        telefono: telefono,
        estado: status,
        observaciones: observaciones,
        ultimoCambio: new Date().toISOString()
      };

      // Invalidar caché
      localStorage.removeItem("gestion_prospectos_cache");
      localStorage.removeItem("gestion_prospectos_cache_time");

      onClose() // cierra el modal primero

      // Llamar callback de actualización
      if (onUpdate) {
        onUpdate(updatedProspecto);
      }

      await Swal.fire({
        icon: "success",
        title: "¡Listo!",
        text: "El prospecto ha sido actualizado correctamente.",
        timer: 2000,
        showConfirmButton: false
      })

    } catch (err: any) {
      console.error("❌ Error actualizando prospecto:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Ocurrió un error, intenta de nuevo más tarde.",
      })
    } finally {
      setLoading(false);
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
