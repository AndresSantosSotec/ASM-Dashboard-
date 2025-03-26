"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Prospecto {
  id: string
  nombre: string
  email: string
  telefono: string
  estado: string
  notasGenerales?: string
  observaciones?: string
}

interface EditarProspectoProps {
  prospecto: Prospecto
  onClose: () => void
}

export default function EditarProspecto({ prospecto, onClose }: EditarProspectoProps) {
  // Estados locales para cada campo (puedes inicializarlos con los valores del prospecto)
  const [nombre, setNombre] = useState(prospecto.nombre)
  const [email, setEmail] = useState(prospecto.email)
  const [telefono, setTelefono] = useState(prospecto.telefono)
  const [estado, setEstado] = useState(prospecto.estado)
  const [notasGenerales, setNotasGenerales] = useState(prospecto.notasGenerales || "")
  const [observaciones, setObservaciones] = useState(prospecto.observaciones || "")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Aquí implementarías la lógica para guardar los cambios,
    // por ejemplo, enviar los datos actualizados a tu API.
    const updatedData = {
      id: prospecto.id,
      nombre,
      email,
      telefono,
      estado,
      notasGenerales,
      observaciones,
    }
    console.log("Datos a guardar:", updatedData)
    // Una vez guardado, cierra el modal.
    onClose()
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
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1"
            />
          </div>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <Input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="mt-1"
            />
          </div>
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <Select value={estado} onValueChange={(value) => setEstado(value)}>
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
          {/* Notas Generales */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Notas Generales</label>
            <Textarea
              value={notasGenerales}
              onChange={(e) => setNotasGenerales(e.target.value)}
              className="mt-1"
              placeholder="Agrega nuevas notas..."
            />
          </div>
          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
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
