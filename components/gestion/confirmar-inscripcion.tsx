"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Prospecto {
  id: string
  nombre: string
}

interface ConfirmarInscripcionProps {
  prospecto: Prospecto
  onClose: () => void
}

export default function ConfirmarInscripcion({ prospecto, onClose }: ConfirmarInscripcionProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar inscripción</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas pasar este prospecto al módulo de inscripción para su gestión?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

