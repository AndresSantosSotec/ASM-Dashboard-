"use client"

import { useEffect, useState } from "react"
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
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

import { BookOpen } from "lucide-react"
import { fetchMoodleCourses } from "@/services/moodle"

interface MoodleCourse {
  id: number
  fullname: string
}

export default function MoodleCoursesPage() {
  const [courses, setCourses] = useState<MoodleCourse[]>([])

  const [search, setSearch] = useState("")
  const { toast } = useToast()


  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMoodleCourses()
        const mapped = Array.isArray(data)
          ? data.map((c: any) => ({ id: c.id, fullname: c.fullname }))
          : []
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
  }, [])

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
          <div className="flex flex-row items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <div>
              <CardTitle>Cursos desde Moodle</CardTitle>
              <CardDescription>Información obtenida vía API</CardDescription>
            </div>
          </div>
          <Input
            placeholder="Buscar cursos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-sm"
            type="search"
          />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses
              .filter(c =>
                c.fullname.toLowerCase().includes(search.toLowerCase()),
              )
              .map(course => (
                <Card key={course.id} className="border-muted">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      {course.fullname}
                    </CardTitle>
                    <CardDescription>ID: {course.id}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
