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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import { fetchMoodleCourses } from "@/services/moodle"

interface MoodleCourse {
  id: number
  fullname: string
}

export default function MoodleCoursesPage() {
  const [courses, setCourses] = useState<MoodleCourse[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMoodleCourses()
        const mapped = Array.isArray(data)
          ? data.map((c: any) => ({ id: c.id, fullname: c.fullname }))
          : []
        setCourses(mapped)
      } catch (err) {
        console.error('Error fetching Moodle courses', err)
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
        <CardHeader className="flex flex-row items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <div>
            <CardTitle>Cursos desde Moodle</CardTitle>
            <CardDescription>Información obtenida vía API</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1">
            {courses.map(course => (
              <li key={course.id}>{course.fullname}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
