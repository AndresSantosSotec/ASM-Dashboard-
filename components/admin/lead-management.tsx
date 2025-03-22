"use client"

import { useState } from "react"
import { Search, Plus, Upload, MoreHorizontal, ChevronLeft, ChevronRight, UserPlus, Zap } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

// Mock data
const mockLeads = [
  {
    id: "1",
    name: "Juan Pérez",
    email: "juan@example.com",
    phone: "1234567890",
    status: "Nuevo",
    assignedTo: "Carlos Rodríguez",
  },
  {
    id: "2",
    name: "María García",
    email: "maria@example.com",
    phone: "9876543210",
    status: "En seguimiento",
    assignedTo: "Ana López",
  },
  {
    id: "3",
    name: "Pedro Sánchez",
    email: "pedro@example.com",
    phone: "5555555555",
    status: "Convertido",
    assignedTo: "Carlos Rodríguez",
  },
  {
    id: "4",
    name: "Ana Martínez",
    email: "ana@example.com",
    phone: "1112223333",
    status: "No interesado",
    assignedTo: "Sin asignar",
  },
]

// Mock advisors
const mockAdvisors = [
  {
    id: "1",
    name: "Carlos Rodríguez",
    specialty: "Marketing",
    currentLoad: 12,
  },
  {
    id: "2",
    name: "Ana López",
    specialty: "Finanzas",
    currentLoad: 8,
  },
  {
    id: "3",
    name: "Miguel Hernández",
    specialty: "Tecnología",
    currentLoad: 15,
  },
  {
    id: "4",
    name: "Laura Martínez",
    specialty: "Recursos Humanos",
    currentLoad: 10,
  },
]

export function LeadManagement() {
  const [importLeadsModalOpen, setImportLeadsModalOpen] = useState(false)
  const [manualAssignModalOpen, setManualAssignModalOpen] = useState(false)
  const [autoAssignModalOpen, setAutoAssignModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>("")
  const { toast } = useToast()

  const handleAssignLead = (leadId: string) => {
    const lead = mockLeads.find((l) => l.id === leadId)
    setSelectedLead(lead)
    setManualAssignModalOpen(true)
  }

  const handleManualAssign = () => {
    if (!selectedAdvisor) {
      toast({
        title: "Error",
        description: "Por favor seleccione un asesor",
        variant: "destructive",
      })
      return
    }

    // Aquí iría la lógica para asignar el lead al asesor
    toast({
      title: "Lead asignado",
      description: `El lead ${selectedLead?.name} ha sido asignado a ${mockAdvisors.find((a) => a.id === selectedAdvisor)?.name}`,
    })
    setManualAssignModalOpen(false)
    setSelectedLead(null)
    setSelectedAdvisor("")
  }

  const handleAutoAssign = () => {
    // Aquí iría la lógica para asignar automáticamente los leads
    toast({
      title: "Asignación automática completada",
      description: "Los leads han sido asignados automáticamente a los asesores según su carga y especialidad",
    })
    setAutoAssignModalOpen(false)
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Gestión de Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Input placeholder="Buscar leads..." className="w-full sm:w-[300px]" />
            <Button variant="outline" className="w-full sm:w-auto">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Lead
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setImportLeadsModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar Leads
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setAutoAssignModalOpen(true)}>
              <Zap className="h-4 w-4 mr-2" />
              Asignación Automática
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Asignado a</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        lead.status === "Nuevo"
                          ? "default"
                          : lead.status === "En seguimiento"
                            ? "secondary"
                            : lead.status === "Convertido"
                              ? "success"
                              : "outline"
                      }
                    >
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{lead.assignedTo}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAssignLead(lead.id)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Asignar a asesor
                        </DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                        <DropdownMenuItem>Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          <Button variant="outline" size="sm">
            Siguiente
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>

      {/* Modal para asignación manual de leads */}
      <Dialog open={manualAssignModalOpen} onOpenChange={setManualAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Lead a Asesor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lead seleccionado</Label>
              <div className="p-2 border rounded-md">
                <p className="font-medium">{selectedLead?.name}</p>
                <p className="text-sm text-gray-500">{selectedLead?.email}</p>
                <p className="text-sm text-gray-500">{selectedLead?.phone}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="advisor">Seleccionar Asesor</Label>
              <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar asesor" />
                </SelectTrigger>
                <SelectContent>
                  {mockAdvisors.map((advisor) => (
                    <SelectItem key={advisor.id} value={advisor.id}>
                      {advisor.name} - {advisor.specialty} ({advisor.currentLoad} leads)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualAssignModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleManualAssign}>Asignar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para asignación automática de leads */}
      <Dialog open={autoAssignModalOpen} onOpenChange={setAutoAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignación Automática de Leads</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>
              La asignación automática distribuirá los leads no asignados entre los asesores disponibles, considerando
              su carga actual de trabajo y especialidad.
            </p>
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-700 mb-2">Criterios de asignación:</h4>
              <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                <li>Carga de trabajo actual del asesor</li>
                <li>Especialidad del asesor vs. interés del lead</li>
                <li>Rendimiento histórico del asesor</li>
                <li>Idioma preferido del lead</li>
              </ul>
            </div>
            <div className="bg-amber-50 p-4 rounded-md">
              <h4 className="font-medium text-amber-700">Resumen:</h4>
              <p className="text-sm text-amber-700">Se asignarán 2 leads no asignados a 4 asesores disponibles.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoAssignModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAutoAssign}>Iniciar Asignación Automática</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

