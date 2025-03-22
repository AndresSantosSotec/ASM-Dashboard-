"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Prospecto {
  id: string
  nombre: string
  email: string
  telefono: string
  departamento: string
  estado: string
}

interface DetallesProspectoProps {
  prospecto: Prospecto
  onClose: () => void
}

export default function DetallesProspecto({ prospecto, onClose }: DetallesProspectoProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalles del Prospecto</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-gray-500 mb-4">Información detallada del prospecto {prospecto.nombre}</div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha:</label>
            <div className="mt-1">2023-10-01</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre:</label>
            <div className="mt-1">{prospecto.nombre}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono:</label>
            <div className="mt-1">{prospecto.telefono}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo:</label>
            <div className="mt-1">{prospecto.email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Empresa donde labora:</label>
            <div className="mt-1">{prospecto.departamento}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Puesto:</label>
            <div className="mt-1">-</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

