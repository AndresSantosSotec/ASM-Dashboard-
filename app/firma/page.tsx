"use client"

import { useState, useEffect } from "react"
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
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  FileText,
  Download,
  XCircle,
  CheckCircle,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

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
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Verificación de Firma Digital y Contrato" />
      <main className="flex-1 p-4 md:p-6">
        {/* -- Contratos y Firmas (visualización sólo) -- */}
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
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">
                            Alumno {i}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-700"
                          >
                            Pendiente
                          </Badge>
                        </div>
                        <CardDescription>Programa Ejemplo</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 space-y-4">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <span>Contrato.pdf</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            01/04/2025
                          </span>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              Verificar Firma
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>
                                Contrato - Alumno {i}
                              </DialogTitle>
                              <DialogDescription>
                                Revisa la firma y el documento
                              </DialogDescription>
                            </DialogHeader>
                            <div className="border rounded overflow-hidden">
                              <div className="bg-muted p-2 flex justify-between">
                                <span>Contrato_{i}.pdf</span>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" /> Descargar
                                </Button>
                              </div>
                              <div className="h-64 overflow-auto p-4 bg-white">
                                <p>(Contenido de ejemplo del contrato...)</p>
                              </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                              <Button variant="outline">
                                <XCircle className="h-4 w-4" /> Rechazar
                              </Button>
                              <Button>
                                <CheckCircle className="h-4 w-4" /> Verificar
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* -- Tabla de Prospectos “Pendiente Aprobacion” con checks según documentos -- */}
        <ProspectosPendientes />
      </main>
    </div>
  )
}

function ProspectosPendientes() {
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const router = useRouter()

  // Tipos que queremos mostrar columnas
  const tipos = ["dpi", "recibo", "american", "inscripcion"]

  useEffect(() => {
    const token = localStorage.getItem("token")

    // 1) Traer prospectos con status Pendiente Aprobacion
    fetch(
      `http://localhost:8000/api/prospectos/status/${encodeURIComponent(
        "Pendiente Aprobacion"
      )}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => r.json())
      .then((j) => setProspectos(j.data))
      .catch(console.error)

    // 2) Traer todos los documentos
    fetch("http://localhost:8000/api/documentos", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => setDocumentos(j))
      .catch(console.error)
  }, [])

  // Mapa prospecto_id → lista de tipo_documento
  const docsByPros = prospectos.reduce<Record<number, string[]>>((acc, p) => {
    acc[p.id] =
      documentos
        .filter((d) => d.prospecto_id === p.id)
        .map((d) => d.tipo_documento) || []
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
                <TableCell colSpan={4 + tipos.length} className="text-center py-4">
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
