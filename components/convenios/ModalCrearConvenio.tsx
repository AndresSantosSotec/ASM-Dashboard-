"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { crearConvenio } from "@/services/convenios"
import Swal from "sweetalert2"

interface Props {
  open: boolean
  onClose: () => void
  onCreado: () => void
}

export default function ModalCrearConvenio({ open, onClose, onCreado }: Props) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [guardando, setGuardando] = useState(false)

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      Swal.fire({ icon: "warning", title: "Campo requerido", text: "El nombre del convenio es obligatorio.", confirmButtonText: "Entendido" })
      return
    }
    setGuardando(true)
    try {
      await crearConvenio({ nombre: nombre.trim(), descripcion: descripcion.trim() || undefined })
      Swal.fire({ icon: "success", title: "Convenio creado", text: "El convenio fue creado exitosamente.", timer: 2000, showConfirmButton: false })
      setNombre("")
      setDescripcion("")
      onCreado()
      onClose()
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data?.errors?.nombre?.[0] || "No se pudo crear el convenio."
      Swal.fire({ icon: "error", title: "Error", text: msg, confirmButtonText: "Entendido" })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0f2744]">Nuevo Convenio</DialogTitle>
          <DialogDescription>Crea un nuevo convenio corporativo. Luego podrás agregar precios por programa.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del convenio *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Banco Industrial"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Descripción del convenio (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={guardando} className="bg-[#0f2744] hover:bg-[#0f2744]/90">
            {guardando ? "Guardando..." : "Crear Convenio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
