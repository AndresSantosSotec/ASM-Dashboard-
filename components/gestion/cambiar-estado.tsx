"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Prospecto {
  id: string
  nombre: string
  estado: string
}

interface CambiarEstadoProps {
  prospecto: Prospecto
  onClose: () => void
}

export default function CambiarEstado({ prospecto, onClose }: CambiarEstadoProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Estado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select defaultValue={prospecto.estado}>
            <SelectTrigger>
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
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

