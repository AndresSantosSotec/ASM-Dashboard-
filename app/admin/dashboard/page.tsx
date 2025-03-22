"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, GraduationCapIcon as Graduation, Users, CalendarIcon } from "lucide-react"
import Link from "next/link"

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState<"6m" | "1y" | "all">("6m")

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Exportar Datos
          </Button>
          <Button variant="outline" size="sm">
            Imprimir
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Matrículas del Mes</p>
                <h3 className="text-2xl font-bold mt-1">245</h3>
                <p className="text-xs text-green-600 mt-1">+12% vs mes anterior</p>
              </div>
              <Users className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Alumnos Nuevos</p>
                <h3 className="text-2xl font-bold mt-1">87</h3>
                <p className="text-xs text-green-600 mt-1">+5% vs mes anterior</p>
              </div>
              <Users className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Próximos Inicios</p>
                <h3 className="text-2xl font-bold mt-1">12</h3>
                <p className="text-xs text-gray-500 mt-1">Próximos 30 días</p>
              </div>
              <Calendar className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Graduaciones</p>
                <h3 className="text-2xl font-bold mt-1">34</h3>
                <p className="text-xs text-gray-500 mt-1">Próximo trimestre</p>
              </div>
              <Graduation className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Evolución de Matrícula</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant={dateRange === "6m" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange("6m")}
                >
                  6 Meses
                </Button>
                <Button
                  variant={dateRange === "1y" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange("1y")}
                >
                  1 Año
                </Button>
                <Button
                  variant={dateRange === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange("all")}
                >
                  Todo
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
              <p className="text-gray-500">Gráfica de evolución de matrícula mensual</p>
              {/* Aquí iría el componente de gráfica real */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Distribución por Programas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
              <p className="text-gray-500">Gráfica de distribución de alumnos por programa</p>
              {/* Aquí iría el componente de gráfica real */}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accesos Rápidos y Notificaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/admin/reportes-matricula">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Reportes de Matrícula
              </Button>
            </Link>
            <Link href="/admin/programacion-cursos">
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Programación de Cursos
              </Button>
            </Link>
            <Link href="/admin/reporte-graduaciones">
              <Button variant="outline" className="w-full justify-start">
                <Graduation className="mr-2 h-4 w-4" />
                Reporte de Graduaciones
              </Button>
            </Link>
            <Link href="/admin/plantillas-mailing">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Plantillas y Mailing
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notificaciones Importantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start p-3 bg-blue-50 rounded-md">
                <div className="mr-3 mt-0.5">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium">Solicitudes Pendientes</h4>
                  <p className="text-sm text-gray-600">Hay 15 solicitudes pendientes de revisión</p>
                  <Button variant="link" className="h-auto p-0 text-blue-600">
                    Ver solicitudes
                  </Button>
                </div>
              </div>

              <div className="flex items-start p-3 bg-orange-50 rounded-md">
                <div className="mr-3 mt-0.5">
                  <Graduation className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-medium">Graduaciones Próximas</h4>
                  <p className="text-sm text-gray-600">34 alumnos se graduarán en el próximo trimestre</p>
                  <Button variant="link" className="h-auto p-0 text-orange-600">
                    Ver detalles
                  </Button>
                </div>
              </div>

              <div className="flex items-start p-3 bg-purple-50 rounded-md">
                <div className="mr-3 mt-0.5">
                  <Calendar className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-medium">Cursos por Finalizar</h4>
                  <p className="text-sm text-gray-600">8 cursos finalizarán en los próximos 15 días</p>
                  <Button variant="link" className="h-auto p-0 text-purple-600">
                    Programar evaluaciones
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

