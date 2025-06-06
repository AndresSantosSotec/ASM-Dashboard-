"use client"

import { useState, useEffect, useMemo } from "react"
import { API_BASE_URL } from "@/utils/apiConfig"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader as CH, CardTitle } from "@/components/ui/card"

interface Prospect {
  id: string
  nombre: string
  email: string
  telefono: string
}

interface Course {
  id: number
  name: string
  code: string
  credits: number
}

const API_URL = `${API_BASE_URL}/api`

export default function AsignacionPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [courses, setCourses] = useState<Course[]>([])
  const [showCourses, setShowCourses] = useState<string | null>(null)

  useEffect(() => {
    const fetchProspects = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token") || ""
        const res = await fetch(`${API_URL}/prospectos/status/Inscrito?per_page=9999`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Error al cargar prospectos")
        const json = await res.json()
        const list: Prospect[] = (json.data || []).map((p: any) => ({
          id: String(p.id),
          nombre: p.nombre_completo,
          email: p.correo_electronico,
          telefono: p.telefono,
        }))
        setProspects(list)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProspects()
  }, [])

  const filteredProspects = useMemo(
    () =>
      prospects.filter(
        (p) =>
          p.nombre.toLowerCase().includes(search.toLowerCase()) ||
          p.email.toLowerCase().includes(search.toLowerCase()) ||
          p.telefono.toLowerCase().includes(search.toLowerCase()),
      ),
    [prospects, search],
  )

  const paginatedProspects = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredProspects.slice(start, start + pageSize)
  }, [filteredProspects, page])

  const totalPages = useMemo(
    () => Math.ceil(filteredProspects.length / pageSize) || 1,
    [filteredProspects],
  )

  const openCourses = async (prospectId: string) => {
    setShowCourses(prospectId)
    if (courses.length > 0) return
    try {
      const token = localStorage.getItem("token") || ""
      const res = await fetch(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Error al cargar cursos")
      const json = await res.json()
      setCourses(json.data || json)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CH>
          <CardTitle>Estudiantes Inscritos</CardTitle>
        </CH>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          {loading && <p>Cargando...</p>}
          {error && <p className="text-red-500">{error}</p>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProspects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{p.telefono}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openCourses(p.id)}>
                        Ver cursos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedProspects.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Sin registros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <span className="text-sm self-center">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCourses !== null} onOpenChange={() => setShowCourses(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cursos disponibles</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {courses.map((c) => (
              <div key={c.id} className="border p-2 rounded">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-500">
                  {c.code} • {c.credits} créditos
                </div>
              </div>
            ))}
            {courses.length === 0 && <p>No hay cursos.</p>}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowCourses(null)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
