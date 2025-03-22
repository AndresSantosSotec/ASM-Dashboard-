import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Calendar, FileText, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EvaluacionesPage() {
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Evaluaciones</h1>
            <p className="text-muted-foreground">Gestiona exámenes, tareas y actividades para tus cursos</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Evaluación
          </Button>
        </div>

        <Tabs defaultValue="proximas">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="proximas">Próximas</TabsTrigger>
            <TabsTrigger value="pendientes">Por Calificar</TabsTrigger>
            <TabsTrigger value="completadas">Completadas</TabsTrigger>
          </TabsList>

          <TabsContent value="proximas" className="space-y-4 mt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Buscar evaluación..." className="pl-8" />
              </div>
              <Select defaultValue="todos">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los cursos</SelectItem>
                  <SelectItem value="matematicas">Matemáticas Avanzadas</SelectItem>
                  <SelectItem value="fisica">Física Cuántica</SelectItem>
                  <SelectItem value="programacion">Programación</SelectItem>
                  <SelectItem value="quimica">Química Orgánica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {
                          [
                            "Examen Parcial 1",
                            "Tarea: Ecuaciones Diferenciales",
                            "Proyecto Final",
                            "Quiz Semanal",
                            "Práctica de Laboratorio",
                          ][i]
                        }
                      </TableCell>
                      <TableCell>
                        {
                          [
                            "Matemáticas Avanzadas",
                            "Física Cuántica",
                            "Programación",
                            "Química Orgánica",
                            "Matemáticas Avanzadas",
                          ][i]
                        }
                      </TableCell>
                      <TableCell>{["Examen", "Tarea", "Proyecto", "Quiz", "Práctica"][i]}</TableCell>
                      <TableCell>{["15/05/2024", "20/05/2024", "25/05/2024", "18/05/2024", "22/05/2024"][i]}</TableCell>
                      <TableCell>
                        <Badge variant={i % 2 === 0 ? "default" : "secondary"}>
                          {i % 2 === 0 ? "Programada" : "Borrador"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="pendientes" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Evaluaciones por Calificar</CardTitle>
                <CardDescription>Tienes 8 evaluaciones pendientes de calificar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {["Examen Parcial 2", "Tarea: Algoritmos", "Proyecto de Investigación"][i]}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {["Matemáticas Avanzadas", "Programación", "Física Cuántica"][i]}
                          </p>
                          <div className="flex items-center mt-1 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            <span className="mr-3">{["10/05/2024", "08/05/2024", "05/05/2024"][i]}</span>
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            <span>{["32 entregas", "28 entregas", "15 entregas"][i]}</span>
                          </div>
                        </div>
                      </div>
                      <Button>Calificar</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completadas" className="space-y-4 mt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Buscar evaluación completada..." className="pl-8" />
              </div>
              <Select defaultValue="todos">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los cursos</SelectItem>
                  <SelectItem value="matematicas">Matemáticas Avanzadas</SelectItem>
                  <SelectItem value="fisica">Física Cuántica</SelectItem>
                  <SelectItem value="programacion">Programación</SelectItem>
                  <SelectItem value="quimica">Química Orgánica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Promedio</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {
                          [
                            "Examen Diagnóstico",
                            "Tarea: Vectores",
                            "Quiz 1",
                            "Práctica: Reacciones",
                            "Examen Parcial 1",
                          ][i]
                        }
                      </TableCell>
                      <TableCell>
                        {
                          [
                            "Matemáticas Avanzadas",
                            "Física Cuántica",
                            "Programación",
                            "Química Orgánica",
                            "Matemáticas Avanzadas",
                          ][i]
                        }
                      </TableCell>
                      <TableCell>{["Examen", "Tarea", "Quiz", "Práctica", "Examen"][i]}</TableCell>
                      <TableCell>{["01/04/2024", "10/04/2024", "15/04/2024", "20/04/2024", "25/04/2024"][i]}</TableCell>
                      <TableCell>{["8.5", "7.9", "8.2", "9.1", "7.8"][i]}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Ver detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Próximas Evaluaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
              <p className="text-sm text-muted-foreground">Programadas para los próximos 30 días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Pendientes por Calificar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12</div>
              <p className="text-sm text-muted-foreground">Entregas pendientes de revisión</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Promedio General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8.3</div>
              <p className="text-sm text-muted-foreground">De todas las evaluaciones completadas</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

