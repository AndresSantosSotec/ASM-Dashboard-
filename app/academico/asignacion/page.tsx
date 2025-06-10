"use client"

import { useState, useEffect, useMemo } from "react"
import { Search } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { DatePickerWithRange, DateRange } from "@/components/ui/date-range-picker"
import { useDebounce } from "@/hooks/use-debounce"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader as CH, CardTitle } from "@/components/ui/card"

// ① Importar Select y subcomponentes:
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

interface Prospect {
  id: string
  nombre: string
  email: string
  telefono: string
  ultimoCambio: string
  programas: { id: number; nombre: string }[]
  courses: Course[]       // ← Agregado para los cursos asignados
}

interface Course {
  id: number
  name: string
  code: string
  credits: number
}

interface Programa {
  id: number
  nombre: string
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
  const [showCourses, setShowCourses] = useState(false)
  const [selectedProspectIds, setSelectedProspectIds] = useState<string[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([])
  const [courseSearch, setCourseSearch] = useState("")
  const [courseArea, setCourseArea] = useState("all")
  const [courseStatus, setCourseStatus] = useState("all")
  const [coursePage, setCoursePage] = useState(1)
  const coursePageSize = 10
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [programs, setPrograms] = useState<Programa[]>([])    // Estado para programas
  const [programFilter, setProgramFilter] = useState("all")
  const searchDebounced = useDebounce(search, 300)

  // ② Cargar prospectos (incluyendo "programas" y "courses")
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
          ultimoCambio: p.updated_at,
          programas: p.programas || [], // Asegúrate que la API devuelva este arreglo
          courses: p.courses || [],     // Agregado para cursos asignados
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

  // ③ Cargar la lista de programas para el filtro
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const token = localStorage.getItem("token") || ""
        const res = await fetch(`${API_URL}/programas`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Error al cargar programas")
        const json = await res.json()
        setPrograms(json.data || [])
      } catch (e) {
        console.error(e)
      }
    }
    fetchPrograms()
  }, [])

  // Función que obtiene cursos (igual que antes)
  const fetchCourses = async () => {
    if (!showCourses) return
    setCoursesLoading(true)
    try {
      const token = localStorage.getItem("token") || ""
      const params = new URLSearchParams()
      if (courseSearch) params.append("search", courseSearch)
      if (courseArea !== "all") params.append("area", courseArea)
      if (courseStatus !== "all") params.append("status", courseStatus)
      const res = await fetch(`${API_URL}/courses?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Error al cargar cursos")
      const json = await res.json()
      setCourses(json.data || json)
    } catch (e) {
      console.error(e)
    } finally {
      setCoursesLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [showCourses, courseSearch, courseArea, courseStatus])

  // ④ Filtrar prospectos usando search, dateRange y programFilter
  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      const term = searchDebounced.toLowerCase()
      const termMatch =
        p.nombre.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.telefono.toLowerCase().includes(term)
      const date = new Date(p.ultimoCambio)
      const fromOk = !dateRange?.from || date >= dateRange.from
      const toOk = !dateRange?.to || date <= dateRange.to
      const programMatch =
        programFilter === "all" ||
        p.programas.some((pr) => String(pr.id) === programFilter)

      return termMatch && fromOk && toOk && programMatch
    })
  }, [prospects, searchDebounced, dateRange, programFilter])

  const paginatedProspects = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredProspects.slice(start, start + pageSize)
  }, [filteredProspects, page])

  const paginatedCourses = useMemo(() => {
    const start = (coursePage - 1) * coursePageSize
    return courses.slice(start, start + coursePageSize)
  }, [courses, coursePage])

  const totalPages = useMemo(
    () => Math.ceil(filteredProspects.length / pageSize) || 1,
    [filteredProspects]
  )

  const totalCoursePages = useMemo(
    () => Math.ceil(courses.length / coursePageSize) || 1,
    [courses]
  )

  const openCourses = (ids: string[]) => {
    setSelectedProspectIds(ids)
    setShowCourses(true)
  }

  const handleAssignCourses = async () => {
    try {
      const token = localStorage.getItem("token") || ""
      await fetch(`${API_URL}/courses/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prospecto_ids: selectedProspectIds.map(Number),
          course_ids: selectedCourseIds,
        }),
      })
      setSelectedCourseIds([])
      setSelectedProspectIds([])
      setShowCourses(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleUnassignCourses = async () => {
    try {
      const token = localStorage.getItem("token") || ""
      await fetch(`${API_URL}/courses/unassign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prospecto_ids: selectedProspectIds.map(Number),
          course_ids: selectedCourseIds,
        }),
      })
      setSelectedCourseIds([])
      setSelectedProspectIds([])
      setShowCourses(false)
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
          <div className="flex flex-col md:flex-row md:items-end gap-2">
            <div className="relative md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <DatePickerWithRange
              className="w-auto"
              value={dateRange}
              onChange={(range) => {
                setDateRange(range)
                setPage(1)
              }}
            />

            {/* ⑤ Ahora el Select está correctamente importado y poblado */}
            <Select
              value={programFilter}
              onValueChange={(val) => {
                setProgramFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos los programas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {programs.map((pr) => (
                  <SelectItem key={pr.id} value={String(pr.id)}>
                    {pr.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && <p>Cargando...</p>}
          {error && <p className="text-red-500">{error}</p>}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={selectedProspectIds.length === prospects.length && prospects.length > 0}
                      onCheckedChange={(c) =>
                        setSelectedProspectIds(c ? prospects.map((p) => p.id) : [])
                      }
                    />
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Última actualización</TableHead>
                  <TableHead>Cursos</TableHead> {/* ← Nueva columna */}
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProspects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProspectIds.includes(p.id)}
                        onCheckedChange={(c) =>
                          setSelectedProspectIds((ids) =>
                            c ? [...ids, p.id] : ids.filter((id) => id !== p.id)
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{p.telefono}</TableCell>
                    <TableCell>{new Date(p.ultimoCambio).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {p.courses.length > 0
                        ? p.courses.map((c) => c.name).join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openCourses([p.id])}>
                        Ver cursos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedProspects.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Sin registros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center gap-2">
            <div className="space-x-2">
              <Button
                variant="outline"
                disabled={selectedProspectIds.length === 0}
                onClick={() => openCourses(selectedProspectIds)}
              >
                Asignar cursos
              </Button>
              <Button
                variant="outline"
                disabled={selectedProspectIds.length === 0}
                onClick={() => openCourses(selectedProspectIds)}
              >
                Quitar cursos
              </Button>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setPage((p) => Math.max(1, p - 1))
                    }}
                    className="cursor-pointer"
                    aria-disabled={page <= 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e) => {
                        e.preventDefault()
                        setPage(p)
                      }}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setPage((p) => Math.min(totalPages, p + 1))
                    }}
                    className="cursor-pointer"
                    aria-disabled={page >= totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCourses} onOpenChange={() => setShowCourses(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cursos disponibles</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            <Input
              placeholder="Buscar curso..."
              value={courseSearch}
              onChange={(e) => {
                setCourseSearch(e.target.value)
                setCoursePage(1)
              }}
            />
            <select
              className="border rounded p-2 text-sm"
              value={courseArea}
              onChange={(e) => {
                setCourseArea(e.target.value)
                setCoursePage(1)
              }}
            >
              <option value="all">Todas áreas</option>
              <option value="common">Común</option>
              <option value="specialty">Especialidad</option>
            </select>
            <select
              className="border rounded p-2 text-sm"
              value={courseStatus}
              onChange={(e) => {
                setCourseStatus(e.target.value)
                setCoursePage(1)
              }}
            >
              <option value="all">Todos</option>
              <option value="draft">Borrador</option>
              <option value="approved">Aprobado</option>
              <option value="synced">Sincronizado</option>
            </select>
          </div>
          {coursesLoading && <p>Cargando cursos...</p>}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {paginatedCourses.map((c) => (
              <div key={c.id} className="flex items-center gap-2 border p-2 rounded">
                <Checkbox
                  checked={selectedCourseIds.includes(c.id)}
                  onCheckedChange={(chk) =>
                    setSelectedCourseIds((ids) =>
                      chk ? [...ids, c.id] : ids.filter((id) => id !== c.id)
                    )
                  }
                />
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-gray-500">
                    {c.code} • {c.credits} créditos
                  </div>
                </div>
              </div>
            ))}
            {paginatedCourses.length === 0 && !coursesLoading && <p>No hay cursos.</p>}
          </div>
          <div className="flex justify-between items-center pt-4">
            <div className="space-x-2">
              <Button
                variant="outline"
                disabled={selectedCourseIds.length === 0 || selectedProspectIds.length === 0}
                onClick={handleAssignCourses}
              >
                Asignar seleccionados
              </Button>
              <Button
                variant="outline"
                disabled={selectedCourseIds.length === 0 || selectedProspectIds.length === 0}
                onClick={handleUnassignCourses}
              >
                Quitar seleccionados
              </Button>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCoursePage((p) => Math.max(1, p - 1))
                    }}
                    className="cursor-pointer"
                    aria-disabled={coursePage <= 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalCoursePages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === coursePage}
                      onClick={(e) => {
                        e.preventDefault()
                        setCoursePage(p)
                      }}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCoursePage((p) => Math.min(totalCoursePages, p + 1))
                    }}
                    className="cursor-pointer"
                    aria-disabled={coursePage >= totalCoursePages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
