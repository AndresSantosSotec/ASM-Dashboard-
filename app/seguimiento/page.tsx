"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Prospecto {
  id: string
  nombre: string
  email: string
  telefono: string
  estado: "Contactado" | "Interesado" | "En proceso"
  asesor: string
}

const prospectos: Prospecto[] = [
  {
    id: "1",
    nombre: "Juan Pérez",
    email: "juan@example.com",
    telefono: "123456789",
    estado: "Contactado",
    asesor: "Carlos Rodríguez",
  },
  {
    id: "2",
    nombre: "María García",
    email: "maria@example.com",
    telefono: "987654321",
    estado: "Interesado",
    asesor: "Ana López",
  },
  {
    id: "3",
    nombre: "Pedro Sánchez",
    email: "pedro@example.com",
    telefono: "456789123",
    estado: "En proceso",
    asesor: "Carlos Rodríguez",
  },
]

const actividades = [
  {
    tipo: "Llamada",
    fecha: "15/05/2023 10:00",
    duracion: "15 min",
    notas: "El prospecto está interesado en el programa de marketing",
    asesor: "Carlos Rodríguez",
  },
  {
    tipo: "Correo",
    fecha: "16/05/2023 14:30",
    duracion: "N/A",
    notas: "Envío de información detallada sobre el programa",
    asesor: "Carlos Rodríguez",
  },
]

export default function SeguimientoPage() {
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())

  const getEstadoColor = (estado: Prospecto["estado"]) => {
    switch (estado) {
      case "Contactado":
        return "bg-yellow-100 text-yellow-800"
      case "Interesado":
        return "bg-green-100 text-green-800"
      case "En proceso":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Panel de Seguimiento del Asesor</h1>
          <p className="text-sm text-gray-500">Gestione el seguimiento de sus prospectos asignados</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Lista de Prospectos</h2>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Asesor</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prospectos.map((prospecto) => (
                <TableRow key={prospecto.id}>
                  <TableCell>{prospecto.nombre}</TableCell>
                  <TableCell>{prospecto.email}</TableCell>
                  <TableCell>{prospecto.telefono}</TableCell>
                  <TableCell>
                    <Badge className={getEstadoColor(prospecto.estado)}>{prospecto.estado}</Badge>
                  </TableCell>
                  <TableCell>{prospecto.asesor}</TableCell>
                  <TableCell>
                    <Button variant="default" onClick={() => setSelectedProspecto(prospecto)}>
                      Ver detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedProspecto} onOpenChange={() => setSelectedProspecto(null)}>
        <DialogContent className="max-w-4xl">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold flex justify-between items-center">
                  Información del Prospecto
                  <Badge className={selectedProspecto ? getEstadoColor(selectedProspecto.estado) : ""}>
                    {selectedProspecto?.estado}
                  </Badge>
                </h2>
                <div className="mt-4 space-y-2">
                  <p className="text-lg font-medium">{selectedProspecto?.nombre}</p>
                  <p className="text-gray-500">{selectedProspecto?.email}</p>
                  <p className="text-gray-500">{selectedProspecto?.telefono}</p>
                </div>
              </div>

              <div>
                <h3 className="text-md font-semibold mb-2">Asesor asignado: {selectedProspecto?.asesor}</h3>
                <Select defaultValue={selectedProspecto?.estado.toLowerCase()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contactado">Contactado</SelectItem>
                    <SelectItem value="interesado">Interesado</SelectItem>
                    <SelectItem value="en_proceso">En proceso</SelectItem>
                    <SelectItem value="matriculado">Matriculado</SelectItem>
                    <SelectItem value="no_interesado">No volver a contactar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="text-md font-semibold mb-2">Historial de Actividades</h3>
                <div className="space-y-4">
                  {actividades.map((actividad, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{actividad.tipo}</span>
                        <span className="text-gray-500">{actividad.fecha}</span>
                      </div>
                      <p className="text-sm mt-1">{actividad.notas}</p>
                      <div className="flex justify-between text-sm mt-2 text-gray-500">
                        <span>Duración: {actividad.duracion}</span>
                        <span>{actividad.asesor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-md font-semibold mb-4">Agregar Interacción</h3>
                <div className="space-y-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de interacción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llamada">Llamada</SelectItem>
                      <SelectItem value="correo">Correo</SelectItem>
                      <SelectItem value="reunion">Reunión</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="datetime-local" />
                  <Input placeholder="Duración (minutos)" />
                  <Textarea placeholder="Notas" className="min-h-[100px]" />
                  <Button className="w-full">Agregar Interacción</Button>
                </div>
              </div>

              <div>
                <h3 className="text-md font-semibold mb-4">Calendario y Citas</h3>
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Citas programadas:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>20/05/2023 11:00 - Reunión</span>
                      <Badge>Presentación del programa</Badge>
                    </div>
                  </div>
                  <Button className="w-full mt-4">Agendar Nueva Cita</Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

