// components/inscripcion/GestionFichas.tsx
"use client"

import React, { useState, useEffect } from "react"
import Swal from "sweetalert2"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Eye, CheckCircle, XCircle, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FichaEstudiante } from "@/components/inscripcion/types"
import FichaDetalleModal from "@/components/inscripcion/modal/FichaDetalleModal"
import { API_BASE_URL } from "@/utils/apiConfig"

const API_URL = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL
const CONTEO_REVISADAS_KEY = "fichasRevisadasCount"

function incrementarRevisadas() {
  const actual = parseInt(
    localStorage.getItem(CONTEO_REVISADAS_KEY) ?? "0",
    10
  )
  localStorage.setItem(CONTEO_REVISADAS_KEY, String(actual + 1))
}

export function GestionFichas() {
  const [fichas, setFichas] = useState<FichaEstudiante[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todas")
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos")

  const [selectedFicha, setSelectedFicha] = useState<FichaEstudiante | null>(null)
  const [activeTab, setActiveTab] = useState<"fichas" | "documentos">("fichas")
  const [isDetalleModalOpen, setDetalleModalOpen] = useState(false)

  useEffect(() => {
    async function fetchFichas() {
      try {
        const res = await fetch(
          `${API_URL}/prospectos/fichas/pendientes-public`,
          { headers: { Accept: "application/json" } }
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { data } = await res.json()
        const mapped: FichaEstudiante[] = data.map((raw: any) => ({
          id: raw.id,
          nombre: raw.nombre_completo,
          telefono: raw.telefono,
          correo: raw.correo,
          departamento: raw.departamento,
          programa: raw.nombre_programa,
          fecha: raw.created_at?.split("T")[0] ?? "",
          estado: raw.status,
          prioridad: (raw.prioridad as "alta" | "media" | "baja") || "media",
          ultimaActualizacion: raw.updated_at ?? "",
          documentos: [],
        }))
        setFichas(mapped)
      } catch (err) {
        console.error("Error cargando fichas:", err)
        Swal.fire("Error", "No se pudieron cargar las fichas", "error")
      }
    }
    fetchFichas()
  }, [])

  const handleViewDetalle = async (f: FichaEstudiante) => {
    setSelectedFicha(f)
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(
        `${API_URL}/documentos/prospecto/${f.id}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            Accept: "application/json",
          },
        }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const docs = await res.json()
      setSelectedFicha({ ...f, documentos: docs })
      setActiveTab("documentos")
      setDetalleModalOpen(true)
    } catch (err) {
      console.error("Error cargando documentos:", err)
      Swal.fire("Error", "No se pudieron cargar los documentos.", "error")
    }
  }

  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/prospectos/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ status: "aprobada" }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setFichas(prev =>
        prev.map(f => (f.id === id ? { ...f, estado: "aprobada" } : f))
      )
      incrementarRevisadas()
      await Swal.fire({
        icon: "success",
        title: "Ficha aprobada",
        text: "El estado ha cambiado a APROBADA",
        timer: 1800,
        showConfirmButton: false,
      })
    } catch (err) {
      console.error("Error al aprobar ficha", err)
      Swal.fire("Oops...", "No se pudo aprobar la ficha", "error")
    }
  }

  const handleReject = async (id: number) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/fichas/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setFichas(prev => prev.filter(f => f.id !== id))
      Swal.fire({ icon: "info", title: "Ficha rechazada", timer: 1200, showConfirmButton: false })
    } catch (err) {
      console.error("Error al rechazar ficha", err)
      Swal.fire("Error", "No se pudo rechazar la ficha", "error")
    }
  }

  const filteredFichas = fichas.filter(f => {
    const term = searchTerm.toLowerCase()
    return (
      (f.nombre.toLowerCase().includes(term) ||
        f.programa.toLowerCase().includes(term) ||
        f.id.toString().includes(term)) &&
      (filtroEstado === "todos" || f.estado === filtroEstado) &&
      (filtroPrioridad === "todas" || f.prioridad === filtroPrioridad) &&
      (filtroPeriodo === "todos")
    )
  })

  const getBadgeForEstado = (e: string) => {
    switch (e) {
      case "aprobada":
        return <Badge className="bg-green-200 text-green-900">Aprobada</Badge>
      case "completa":
        return <Badge className="bg-green-100 text-green-800">Completa</Badge>
      case "incompleta":
        return <Badge className="bg-yellow-100 text-yellow-800">Incompleta</Badge>
      case "revisada":
        return <Badge className="bg-blue-100 text-blue-800">Revisada</Badge>
      case "correccion_solicitada":
        return <Badge className="bg-orange-100 text-orange-800">Corrección Solicitada</Badge>
      default:
        return null
    }
  }

  const getBadgeForPrioridad = (p?: string) => {
    switch (p) {
      case "alta":
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>
      case "media":
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>
      case "baja":
        return <Badge className="bg-blue-100 text-blue-800">Baja</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <Label>Buscar</Label>
          <Input
            placeholder="Nombre, programa o ID"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label>Estado</Label>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="completa">Completa</SelectItem>
              <SelectItem value="incompleta">Incompleta</SelectItem>
              <SelectItem value="revisada">Revisada</SelectItem>
              <SelectItem value="correccion_solicitada">Corrección Solicitada</SelectItem>
              <SelectItem value="aprobada">Aprobada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Prioridad</Label>
          <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Período</Label>
          <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Listado de Fichas</CardTitle>
            <Badge className="bg-blue-100 text-blue-800">
              <Calendar className="mr-1 h-3 w-3" /> Actualizado
            </Badge>
          </div>
          <CardDescription>
            Visualiza las fichas registradas y pendientes
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFichas.map(f => (
                <TableRow key={f.id}>
                  <TableCell>{f.id}</TableCell>
                  <TableCell>{f.nombre}</TableCell>
                  <TableCell>{f.programa}</TableCell>
                  <TableCell>{f.fecha}</TableCell>
                  <TableCell>{getBadgeForEstado(f.estado)}</TableCell>
                  <TableCell>{getBadgeForPrioridad(f.prioridad)}</TableCell>
                  <TableCell>{f.ultimaActualizacion}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetalle(f)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleApprove(f.id)} disabled={f.estado === "aprobada"}>
                        <CheckCircle className={`h-4 w-4 ${f.estado === "aprobada" ? "text-gray-400" : "text-green-500"}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleReject(f.id)}>
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredFichas.length} de {fichas.length} fichas
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Anterior</Button>
            <Button variant="outline" size="sm">Siguiente</Button>
          </div>
        </CardFooter>
      </Card>

      {selectedFicha && (
        <FichaDetalleModal
          isOpen={isDetalleModalOpen}
          onClose={() => {
            setDetalleModalOpen(false)
            setSelectedFicha(null)
          }}
          ficha={selectedFicha}
          onMarcarRevisada={() => selectedFicha && handleApprove(selectedFicha.id)}
          onSolicitarCorreccion={() => console.log("Solicitar corrección")}
          comentarioRevision=""
          showSuccessMessage={false}
        />
      )}
    </div>
  )
}
