"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Bell, BookOpen, Calendar, Clock, CreditCard, FileText, GraduationCap, MessageSquare, User } from "lucide-react"
import { MainDashboard } from "./main-dashboard"
import { DocumentsView } from "./documents-view"
import { PaymentsView } from "./payments-view"
import { ChatBot } from "./chat-bot"

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Avatar" />
                  <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">Bienvenido, María Estudiante</h1>
                  <p className="text-muted-foreground">MBA Ejecutivo - Semestre 2</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notificaciones</span>
                </Button>
                <Button variant="outline" size="icon">
                  <MessageSquare className="h-5 w-5" />
                  <span className="sr-only">Mensajes</span>
                </Button>
                <Button variant="outline" size="icon">
                  <Calendar className="h-5 w-5" />
                  <span className="sr-only">Calendario</span>
                </Button>
                <Button>Mi Perfil</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-700">Promedio General</h3>
                <p className="text-2xl font-bold">92.5</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-700">Cursos Activos</h3>
                <p className="text-2xl font-bold">4</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="font-medium text-amber-700">Tareas Pendientes</h3>
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-700">Próxima Entrega</h3>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-700" />
                  <p className="font-medium">En 2 días</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span>Mi Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Mis Cursos</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Documentos</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Pagos</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Perfil</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <MainDashboard />
        </TabsContent>

        <TabsContent value="courses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Gestión Estratégica",
                instructor: "Dr. Juan Pérez",
                progress: 75,
                status: "En curso",
                nextClass: "Lunes, 10:00 AM",
              },
              {
                title: "Finanzas Corporativas",
                instructor: "Dra. Ana Martínez",
                progress: 60,
                status: "En curso",
                nextClass: "Martes, 2:00 PM",
              },
              {
                title: "Marketing Digital",
                instructor: "Dr. Carlos Rodríguez",
                progress: 40,
                status: "En curso",
                nextClass: "Miércoles, 4:00 PM",
              },
              {
                title: "Liderazgo Empresarial",
                instructor: "Dra. Laura Sánchez",
                progress: 25,
                status: "En curso",
                nextClass: "Jueves, 9:00 AM",
              },
            ].map((course, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{course.title}</CardTitle>
                      <CardDescription>{course.instructor}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {course.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progreso</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Próxima clase: {course.nextClass}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver curso
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsView />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsView />
        </TabsContent>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center mb-6">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Avatar" />
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold">María Estudiante</h3>
                  <p className="text-muted-foreground">ID: EST-2023-0042</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Correo Electrónico</h4>
                    <p>maria.estudiante@ejemplo.com</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Teléfono</h4>
                    <p>+502 1234 5678</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Dirección</h4>
                    <p>Zona 10, Ciudad de Guatemala</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Fecha de Nacimiento</h4>
                    <p>15 de marzo de 1995</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    Editar Información
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Información Académica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Programa Actual</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-700">MBA Ejecutivo</h4>
                      <p className="text-sm text-muted-foreground">Inicio: Agosto 2023 - Finalización: Julio 2025</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progreso del programa</span>
                          <span>25%</span>
                        </div>
                        <Progress value={25} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Historial Académico</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium">Curso</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Período</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Calificación</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr>
                            <td className="px-4 py-2">Fundamentos de Administración</td>
                            <td className="px-4 py-2">2023-1</td>
                            <td className="px-4 py-2">95</td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                Aprobado
                              </Badge>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">Economía Empresarial</td>
                            <td className="px-4 py-2">2023-1</td>
                            <td className="px-4 py-2">88</td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                Aprobado
                              </Badge>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">Métodos Cuantitativos</td>
                            <td className="px-4 py-2">2023-2</td>
                            <td className="px-4 py-2">90</td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                Aprobado
                              </Badge>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Certificaciones</h3>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">Excel Avanzado para Negocios</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Completado: Octubre 2023</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Logros</h3>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <GraduationCap className="h-5 w-5 text-amber-600" />
                          <span className="font-medium">Cuadro de Honor - 2023-1</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Promedio superior a 90</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ChatBot />
    </div>
  )
}

