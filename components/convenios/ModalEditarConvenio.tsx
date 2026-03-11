"use client"

import { useState, useEffect } from "react"
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
import { actualizarConvenio } from "@/services/convenios"
import type { Convenio } from "@/types/convenios"
import Swal from "sweetalert2"

interface Props {
  open: boolean
  convenio: Convenio
  onClose: () => void
  onActualizado: () => void
}

export default function ModalEditarConvenio({ open, convenio, onClose, onActualizado }: Props) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (convenio) {
      setNombre(convenio.nombre)
      setDescripcion(convenio.descripcion || "")
    }
  }, [convenio])

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      Swal.fire({ icon: "warning", title: "Campo requerido", text: "El nombre del convenio es obligatorio.", confirmButtonText: "Entendido" })
      return
    }
    setGuardando(true)
    try {
      await actualizarConvenio(convenio.id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        activo: convenio.activo,
      })
      Swal.fire({ icon: "success", title: "Convenio actualizado", timer: 1500, showConfirmButton: false })
      onActualizado()
      onClose()
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data?.errors?.nombre?.[0] || "No se pudo actualizar."
      Swal.fire({ icon: "error", title: "Error", text: msg, confirmButtonText: "Entendido" })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0f2744]">Editar Convenio</DialogTitle>
          <DialogDescription>Modifica el nombre o la descripción del convenio.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-nombre">Nombre del convenio *</Label>
            <Input
              id="edit-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-descripcion">Descripción</Label>
            <Textarea
              id="edit-descripcion"
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
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
