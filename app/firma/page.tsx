"use client"

import React, { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import {
  Search,
  Filter,
  FileText,
  XCircle,
  CheckCircle,
} from "lucide-react"
import Swal from "sweetalert2"

// **Re-agregadas** importaciones de tabla y checkbox
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

// Interfaces
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
    const token = localStorage.getItem("token")
    fetch("http://127.0.0.1:8000/api/contactos-enviados", {
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
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/contactos-enviados/${id}`,
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

        {/* Prospectos Pendientes inline */}
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

  useEffect(() => {
    const token = localStorage.getItem("token")
    fetch(
      `http://localhost:8000/api/prospectos/status/${encodeURIComponent(
        "Pendiente Aprobacion"
      )}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => r.json())
      .then((j) => setProspectos(j.data))
      .catch(console.error)

    fetch("http://localhost:8000/api/documentos", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => setDocumentos(j))
      .catch(console.error)
  }, [])

  const docsByPros = prospectos.reduce<Record<number, string[]>>((acc, p) => {
    acc[p.id] = documentos
      .filter((d) => d.prospecto_id === p.id)
      .map((d) => d.tipo_documento)
    return acc
  }, {})

  const toggle = (id: number) =>
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]
    )

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Prospectos Pendientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>✔️</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              {tipos.map((t) => (
                <TableHead key={t}>{t.toUpperCase()}</TableHead>
              ))}
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prospectos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4 + tipos.length}
                  className="text-center py-4"
                >
                  Cargando prospectos…
                </TableCell>
              </TableRow>
            ) : (
              prospectos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(p.id)}
                      onCheckedChange={() => toggle(p.id)}
                    />
                  </TableCell>
                  <TableCell>{p.nombre_completo}</TableCell>
                  <TableCell>{p.correo_electronico}</TableCell>
                  {tipos.map((t) => (
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
      </CardContent>
    </Card>
  )
}
