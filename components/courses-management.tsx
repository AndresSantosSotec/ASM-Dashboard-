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
  fetchFacilitators,
  assignFacilitator
} from "@/services/courses"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Edit, Trash2, CheckCircle, UploadCloud } from "lucide-react"
import { format } from "date-fns"

interface Facilitator {
  id: number
  name: string
}

const formatDate = (date: string) => format(new Date(date), "yyyy-MM-dd")

export function CoursesManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [isOpen, setIsOpen] = useState(false)
  const [active, setActive] = useState<Course | null>(null)
  const [facilitators, setFacilitators] = useState<Facilitator[]>([])

  const [form, setForm] = useState<CourseInput>({
    name: "",
    code: "",
    area: "common",
    credits: 1,
    startDate: formatDate(new Date().toISOString()),
    endDate: formatDate(new Date().toISOString()),
    schedule: "",
    duration: "",
    facilitatorId: null,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [crs, facs] = await Promise.all([fetchCourses(), fetchFacilitators()])
      setCourses(crs)
      setFacilitators(facs)
    } catch (e) {
      console.error(e)
      setError("No se pudieron cargar los cursos")
    } finally {
      setLoading(false)
    }
  }

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setForm({
      name: "",
      code: "",
      area: "common",
      credits: 1,
      startDate: formatDate(new Date().toISOString()),
      endDate: formatDate(new Date().toISOString()),
      schedule: "",
      duration: "",
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
      facilitatorId: course.facilitatorId ?? null,
    })
    setFormMode("edit")
    setIsOpen(true)
  }

  const handleSave = async () => {
    try {
      if (formMode === "create") {
        const newCourse = await createCourse(form)
        setCourses([...courses, newCourse])
      } else if (active) {
        const updated = await updateCourse(active.id, form)
        setCourses(courses.map(c => (c.id === active.id ? updated : c)))
      }
      setIsOpen(false)
    } catch (e) {
      console.error(e)
      setError("Error al guardar el curso")
    }
  }

  const handleDelete = async (course: Course) => {
    if (!confirm(`Eliminar curso "${course.name}"?`)) return
    try {
      await deleteCourse(course.id)
      setCourses(courses.filter(c => c.id !== course.id))
    } catch (e) {
      console.error(e)
      setError("No se pudo eliminar el curso")
    }
  }

  const handleApprove = async (course: Course) => {
    try {
      const updated = await approveCourse(course.id)
      setCourses(courses.map(c => (c.id === updated.id ? updated : c)))
    } catch (e) {
      console.error(e)
    }
  }

  const handleSync = async (course: Course) => {
    try {
      const updated = await syncCourseToMoodle(course.id)
      setCourses(courses.map(c => (c.id === updated.id ? updated : c)))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <Input
          placeholder="Buscar curso..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
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
              <TableHead>Facilitador</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-32">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id} className="hover:bg-gray-50">
                <TableCell>{c.code}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.area === "common" ? "Común" : "Especialidad"}</TableCell>
                <TableCell>{c.credits}</TableCell>
                <TableCell>{c.facilitator?.name ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={c.status === "approved" ? "secondary" : c.status === "synced" ? "default" : "outline"}>{c.status}</Badge>
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
                <TableCell colSpan={7} className="text-center py-4">
                  No se encontraron cursos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "Nuevo Curso" : "Editar Curso"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Créditos</Label>
                <Input type="number" value={form.credits} onChange={e => setForm({ ...form, credits: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Área</Label>
              <Select value={form.area} onValueChange={v => setForm({ ...form, area: v as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Común</SelectItem>
                  <SelectItem value="specialty">Especialidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inicio</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Horario</Label>
              <Input value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Duración</Label>
              <Input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Facilitador</Label>
              <Select value={form.facilitatorId ? String(form.facilitatorId) : ""} onValueChange={v => setForm({ ...form, facilitatorId: v ? Number(v) : null })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {facilitators.map(f => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
