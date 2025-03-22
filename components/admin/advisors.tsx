"use client"

import { useState } from "react"
import { UserPlus, MoreHorizontal } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data
const mockAdvisorData = [
  {
    id: "1",
    name: "Carlos Rodríguez",
    leads: 45,
    conversions: 12,
    revenue: 24500,
  },
  {
    id: "2",
    name: "Ana López",
    leads: 38,
    conversions: 9,
    revenue: 18200,
  },
  {
    id: "3",
    name: "Miguel Hernández",
    leads: 52,
    conversions: 15,
    revenue: 31000,
  },
  {
    id: "4",
    name: "Laura Martínez",
    leads: 29,
    conversions: 7,
    revenue: 14300,
  },
]

export function Advisors() {
  const [newAdvisorModalOpen, setNewAdvisorModalOpen] = useState(false)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Rendimiento de Asesores</CardTitle>
        <Button onClick={() => setNewAdvisorModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Asesor
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead>Conversiones</TableHead>
              <TableHead>Ingresos</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAdvisorData.map((advisor) => (
              <TableRow key={advisor.id}>
                <TableCell>{advisor.name}</TableCell>
                <TableCell>{advisor.leads}</TableCell>
                <TableCell>{advisor.conversions}</TableCell>
                <TableCell>Q{advisor.revenue}</TableCell>
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

