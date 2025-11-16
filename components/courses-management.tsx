"use client"

import { useState, useEffect } from "react"
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  Course,
  CourseInput,
  approveCourse,
  syncCourseToMoodle,
  fetchFacilitators
} from "@/services/courses"
import { fetchPrograms, Program } from "@/services/programs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ReactSelect from "react-select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, CheckCircle, UploadCloud, Loader2, Search, Filter } from "lucide-react"
import Swal from "sweetalert2"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import api from "@/services/api"

interface Facilitator {
  id: number
  name: string
}

interface ProgramOption {
  id: number
  nombre_del_programa: string
}

interface PaginationData {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

const formatDate = (date: string) => format(new Date(date), "yyyy-MM-dd")

const areaLabels: Record<string, string> = {
  common: "Común",
  specialty: "Especialidad",
  closure: "Cierre del Programa",
}

export function CoursesManagement() {
  const { toast } = useToast()

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [search, setSearch] = useState("")
  const [filterCode, setFilterCode] = useState("")
  const [filterArea, setFilterArea] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterProgram, setFilterProgram] = useState<string>("all")
  const [filterFacilitator, setFilterFacilitator] = useState<string>("all")
  
  // Paginación del backend
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [pagination, setPagination] = useState<PaginationData | null>(null)

  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [isOpen, setIsOpen] = useState(false)
  const [syncingId, setSyncingId] = useState<number | null>(null)
  const [active, setActive] = useState<Course | null>(null)
  const [facilitators, setFacilitators] = useState<Facilitator[]>([])
  const [programs, setPrograms] = useState<ProgramOption[]>([])

  const [form, setForm] = useState<CourseInput>({
    name: "",
    code: "",
    area: "common",
    credits: 1,
    startDate: formatDate(new Date().toISOString()),
    endDate: formatDate(new Date().toISOString()),
    schedule: "",
    duration: "",
    programIds: [],
    facilitatorId: null,
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadCoursesFromBackend()
  }, [page, perPage, search, filterCode, filterArea, filterStatus, filterProgram, filterFacilitator])

  async function loadInitialData() {
    try {
      const [facs, progs] = await Promise.all([
        fetchFacilitators(),
        fetchPrograms(),
      ])
      setFacilitators(facs)
      setPrograms(progs)
    } catch (e) {
      console.error(e)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos iniciales",
        variant: "destructive",
      })
    }
  }

  async function loadCoursesFromBackend() {
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        per_page: perPage,
        page: page,
      }

      // Filtros opcionales que empatan con el backend
      if (search.trim()) {
        params.search = search.trim()
      }
      if (filterArea && filterArea !== "all") {
        params.area = filterArea
      }
      if (filterStatus && filterStatus !== "all") {
        params.status = filterStatus
      }
      if (filterProgram && filterProgram !== "all") {
        params.program_id = parseInt(filterProgram)
      }
      // Nota: El backend no tiene filtro por facilitator_id en el index,
      // lo filtramos en el frontend
      
      const res = await api.get('/courses', { params })
      
      if (res.data.data) {
        // Paginación Laravel
        let coursesData = res.data.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          area: c.area,
          credits: c.credits,
          startDate: c.start_date,
          endDate: c.end_date,
          schedule: c.schedule,
          duration: c.duration,
          programIds: Array.isArray(c.programas) ? c.programas.map((p: any) => p.id) : [],
          facilitatorId: c.facilitator_id ?? null,
          status: c.status,
          facilitator: c.facilitator ?? null,
          programas: c.programas ?? [],
        }))

        // Filtro adicional por código (frontend)
        if (filterCode.trim()) {
          coursesData = coursesData.filter((c: Course) => 
            c.code.toLowerCase().includes(filterCode.toLowerCase())
          )
        }

        // Filtro adicional por facilitador (frontend)
        if (filterFacilitator && filterFacilitator !== "all") {
          coursesData = coursesData.filter((c: Course) => 
            c.facilitatorId === parseInt(filterFacilitator)
          )
        }
        
        setCourses(coursesData)
        
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          per_page: res.data.per_page,
          total: res.data.total,
          from: res.data.from,
          to: res.data.to,
        })
      }
    } catch (e) {
      console.error(e)
      setError("No se pudieron cargar los cursos")
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateNextCode = () => {
    let max = 0
    for (const c of courses) {
      const m = c.code.match(/(\d+)$/)
      if (m) {
        const n = parseInt(m[1], 10)
        if (n > max) max = n
      }
    }
    return `CRS-${String(max + 1).padStart(4, '0')}`
  }

  const handleFilterChange = () => {
    setPage(1) // Resetear a página 1 cuando cambian los filtros
  }

  const openCreate = () => {
    setForm({
      name: "",
      code: generateNextCode(),
      area: "common",
      credits: 1,
      startDate: formatDate(new Date().toISOString()),
      endDate: formatDate(new Date().toISOString()),
      schedule: "",
      duration: "",
      programIds: [],
      facilitatorId: null,
    })
    setFormMode("create")
    setActive(null)
    setIsOpen(true)
  }

  const openEdit = (course: Course) => {
    setActive(course)
    setForm({
      name: course.name,
      code: course.code,
      area: course.area,
      credits: course.credits,
      startDate: course.startDate,
      endDate: course.endDate,
      schedule: course.schedule,
      duration: course.duration,
      programIds: course.programas.map((p) => p.id),
      facilitatorId: course.facilitatorId ?? null,
    })
    setFormMode("edit")
    setIsOpen(true)
  }

  const handleSave = async () => {
    try {
      if (formMode === "create") {
        const newCourse = await createCourse(form)
        toast({ title: "Curso creado", description: `Se creó ${newCourse.name}.` })
        await loadCoursesFromBackend() // Recargar desde backend
      } else if (active) {
        const updated = await updateCourse(active.id, form)
        toast({ title: "Curso actualizado", description: `Se actualizó ${updated.name}.` })
        await loadCoursesFromBackend() // Recargar desde backend
      }
      setIsOpen(false)
    } catch (e) {
      console.error(e)
      setError("No se pudo guardar el curso")
      toast({ title: "Error", description: "No se pudo guardar el curso", variant: "destructive" })
    }
  }

  const handleDelete = async (course: Course) => {
    if (!confirm(`¿Eliminar curso "${course.name}"?`)) return
    try {
      await deleteCourse(course.id)
      toast({ title: "Curso eliminado", description: `Se eliminó ${course.name}.` })
      await loadCoursesFromBackend() // Recargar desde backend
    } catch (e) {
      console.error(e)
      setError("No se pudo eliminar el curso")
      toast({ title: "Error", description: "No se pudo eliminar el curso", variant: "destructive" })
    }
  }

  const handleApprove = async (course: Course) => {
    try {
      await approveCourse(course.id)
      toast({ title: "Curso aprobado", description: `Se aprobó ${course.name}.` })
      await loadCoursesFromBackend() // Recargar desde backend
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "No se pudo aprobar el curso", variant: "destructive" })
    }
  }

  const handleSync = async (course: Course) => {
    setSyncingId(course.id)
    try {
      await syncCourseToMoodle(course.id)
      Swal.fire({
        icon: "success",
        title: "Sincronizado",
        text: `Se sincronizó ${course.name} correctamente`,
      })
      await loadCoursesFromBackend() // Recargar desde backend
    } catch (e) {
      console.error(e)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo sincronizar el curso",
      })
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Cursos</h1>
        <p className="text-sm text-gray-600 mt-1">
          Administre los cursos ofrecidos y su información básica
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      )}
      {error && !loading && <p className="text-sm text-red-500">{error}</p>}

      {/* Filtros y Búsqueda */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros de Búsqueda</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Búsqueda por nombre */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Nombre</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => { 
                  setSearch(e.target.value)
                  handleFilterChange()
                }}
                className="pl-8"
              />
            </div>
          </div>

          {/* Búsqueda por código */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Código</Label>
            <Input
              placeholder="Código del curso..."
              value={filterCode}
              onChange={(e) => { 
                setFilterCode(e.target.value)
                handleFilterChange()
              }}
            />
          </div>

          {/* Filtro por Área */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Área</Label>
            <Select 
              value={filterArea} 
              onValueChange={(v) => { 
                setFilterArea(v)
                handleFilterChange()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las áreas</SelectItem>
                <SelectItem value="common">Común</SelectItem>
                <SelectItem value="specialty">Especialidad</SelectItem>
                <SelectItem value="closure">Cierre del Programa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Programa */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Programa</Label>
            <Select 
              value={filterProgram} 
              onValueChange={(v) => { 
                setFilterProgram(v)
                handleFilterChange()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los programas</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre_del_programa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Facilitador */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Facilitador</Label>
            <Select 
              value={filterFacilitator} 
              onValueChange={(v) => { 
                setFilterFacilitator(v)
                handleFilterChange()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Facilitador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {facilitators.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Estado */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Estado</Label>
            <Select 
              value={filterStatus} 
              onValueChange={(v) => { 
                setFilterStatus(v)
                handleFilterChange()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="synced">Sincronizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("")
              setFilterCode("")
              setFilterArea("all")
              setFilterProgram("all")
              setFilterFacilitator("all")
              setFilterStatus("all")
              setPage(1)
            }}
          >
            Limpiar Filtros
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Curso
          </Button>
        </div>
      </div>

      {/* Tabla de Cursos */}
      <div className="border rounded-md overflow-x-auto bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Créditos</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead>Facilitador</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-32">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((c) => (
              <TableRow key={c.id} className="hover:bg-gray-50">
                <TableCell className="font-mono text-sm">{c.code}</TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  <Badge variant={c.area === 'common' ? 'secondary' : c.area === 'specialty' ? 'default' : 'outline'}>
                    {areaLabels[c.area]}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{c.credits}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {c.programas.map((p: any) => p.nombre_del_programa).join(', ') || '-'}
                </TableCell>
                <TableCell>{c.facilitator?.name ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={
                        c.status === "approved"
                          ? "secondary"
                          : c.status === "synced"
                          ? "default"
                          : "outline"
                      }
                    >
                      {c.status}
                    </Badge>
                    {c.status === "synced" && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => openEdit(c)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(c)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {c.status === "draft" && (
                      <Button size="icon" variant="outline" onClick={() => handleApprove(c)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {c.status === "approved" && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleSync(c)}
                        disabled={syncingId === c.id}
                      >
                        {syncingId === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UploadCloud className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {courses.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No se encontraron cursos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {pagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Mostrando <span className="font-medium">{pagination.from || 0}</span> a{" "}
              <span className="font-medium">{pagination.to || 0}</span> de{" "}
              <span className="font-medium">{pagination.total}</span> cursos
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-600">Por página:</Label>
              <Select
                value={String(perPage)}
                onValueChange={(v) => {
                  setPerPage(parseInt(v))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Página {pagination.current_page} de {pagination.last_page}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(1)}
              >
                Primera
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.last_page}
                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
              >
                Siguiente
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.last_page}
                onClick={() => setPage(pagination.last_page)}
              >
                Última
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Nuevo Curso" : "Editar Curso"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Créditos</Label>
                <Input
                  type="number"
                  value={form.credits}
                  onChange={(e) =>
                    setForm({ ...form, credits: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Área</Label>
              <Select
                value={form.area}
                onValueChange={(v) => setForm({ ...form, area: v as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Común</SelectItem>
                  <SelectItem value="specialty">Especialidad</SelectItem>
                  <SelectItem value="closure">Cierre del Programa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inicio</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Horario</Label>
              <Input
                value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Duración</Label>
              <Input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Programa</Label>

              <ReactSelect
                isMulti
                classNamePrefix="rs"
                options={programs.map((p) => ({
                  value: p.id,
                  label: p.nombre_del_programa,
                }))}
                value={programs
                  .filter((p) => form.programIds.includes(p.id))
                  .map((p) => ({ value: p.id, label: p.nombre_del_programa }))}
                onChange={(vals) =>
                  setForm({
                    ...form,
                    programIds: (vals as any[]).map((v) => v.value as number),
                  })
                }
              />

            </div>
            <div className="space-y-2">
              <Label>Facilitador</Label>
              <Select
                value={form.facilitatorId ? String(form.facilitatorId) : "none"}
                onValueChange={(v) =>
                  setForm({ ...form, facilitatorId: v === "none" ? null : Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {facilitators.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
