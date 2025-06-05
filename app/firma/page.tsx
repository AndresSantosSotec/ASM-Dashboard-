"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/utils/apiConfig"
import { Input } from "@/components/ui/input"
import {
  Search,
  Filter,
  FileText,
  XCircle,
} from "lucide-react"
import Swal from "sweetalert2"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

interface ContactoEnviado {
  id: number
  prospecto_id: number
  fecha_envio: string
  resultado: string
  prospecto: { nombre_completo: string }
}

interface Prospecto {
  id: number
  nombre_completo: string
  correo_electronico: string
}

interface Documento {
  id: number
  prospecto_id: number
  tipo_documento: string
}

export default function FirmaPage() {
  const router = useRouter()
  const [enviadosHoy, setEnviadosHoy] = useState<ContactoEnviado[]>([])

  useEffect(() => {
    const token = localStorage.getItem("token") || ""
    fetch(`${API_BASE_URL}/api/contactos-enviados`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then((r) => r.json())
      .then((data: unknown) => {
        const arr: ContactoEnviado[] = Array.isArray(data) ? data : []
        setEnviadosHoy(arr)
      })
      .catch((err) => {
        console.error("Error cargando envíos:", err)
        Swal.fire("Error", "No se pudieron cargar los contratos.", "error")
      })
  }, [])

  const handleDiscard = async (id: number) => {
    const token = localStorage.getItem("token") || ""
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/contactos-enviados/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setEnviadosHoy((prev) => prev.filter((env) => env.id !== id))
    } catch (err: any) {
      console.error("Error al descartar:", err)
      Swal.fire("Error", "No se pudo descartar el contrato.", "error")
    }
  }

  const renderCard = (env: ContactoEnviado) => (
    <Card key={env.id}>
      <CardHeader className="p-4 flex justify-between items-center">
        <div>
          <CardTitle className="text-base">
            {env.prospecto.nombre_completo}
          </CardTitle>
          <CardDescription>
            Enviado:{" "}
            {new Date(env.fecha_envio).toLocaleTimeString("es-GT", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </CardDescription>
        </div>
        <Badge
          variant="outline"
          className={
            env.resultado === "firmado"
              ? "bg-green-100 text-green-700"
              : env.resultado === "enviado"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
          }
        >
          {env.resultado.charAt(0).toUpperCase() + env.resultado.slice(1)}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-700" />
            Contrato.pdf
          </span>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleDiscard(env.id)}>
            <XCircle className="h-4 w-4" /> Descartar
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Verificación de Firma Digital y Contrato" />
      <main className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Contratos y Firmas</CardTitle>
                <CardDescription>
                  Verifica la firma digital y el contrato
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar..."
                    className="pl-8 w-[200px]"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="pendientes">
              <TabsList className="mb-4">
                <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
                <TabsTrigger value="verificados">Verificados</TabsTrigger>
                <TabsTrigger value="rechazados">Rechazados</TabsTrigger>
                <TabsTrigger value="todos">Todos</TabsTrigger>
              </TabsList>

              <TabsContent value="pendientes">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enviadosHoy.length === 0 ? (
                    <p className="col-span-full text-center py-8">
                      No hay contratos enviados.
                    </p>
                  ) : (
                    enviadosHoy.map(renderCard)
                  )}
                </div>
              </TabsContent>

              <TabsContent value="verificados">
                <p className="text-center py-8">Nada verificado aún.</p>
              </TabsContent>

              <TabsContent value="rechazados">
                <p className="text-center py-8">Sin rechazos.</p>
              </TabsContent>

              <TabsContent value="todos">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enviadosHoy.length === 0 ? (
                    <p className="col-span-full text-center py-8">
                      No hay registros.
                    </p>
                  ) : (
                    enviadosHoy.map(renderCard)
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <ProspectosPendientes />
      </main>
    </div>
  )
}

function ProspectosPendientes() {
  const router = useRouter()
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const tipos = ["dpi", "recibo", "american", "inscripcion"]

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    const token = localStorage.getItem("token") || ""
    const estados = ["Pendiente Aprobacion", "revisada", "aprobada"]

    async function loadProspectos() {
      try {
        const respuestas = await Promise.all(
          estados.map(estado =>
            fetch(
              `${API_BASE_URL}/api/prospectos/status/${encodeURIComponent(
                estado
              )}`,
              { headers: { Authorization: `Bearer ${token}` } }
            ).then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`)
              return res.json()
            })
          )
        )
        const combinados: Prospecto[] = respuestas
          .flatMap(r => (Array.isArray(r.data) ? r.data : []))
          .reduce<Prospecto[]>((acc, p) => {
            if (!acc.find(x => x.id === p.id)) acc.push(p)
            return acc
          }, [])
        setProspectos(combinados)
      } catch (err) {
        console.error("Error cargando prospectos:", err)
        Swal.fire("Error", "No se pudieron cargar los prospectos.", "error")
      }
    }

    async function loadDocumentos() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/documentos`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: Documento[] = await res.json()
        setDocumentos(data)
      } catch (err) {
        console.error("Error cargando documentos:", err)
        Swal.fire("Error", "No se pudieron cargar los documentos.", "error")
      }
    }

    loadProspectos()
    loadDocumentos()
  }, [])

  const docsByPros = useMemo(() => {
    return prospectos.reduce<Record<number,string[]>>((acc, p) => {
      acc[p.id] = documentos
        .filter(d => d.prospecto_id === p.id)
        .map(d => d.tipo_documento)
      return acc
    }, {})
  }, [prospectos, documentos])

  const toggle = (id: number) =>
    setSelected(sel =>
      sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]
    )

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return prospectos.filter(p =>
      p.nombre_completo.toLowerCase().includes(term) ||
      p.correo_electronico.toLowerCase().includes(term)
    )
  }, [prospectos, searchTerm])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Prospectos Pendientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4 gap-2">
          <Input
            placeholder="Buscar nombre o email"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-[250px]"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>✔️</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              {tipos.map(t => (
                <TableHead key={t}>{t.toUpperCase()}</TableHead>
              ))}
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4 + tipos.length}
                  className="text-center py-4"
                >
                  No hay prospectos que coincidan.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(p.id)}
                      onCheckedChange={() => toggle(p.id)}
                    />
                  </TableCell>
                  <TableCell>{p.nombre_completo}</TableCell>
                  <TableCell>{p.correo_electronico}</TableCell>
                  {tipos.map(t => (
                    <TableCell key={t}>
                      <Checkbox
                        checked={docsByPros[p.id]?.includes(t) ?? false}
                        disabled
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/firma/student-details/${p.id}`)}
                    >
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
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
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
