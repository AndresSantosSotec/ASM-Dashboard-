"use client"

import React, { useState, useEffect } from "react"
import { Header } from "@/components/header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { API_BASE_URL } from "@/utils/apiConfig"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  FileText,
  FileImage,
  FileIcon as FilePdf,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

type EstadoDoc = "pendiente" | "aprobado" | "rechazado"
type Pestaña = EstadoDoc | "todos"

interface Documento {
  id: number
  ruta_archivo: string
  tipo_documento: string
  subida_at: string
  prospecto: {
    id: number
    nombre_completo: string
    programa?: string
  }
  estado: EstadoDoc
}

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [tab, setTab] = useState<Pestaña>("pendiente")
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState<string>("todos")
  const [loading, setLoading] = useState(true)

  // paginación
  const pageSize = 9
  const [currentPage, setCurrentPage] = useState(1)

  // traemos token si usas auth
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : ""

  // --- CARGA INICIAL ---
  useEffect(() => {
    async function loadDocs() {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/documentos`, {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : undefined,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: Documento[] = await res.json()
        // asignamos estado por defecto si no viene
        setDocumentos(
          data.map((d) => ({
            ...d,
            estado: (d as any).estado ?? "pendiente",
          }))
        )
      } catch (err) {
        console.error("Error cargando documentos:", err)
      } finally {
        setLoading(false)
      }
    }
    loadDocs()
  }, [token])

  // --- BORRAR DOCUMENTO ---
  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este documento?")) return
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/documentos/${id}`,
        { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setDocumentos((docs) => docs.filter((d) => d.id !== id))
    } catch (err) {
      console.error("Error eliminando documento:", err)
    }
  }

  // --- APROBAR / RECHAZAR DOCUMENTO ---
  const updateEstado = async (id: number, newEstado: EstadoDoc) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/documentos/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ estado: newEstado }),
        }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // reflejamos en UI
      setDocumentos((docs) =>
        docs.map((d) =>
          d.id === id ? { ...d, estado: newEstado } : d
        )
      )
    } catch (err) {
      console.error("Error actualizando estado:", err)
    }
  }

  // --- FILTRADO / ORDEN / DEDUPE ---
  let filtered = documentos.filter((d) => {
    const nombre = d.prospecto.nombre_completo.toLowerCase()
    const matchesSearch = nombre.includes(searchTerm.toLowerCase())
    const matchesTab = tab === "todos" ? true : d.estado === tab
    const matchesTipo =
      tipoFilter === "todos" ? true : d.tipo_documento === tipoFilter
    return matchesSearch && matchesTab && matchesTipo
  })

  // orden alfabético por tipo_documento
  filtered.sort((a, b) =>
    a.tipo_documento.localeCompare(b.tipo_documento)
  )

  // dedupe: solo un card por (prospecto.id + tipo_documento)
  const unique = filtered.reduce<Documento[]>((acc, d) => {
    const key = `${d.prospecto.id}::${d.tipo_documento}`
    if (!acc.some((x) => `${x.prospecto.id}::${x.tipo_documento}` === key)) {
      acc.push(d)
    }
    return acc
  }, [])

  // --- PAGINACIÓN ---
  const totalPages = Math.ceil(unique.length / pageSize)
  const paginated = unique.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // lista de tipos para el dropdown
  const tipos = Array.from(
    new Set(documentos.map((d) => d.tipo_documento))
  ).sort()

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Revisión y Validación de Documentos" />
      <main className="flex-1 p-6">

        {/* Buscador + filtros */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                className="pl-10 w-full md:w-64"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <select
              className="border rounded p-2"
              value={tipoFilter}
              onChange={(e) => {
                setTipoFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="todos">Todos los tipos</option>
              {tipos.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filtrar</span>
          </Button>
        </div>

        {/* Tabs de estado */}
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as Pestaña)
            setCurrentPage(1)
          }}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
            <TabsTrigger value="aprobado">Aprobados</TabsTrigger>
            <TabsTrigger value="rechazado">Rechazados</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {loading ? (
              <div className="text-center py-20">Cargando...</div>
            ) : unique.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No hay documentos para mostrar.
              </div>
            ) : (
              <>
                {/* Grid de cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginated.map((d) => {
                    const nombre = d.prospecto.nombre_completo
                    const programa = d.prospecto.programa ?? "—"
                    const fecha = new Date(d.subida_at)
                      .toLocaleDateString("es-GT")
                    return (
                      <Card key={d.id} className="overflow-hidden">
                        <CardHeader className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="text-base">
                                {nombre}
                              </CardTitle>
                              <CardDescription>
                                {programa}
                              </CardDescription>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                d.estado === "pendiente"
                                  ? "bg-amber-100 text-amber-700"
                                  : d.estado === "aprobado"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                              }
                            >
                              {d.estado}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 pt-0 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {["dpi", "inscripcion"].includes(
                                d.tipo_documento
                              ) ? (
                                <FilePdf className="h-5 w-5 text-red-500" />
                              ) : d.tipo_documento === "recibo" ? (
                                <FileImage className="h-5 w-5 text-green-500" />
                              ) : (
                                <FileText className="h-5 w-5 text-blue-500" />
                              )}
                              <span className="truncate">
                                {d.tipo_documento}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {fecha}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {/* Modal individual */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                >
                                  Ver Documento
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    {d.tipo_documento} – {nombre}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Revisa el documento y valida su autenticidad
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-4">
                                  <div className="rounded-lg border overflow-hidden">
                                    {d.tipo_documento === "image" ? (
                                      <Image
                                        src={`${API_BASE_URL}/api/${d.ruta_archivo}`}
                                        width={800}
                                        height={600}
                                        alt={d.tipo_documento}
                                        className="w-full object-cover"
                                      />
                                    ) : (
                                      <iframe
                                        src={`${API_BASE_URL}/api/storage/${d.ruta_archivo}`}
                                        className="w-full h-[600px]"
                                      />
                                    )}
                                  </div>

                                  {d.estado === "pendiente" && (
                                    <>
                                      <div className="flex items-start gap-4 rounded-lg border p-4">
                                        <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
                                        <div>
                                          <h3 className="font-medium">Verificación Pendiente</h3>
                                          <p className="text-sm text-muted-foreground">
                                            Este documento requiere verificación.
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex flex-col gap-2">
                                        <h3 className="font-medium">Agregar Comentario</h3>
                                        <div className="flex gap-2">
                                          <Input placeholder="Escribe un comentario..." />
                                          <Button size="sm">
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            Enviar
                                          </Button>
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      className="gap-2"
                                      onClick={() => handleDelete(d.id)}
                                    >
                                      <XCircle className="h-4 w-4" /> Eliminar
                                    </Button>
                                    <Button
                                      className="gap-2"
                                      disabled={d.estado !== "pendiente"}
                                      onClick={() => updateEstado(d.id, "aprobado")}
                                    >
                                      <CheckCircle className="h-4 w-4" /> Aprobar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="gap-2"
                                      disabled={d.estado !== "pendiente"}
                                      onClick={() => updateEstado(d.id, "rechazado")}
                                    >
                                      <XCircle className="h-4 w-4" /> Rechazar
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Controles de Paginación */}
                <div className="flex justify-center items-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span>
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
