"use client"

import React, { useState, useEffect } from "react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FichaEstudiante } from "@/components/inscripcion/types" // Importa el tipo completo
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  MoreHorizontal, Search, Filter, FileSpreadsheet, Calendar, Download,
  Eye, CheckCircle, XCircle,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import FichaDetalleModal from "@/components/inscripcion/modal/FichaDetalleModal"
// Removed local declaration of FichaEstudiante as it is already imported

export function GestionFichas() {
  const [fichas, setFichas] = useState<FichaEstudiante[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todas")
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos")

  // ---- Estado y handlers para el modal de detalle ----
  const [selectedFicha, setSelectedFicha] = useState<FichaEstudiante | null>(null)
  const [isDetalleModalOpen, setDetalleModalOpen] = useState(false)

  const handleViewDetalle = (ficha: FichaEstudiante) => {
    setSelectedFicha(ficha)
    setDetalleModalOpen(true)
  }
  const handleCloseDetalle = () => setDetalleModalOpen(false)

  // ---- Handlers para aprobar/rechazar ----
  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`http://localhost:8000/api/fichas/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      // Actualiza el estado local (o recarga la lista)
      setFichas((prev) =>
        prev.map((f) => (f.id === id ? { ...f, estado: "revisada" } : f))
      )
    } catch (err) {
      console.error("Error al aprobar ficha", err)
    }
  }

  const handleReject = async (id: number) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`http://localhost:8000/api/fichas/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      // Quita la ficha rechazada del listado (o recarga)
      setFichas((prev) => prev.filter((f) => f.id !== id))
    } catch (err) {
      console.error("Error al rechazar ficha", err)
    }
  }

  useEffect(() => {
    const fetchFichas = async () => {
      try {
        const url = "http://localhost:8000/api/prospectos/fichas/pendientes-public";
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const { data } = await res.json();

        // Aquí mapeamos cada 'raw' a tu tipo FichaEstudiante
        const mapped: FichaEstudiante[] = data.map((raw: any) => ({
          id: raw.id,
          nombre: raw.nombre_completo,           // <— nombre_completo → nombre
          programa: raw.nombre_programa,         // <— nombre_programa → programa
          fecha: raw.created_at?.split("T")[0] || "",  // si lo tienes en el JSON
          estado: raw.status,                    // <— status → estado
          prioridad: raw.prioridad || "media",   // si no viene, pones un default
          ultimaActualizacion: raw.updated_at || "",
          // Si tu FichaEstudiante tiene más campos, mapea o pon valores por defecto aquí
        }));

        setFichas(mapped);
      } catch (err) {
        console.error("Error cargando fichas:", err);
      }
    };

    fetchFichas();
  }, []);





  const filteredFichas = fichas.filter((ficha) => {
    // Convertir a string por defecto para evitar undefined
    const nombre = ficha.nombre ?? ""
    const programa = ficha.programa ?? ""
    const idStr = ficha.id?.toString() ?? ""
    const term = searchTerm.toLowerCase()

    const matchesSearch =
      nombre.toLowerCase().includes(term) ||
      programa.toLowerCase().includes(term) ||
      idStr.includes(term)

    const matchesEstado = filtroEstado === "todos" || ficha.estado === filtroEstado
    const matchesPrioridad = filtroPrioridad === "todas" || ficha.prioridad === filtroPrioridad
    const matchesPeriodo = filtroPeriodo === "todos" || true

    return matchesSearch && matchesEstado && matchesPrioridad && matchesPeriodo
  })
  const getBadgeForEstado = (estado: string) => {
    switch (estado) {
      case "completa":
        return <Badge className="bg-green-100 text-green-800">Completa</Badge>
      case "incompleta":
        return <Badge className="bg-yellow-100 text-yellow-800">Incompleta</Badge>
      case "revisada":
        return <Badge className="bg-blue-100 text-blue-800">Revisada</Badge>
      case "correccion_solicitada":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            Corrección Solicitada
          </Badge>
        )
      default:
        return null
    }
  }

  const getBadgeForPrioridad = (prioridad?: string) => {
    switch (prioridad) {
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
      {/* ... filtros y buscador (igual que antes) ... */}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Listado de Fichas</CardTitle>
            <Badge className="bg-blue-100 text-blue-800">
              <Calendar className="mr-1 h-3 w-3" /> Actualizado
            </Badge>
          </div>
          <CardDescription>
            Visualice la información de las fichas registradas
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
              {filteredFichas.map((ficha) => (
                <TableRow key={ficha.id}>
                  <TableCell>{ficha.id}</TableCell>
                  <TableCell>{ficha.nombre}</TableCell>
                  <TableCell>{ficha.programa}</TableCell>
                  <TableCell>{ficha.fecha}</TableCell>
                  <TableCell>{getBadgeForEstado(ficha.estado)}</TableCell>
                  <TableCell>{getBadgeForPrioridad(ficha.prioridad)}</TableCell>
                  <TableCell>{ficha.ultimaActualizacion}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {/* Ver detalle */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          console.log("⇨ handleViewDetalle — ficha seleccionada:", ficha);
                          handleViewDetalle(ficha);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>


                      {/* Aprobar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleApprove(ficha.id)}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>

                      {/* Rechazar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReject(ficha.id)}
                      >
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
            <Button variant="outline" size="sm">
              Anterior
            </Button>
            <Button variant="outline" size="sm">
              Siguiente
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Modal de detalle */}
      {selectedFicha && (
        <FichaDetalleModal
          isOpen={isDetalleModalOpen}
          onClose={handleCloseDetalle}
          ficha={{
            ...selectedFicha,
            prioridad: selectedFicha?.prioridad ?? "baja",
            fecha: selectedFicha?.fecha ?? "",
            ultimaActualizacion: selectedFicha?.ultimaActualizacion ?? ""
          }}
          onMarcarRevisada={() => console.log("Marcar como revisada")}
          onSolicitarCorreccion={() => console.log("Solicitar corrección")}
          comentarioRevision=""
          setComentarioRevision={(comentario) => console.log("Comentario de revisión:", comentario)}
          camposValidados={{}}  // <-- Pasa un objeto vacío en lugar de undefined
          handleToggleValidacion={(campo, valor) => console.log(campo, valor)}
          showSuccessMessage={false}
        />
      )}
    </div>
  )
}
