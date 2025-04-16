"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface Interaction {
  id: string
  leadId: string
  leadName: string
  date: string
  type: string
  notes: string
  advisor: string
}

interface Prospecto {
  id: string
  nombre: string
  email: string
  telefono: string
  departamento: string
  estado: string
  ultimoCambio: string
}




// Datos de ejemplo para mostrar inicialmente
const initialInteractions: Interaction[] = [
  {
    id: "1",
    leadId: "L001",
    leadName: "Juan Pérez",
    date: "2023-05-15",
    type: "llamada",
    notes: "El prospecto está interesado en el programa de marketing",
    advisor: "Carlos Rodríguez",
  },
  {
    id: "2",
    leadId: "L002",
    leadName: "María García",
    date: "2023-05-16",
    type: "email",
    notes: "Envío de información detallada sobre el programa",
    advisor: "Ana López",
  },
]

export default function InteraccionesLeadsPage() {
  const [interactions, setInteractions] = useState<Interaction[]>(initialInteractions)
  const [newInteraction, setNewInteraction] = useState({
    leadId: "",
    leadName: "",
    date: "",
    type: "",
    notes: "",
    advisor: "",
  })
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewInteraction((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewInteraction((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddInteraction = () => {
    if (
      newInteraction.leadId &&
      newInteraction.leadName &&
      newInteraction.date &&
      newInteraction.type &&
      newInteraction.advisor
    ) {
      setInteractions((prev) => [...prev, { ...newInteraction, id: Date.now().toString() }])
      setNewInteraction({ leadId: "", leadName: "", date: "", type: "", notes: "", advisor: "" })

      toast({
        title: "Interacción agregada",
        description: "La interacción ha sido registrada correctamente",
      })
    } else {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Interacciones con Leads</h1>
        <p className="text-sm text-gray-500">Gestione y registre las interacciones con sus prospectos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Nueva Interacción</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leadId">ID del Lead</Label>
                <Input
                  id="leadId"
                  name="leadId"
                  value={newInteraction.leadId}
                  onChange={handleInputChange}
                  placeholder="ID del Lead"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadName">Nombre del Prospecto</Label>
                <Input
                  id="leadName"
                  name="leadName"
                  value={newInteraction.leadName}
                  onChange={handleInputChange}
                  placeholder="Nombre del Prospecto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" name="date" type="date" value={newInteraction.date} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de interacción</Label>
                <Select value={newInteraction.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llamada">Llamada</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="reunion">Reunión</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="advisor">Asesor</Label>
                <Input
                  id="advisor"
                  name="advisor"
                  value={newInteraction.advisor}
                  onChange={handleInputChange}
                  placeholder="Nombre del Asesor"
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-3">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={newInteraction.notes}
                  onChange={handleInputChange}
                  placeholder="Notas de la interacción"
                />
              </div>
            </div>
            <Button onClick={handleAddInteraction} className="w-full sm:w-auto">
              Agregar Interacción
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Historial de Interacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Prospecto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Asesor</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interactions.map((interaction) => (
                  <TableRow key={interaction.id}>
                    <TableCell>
                      <div>
                        <div>{interaction.leadName}</div>
                        <div className="md:hidden text-xs text-gray-500">{interaction.type}</div>
                        <div className="md:hidden text-xs text-gray-500">{interaction.advisor}</div>
                      </div>
                    </TableCell>
                    <TableCell>{interaction.date}</TableCell>
                    <TableCell className="hidden md:table-cell">{interaction.type}</TableCell>
                    <TableCell className="hidden md:table-cell">{interaction.advisor}</TableCell>
                    <TableCell className="max-w-[150px] md:max-w-none truncate">{interaction.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

