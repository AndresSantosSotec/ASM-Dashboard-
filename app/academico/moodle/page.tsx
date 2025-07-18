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
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { BookOpen } from "lucide-react"
import Link from "next/link"
import { format, startOfMonth, addMonths, isSameMonth } from "date-fns"
import { es } from "date-fns/locale"
import { fetchMoodleCourses, MOODLE_BASE_URL } from "@/services/moodle"

interface MoodleCourse {
  id: number
  fullname: string
  timecreated: number
}

export default function MoodleCoursesPage() {
  const [courses, setCourses] = useState<MoodleCourse[]>([])
  const [search, setSearch] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<string>("all")

  const { toast } = useToast()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMoodleCourses()
        const mapped = Array.isArray(data)
          ? data.map((c: any) => ({
            id: c.id,
            fullname: c.fullname,
            timecreated: c.timecreated ?? 0,
          }))
          : []
        mapped.sort((a, b) => b.timecreated - a.timecreated)
        setCourses(mapped)

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

  // Agrupa y filtra por search + selectedYear
  const groups = useMemo(() => {
    const filtered = courses.filter(c => {
      const byYear =
        selectedYear === "all" ||
        new Date(c.timecreated * 1000).getFullYear().toString() ===
        selectedYear
      const byText = c.fullname
        .toLowerCase()
        .includes(search.toLowerCase())
      return byYear && byText
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
  }, [courses, search, selectedYear])

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
                <SelectItem value="all">Todos</SelectItem>                {years.map(y => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {groups.map(group => (
            <div key={group.date.toISOString()} className="space-y-2">
              <h3 className="text-lg font-semibold">
                {format(group.date, "MMMM yyyy", { locale: es })}
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.courses.map(course => (
                  <Card key={course.id} className="border-muted">
                    <CardHeader>
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
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
