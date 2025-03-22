"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, UserPlus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Asesor {
  id: string
  nombre: string
  email: string
  telefono: string
  especialidad: string
}

const mockAsesores: Asesor[] = [
  {
    id: "1",
    nombre: "Carlos Rodríguez",
    email: "carlos@example.com",
    telefono: "123456789",
    especialidad: "Marketing",
  },
  {
    id: "2",
    nombre: "Ana López",
    email: "ana@example.com",
    telefono: "987654321",
    especialidad: "Finanzas",
  },
]

export function GestionAsesores() {
  const [asesores, setAsesores] = useState<Asesor[]>(mockAsesores)
  const [newAsesorModalOpen, setNewAsesorModalOpen] = useState(false)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Asesores</CardTitle>
        <Button onClick={() => setNewAsesorModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Asesor
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {asesores.map((asesor) => (
              <TableRow key={asesor.id}>
                <TableCell>{asesor.nombre}</TableCell>
                <TableCell>{asesor.email}</TableCell>
                <TableCell>{asesor.telefono}</TableCell>
                <TableCell>{asesor.especialidad}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                      <DropdownMenuItem>Editar perfil</DropdownMenuItem>
                      <DropdownMenuItem>Desactivar cuenta</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

