"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Filter, CheckCircle, XCircle, Download, AlertCircle, MessageSquare, FileText } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// --- Modelo de prospecto según API ---
interface Student {
  id: string
  name: string
  email: string
  dpi: boolean
  receipt: boolean
  constanciaAmerica: boolean
}

function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("http://127.0.0.1:8000/api/prospectos", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        const json = await res.json()
        const data: Student[] = json.data.map((p: any) => ({
          id: String(p.id),
          name: p.nombre_completo,
          email: p.correo_electronico,
          dpi: Boolean(p.has_dpi),
          receipt: Boolean(p.has_recibo),
          constanciaAmerica: Boolean(p.has_constancia_america),
        }))
        setStudents(data)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  const toggle = (id: string) =>
    setSelected(sel => (sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]))

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Gestión de Prospectos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>✔️</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>DPI</TableHead>
              <TableHead>Recibo</TableHead>
              <TableHead>Constancia</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Cargando prospectos...
                </TableCell>
              </TableRow>
            ) : (
              students.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(s.id)}
                      onCheckedChange={() => toggle(s.id)}
                    />
                  </TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>
                    {s.dpi ? <span className="text-green-500">✔️</span> : <span className="text-red-500">❌</span>}
                  </TableCell>
                  <TableCell>
                    {s.receipt ? <span className="text-green-500">✔️</span> : <span className="text-red-500">❌</span>}
                  </TableCell>
                  <TableCell>
                    {s.constanciaAmerica ? <span className="text-green-500">✔️</span> : <span className="text-red-500">❌</span>}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" onClick={() => router.push(`/firma/student-details/${s.id}`)}>
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

export default function FirmaPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Verificación de Firma Digital y Contrato" />
      <main className="flex-1 p-4 md:p-6">
        {/* -- Contratos y Firmas (datos de ejemplo) -- */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Contratos y Firmas</CardTitle>
                <CardDescription>Verifica la firma digital y el contrato</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Buscar..." className="pl-8 w-[200px]" />
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
                  {[1, 2, 3].map(i => (
                    <Card key={i}>
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">Alumno {i}</CardTitle>
                          <Badge variant="outline" className="bg-amber-100 text-amber-700">
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
                          <span className="text-xs text-muted-foreground">01/04/2025</span>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">Verificar Firma</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Contrato - Alumno {i}</DialogTitle>
                              <DialogDescription>Revisa la firma y el documento</DialogDescription>
                            </DialogHeader>
                            <div className="border rounded overflow-hidden">
                              <div className="bg-muted p-2 flex justify-between">
                                <span>Contrato_{i}.pdf</span>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" /> Descargar
                                </Button>
                              </div>
                              <div className="h-64 overflow-auto p-4 bg-white">
                                {/* Aquí iría un PDF viewer real */}
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

              {/* Vistas “verificados”, “rechazados” y “todos” pueden copiar esa estructura */}
            </Tabs>
          </CardContent>
        </Card>

        {/* -- Gestión de Prospectos bajo la misma estética -- */}
        <StudentManagement />
      </main>
    </div>
  )
}
