"use client"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import { CoursesManagement } from "@/components/courses-management"

export default function CursosPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/academico">Académico</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Cursos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <div>
            <CardTitle>Gestión de Cursos</CardTitle>
            <CardDescription>Administre los cursos ofrecidos y su información básica</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <CoursesManagement />
        </CardContent>
      </Card>
    </div>
  )
}
