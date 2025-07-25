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
import { Plus, Edit, Trash2, CheckCircle, UploadCloud, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface Facilitator {
  id: number
  name: string
}

interface ProgramOption {
  id: number
  nombre_del_programa: string
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
  const [search, setSearch] = useState("")
  const [filterArea, setFilterArea] = useState<'all' | 'common' | 'specialty' | 'closure'>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterProgram, setFilterProgram] = useState<string>("all")
  const [page, setPage] = useState(1)
  const perPage = 10

  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [isOpen, setIsOpen] = useState(false)
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
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [crs, facs, progs] = await Promise.all([
        fetchCourses(),
        fetchFacilitators(),
        fetchPrograms(),
      ])
      setCourses(crs)
      setFacilitators(facs)
      setPrograms(progs)
    } catch (e) {
      console.error(e)
      setError("No se pudieron cargar los datos")
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
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

  // Filtros y paginación
  const filtered = courses.filter((c) => {
    const term = search.toLowerCase()
    const matchText =
      c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)
    const matchArea = filterArea === "all" || c.area === filterArea
    const matchStatus = filterStatus === "all" || c.status === filterStatus
    const matchProgram =
      filterProgram === "all" ||
      c.programas.some((p) => p.nombre_del_programa === filterProgram)
    return matchText && matchArea && matchStatus && matchProgram
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages])

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
    if (
      !form.name.trim() ||
      !form.code.trim() ||
      !form.schedule.trim() ||
      !form.duration.trim()
    ) {
      toast({
        title: "Datos incompletos",
        description: "Complete todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      if (formMode === "create") {
        const newCourse = await createCourse(form)
        setCourses([...courses, newCourse])
        toast({ title: "Curso creado", description: `Se creó ${newCourse.name}.` })
      } else if (active) {
        const updated = await updateCourse(active.id, form)
        setCourses(courses.map((c) => (c.id === active.id ? updated : c)))
        toast({ title: "Curso actualizado", description: `Se actualizó ${updated.name}.` })
      }
      setIsOpen(false)
    } catch (e: any) {
      console.error(e)
      if (e.response?.status === 422 && e.response.data) {
        const messages = Object.values(e.response.data)
          .flat()
          .join("\n")
        toast({
          title: "Error de validación",
          description: messages,
          variant: "destructive",
        })
      } else {
        setError("No se pudo guardar el curso")
        toast({
          title: "Error",
          description: "No se pudo guardar el curso",
          variant: "destructive",
        })
      }
    }
  }

  const handleDelete = async (course: Course) => {
    if (!confirm(`¿Eliminar curso "${course.name}"?`)) return
    try {
      await deleteCourse(course.id)
      setCourses(courses.filter((c) => c.id !== course.id))
      toast({ title: "Curso eliminado", description: `Se eliminó ${course.name}.` })
    } catch (e) {
      console.error(e)
      setError("No se pudo eliminar el curso")
      toast({ title: "Error", description: "No se pudo eliminar el curso", variant: "destructive" })
    }
  }

  const handleApprove = async (course: Course) => {
    try {
      const updated = await approveCourse(course.id)
      setCourses(courses.map((c) => (c.id === updated.id ? updated : c)))
      toast({ title: "Curso aprobado", description: `Se aprobó ${updated.name}.` })
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "No se pudo aprobar el curso", variant: "destructive" })
    }
  }

  const handleSync = async (course: Course) => {
    try {
      const updated = await syncCourseToMoodle(course.id)
      setCourses(courses.map((c) => (c.id === updated.id ? updated : c)))
      toast({ title: "Sincronizado", description: `Se sincronizó ${updated.name}.` })
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "No se pudo sincronizar", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      )}
      {error && !loading && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-wrap justify-between items-end gap-2">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Buscar curso..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full sm:w-48"
          />
          <Select value={filterArea} onValueChange={(v) => { setFilterArea(v as 'all' | 'common' | 'specialty' | 'closure'); setPage(1) }}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Área" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="common">Común</SelectItem>
              <SelectItem value="specialty">Especialidad</SelectItem>
              <SelectItem value="closure">Cierre del Programa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1) }}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="approved">Aprobado</SelectItem>
              <SelectItem value="synced">Sincronizado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterProgram} onValueChange={(v) => { setFilterProgram(v); setPage(1) }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Programa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.nombre_del_programa}>
                  {p.nombre_del_programa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Curso
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
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
            {paged.map((c) => (
              <TableRow key={c.id} className="hover:bg-gray-50">
                <TableCell>{c.code}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>
                  <Badge variant={c.area === 'common' ? 'secondary' : c.area === 'specialty' ? 'default' : 'outline'}>
                    {areaLabels[c.area]}
                  </Badge>
                </TableCell>
                <TableCell>{c.credits}</TableCell>
                <TableCell>
                  {c.programas.map((p) => p.nombre_del_programa).join(', ') || '-'}
                </TableCell>
                <TableCell>{c.facilitator?.name ?? "-"}</TableCell>
                <TableCell>
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
                      <Button size="icon" variant="outline" onClick={() => handleSync(c)}>
                        <UploadCloud className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No se encontraron cursos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center text-sm">
        <div>
          Página {page} de {totalPages}
        </div>
        <div className="flex gap-2">
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
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      </div>

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
