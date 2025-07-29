"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, CheckCircle, Loader2 } from "lucide-react"
import Swal from "sweetalert2"
import Link from "next/link"
import { format, startOfMonth, addMonths, isSameMonth } from "date-fns"
import { es } from "date-fns/locale"
import {
  fetchMoodleCourses,
  pushMoodleCourses,
  fetchSyncedMoodleIds,
  MOODLE_BASE_URL,
} from "@/services/moodle"

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

interface MoodleCourse {
  id: number
  fullname: string
  shortname: string
  summary?: string
  categoryid?: number
  numsections?: number
  timecreated: number
}

export default function MoodleCoursesPage() {
  const [courses, setCourses] = useState<MoodleCourse[]>([])
  const [search, setSearch] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<string>("all")

  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set())
  const [showMode, setShowMode] = useState<"all" | "selected">("all")
  const [page, setPage] = useState(1)
  const perPage = 3

  const { toast } = useToast()
  const [syncingId, setSyncingId] = useState<number | null>(null)
  const [bulkSyncing, setBulkSyncing] = useState(false)
  const [syncedIds, setSyncedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMoodleCourses()
        const mapped = Array.isArray(data)
          ? data.map((c: any) => ({
              id: c.id,
              fullname: c.fullname,
              shortname: c.shortname,
              summary: c.summary,
              categoryid: c.categoryid,
              numsections: c.numsections,
              timecreated: c.timecreated ?? 0,
            }))
          : []
        mapped.sort((a, b) => b.timecreated - a.timecreated)
        setCourses(mapped)

        try {
          const ids = mapped.map(c => c.id)
          const synced = await fetchSyncedMoodleIds(ids)
          setSyncedIds(new Set(synced))
        } catch (e) {
          console.error('Error checking synced courses', e)
        }

        toast({
          title: "Cursos obtenidos",
          description: `Se cargaron ${mapped.length} cursos desde Moodle`,
        })
      } catch (err) {
        console.error("Error fetching Moodle courses", err)
        toast({
          title: "Error al obtener cursos",
          description: "No se pudieron cargar los cursos de Moodle",
          variant: "destructive",
        })
      }
    }

    load()
  }, [toast])

  // Extrae los distintos años disponibles
  const years = useMemo(() => {
    const setYears = new Set<number>()
    courses.forEach(c =>
      setYears.add(new Date(c.timecreated * 1000).getFullYear())
    )
    return Array.from(setYears)
      .sort((a, b) => b - a)
      .map(String)
  }, [courses])

  const months = useMemo(() => {
    const setMonths = new Set<number>()
    courses.forEach(c => {
      if (
        selectedYear !== "all" &&
        new Date(c.timecreated * 1000).getFullYear().toString() !== selectedYear
      ) {
        return
      }
      setMonths.add(new Date(c.timecreated * 1000).getMonth())
    })
    return Array.from(setMonths)
      .sort((a, b) => a - b)
      .map(m => String(m + 1))
  }, [courses, selectedYear])

  // Agrupa y filtra por search, año, mes y selección
  const groups = useMemo(() => {
    const filtered = courses.filter(c => {
      const byYear =
        selectedYear === "all" ||
        new Date(c.timecreated * 1000).getFullYear().toString() ===

          selectedYear
      const byMonth =
        selectedMonth === "all" ||
        (new Date(c.timecreated * 1000).getMonth() + 1).toString() ===
          selectedMonth
      const bySelected =
        showMode === "all" || selectedCourses.has(c.id)

      const byText = c.fullname
        .toLowerCase()
        .includes(search.toLowerCase())
      return byYear && byMonth && byText && bySelected
    })

    const map = new Map<string, { date: Date; courses: MoodleCourse[] }>()
    for (const c of filtered) {
      const date = startOfMonth(new Date(c.timecreated * 1000))
      const key = format(date, "yyyy-MM")
      if (!map.has(key)) map.set(key, { date, courses: [] })
      map.get(key)!.courses.push(c)
    }

    const arr = Array.from(map.values()).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    )
    // Opcional: sacar primero el mes actual y el siguiente
    const current = startOfMonth(new Date())
    const next = startOfMonth(addMonths(current, 1))
    const ordered: typeof arr = []
    const currIdx = arr.findIndex(g => isSameMonth(g.date, current))
    if (currIdx >= 0) ordered.push(...arr.splice(currIdx, 1))
    const nextIdx = arr.findIndex(g => isSameMonth(g.date, next))
    if (nextIdx >= 0) ordered.push(...arr.splice(nextIdx, 1))
    return ordered.concat(arr)
  }, [courses, search, selectedYear, selectedMonth, showMode, selectedCourses])

const handleSync = async () => {
  const ids = Array.from(selectedCourses)
  const payload = courses.filter(c => ids.includes(c.id))
  setBulkSyncing(true)

  try {
    await pushMoodleCourses(payload as any)
    Swal.fire({
      icon: 'success',
      title: 'Sincronizado',
      text: `Se sincronizaron ${ids.length} cursos correctamente`,
    })
    setSyncedIds(prev => new Set([...Array.from(prev), ...ids]))
    setSelectedCourses(new Set())
  } catch (err) {
    console.error('Error syncing courses', err)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron sincronizar los cursos',
    })
  } finally {
    setBulkSyncing(false)
  }
}

const handleSyncSingle = async (course: MoodleCourse) => {
  setSyncingId(course.id)
  try {
    await pushMoodleCourses([course] as any)
    Swal.fire({
      icon: 'success',
      title: 'Sincronizado',
      text: `Curso ${course.fullname} sincronizado correctamente`,
    })
    setSyncedIds(prev => new Set([...Array.from(prev), course.id]))
  } catch (err) {
    console.error('Error syncing course', err)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo sincronizar el curso',
    })
  } finally {
    setSyncingId(null)
  }
}

  const totalPages = Math.max(1, Math.ceil(groups.length / perPage))
  const pagedGroups = groups.slice((page - 1) * perPage, page * perPage)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/academico">Académico</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Cursos Moodle</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <div>
              <CardTitle>Cursos desde Moodle</CardTitle>
              <CardDescription>Información obtenida vía API</CardDescription>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Buscar cursos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-sm"
              type="search"
            />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>

                <SelectItem value="all">Todos</SelectItem>
                {years.map(y => (

                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {months.map(m => (
                  <SelectItem key={m} value={m}>
                    {MONTH_NAMES[Number(m) - 1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={showMode}
              onValueChange={v => setShowMode(v as "all" | "selected")}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Mostrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="selected">Seleccionados</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={selectedCourses.size === 0 || bulkSyncing}
            >
              {bulkSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Sincronizar seleccionados'
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {pagedGroups.map(group => (
            <div key={group.date.toISOString()} className="space-y-2">
              <h3 className="text-lg font-semibold">
                {format(group.date, "MMMM yyyy", { locale: es })}
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.courses.map(course => (
                  <Card key={course.id} className="border-muted">
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium">
                          <Link
                            href={`${MOODLE_BASE_URL}/course/view.php?id=${course.id}`}
                            target="_blank"
                            className="hover:underline"
                          >
                            {course.fullname}
                          </Link>
                        </CardTitle>
                        <CardDescription>ID: {course.id}</CardDescription>
                      </div>
                      <Checkbox
                        checked={selectedCourses.has(course.id)}
                        onCheckedChange={checked =>
                          setSelectedCourses(prev => {
                            const next = new Set(prev)
                            if (checked) next.add(course.id)
                            else next.delete(course.id)
                            return next
                          })
                        }
                      />
                    </CardHeader>
                    <CardFooter className="flex items-center gap-2">
                      {syncedIds.has(course.id) && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncSingle(course)}
                        disabled={syncedIds.has(course.id) || syncingId === course.id}
                      >
                        {syncingId === course.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Sincronizar curso'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
        <div className="flex justify-between items-center text-sm px-6 pb-6">
          <div>
            Página {page} de {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
