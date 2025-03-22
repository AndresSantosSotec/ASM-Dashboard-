"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Prospecto {
  id: string
  nombre: string
  email: string
  telefono: string
  estado: string
}

interface EditarProspectoProps {
  prospecto: Prospecto
  onClose: () => void
}

export default function EditarProspecto({ prospecto, onClose }: EditarProspectoProps) {
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
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <Input defaultValue={prospecto.nombre} className="mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input defaultValue={prospecto.email} className="mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <Input defaultValue={prospecto.telefono} className="mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <Select defaultValue={prospecto.estado}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nuevo">Nuevo</SelectItem>
                <SelectItem value="En proceso">En proceso</SelectItem>
                <SelectItem value="Contactado">Contactado</SelectItem>
                <SelectItem value="Calificado">Calificado</SelectItem>
                <SelectItem value="Propuesta enviada">Propuesta enviada</SelectItem>
                <SelectItem value="En negociación">En negociación</SelectItem>
                <SelectItem value="Ganado">Ganado</SelectItem>
                <SelectItem value="Perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Guardar cambios</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

