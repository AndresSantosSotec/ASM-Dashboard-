"use client"

import { ProgramasAcademicos } from "@/components/programas-academicos"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { School } from "lucide-react"

export default function ProgramasPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/academico">Académico</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Programas</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <School className="h-6 w-6" />
          <div>
            <CardTitle>Gestión de Programas Académicos</CardTitle>
            <CardDescription>Administre los programas académicos, sus requisitos y planes de pago</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ProgramasAcademicos />
        </CardContent>
      </Card>
    </div>
  )
}

