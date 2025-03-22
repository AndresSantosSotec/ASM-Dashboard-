"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Medal, Star, Trophy, Users } from "lucide-react"

export function RankingView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Trophy className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Posición en el Ranking</p>
                <h3 className="text-2xl font-bold">5 / 87</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Puntos Acumulados</p>
                <h3 className="text-2xl font-bold">1,250</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Medal className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Medallas Obtenidas</p>
                <h3 className="text-2xl font-bold">8</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking Académico</CardTitle>
          <CardDescription>Posiciones basadas en el rendimiento académico</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="program">
            <TabsList className="mb-4">
              <TabsTrigger value="program">Mi Programa</TabsTrigger>
              <TabsTrigger value="course">Por Curso</TabsTrigger>
              <TabsTrigger value="medals">Medallas</TabsTrigger>
            </TabsList>

            <TabsContent value="program">
              <div className="space-y-6">
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Posición</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Estudiante</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Promedio</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Puntos</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Medallas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        {
                          position: 1,
                          name: "Carlos Mendoza",
                          average: 98.2,
                          points: 1580,
                          medals: 12,
                          isCurrentUser: false,
                        },
                        {
                          position: 2,
                          name: "Ana Ramírez",
                          average: 97.5,
                          points: 1520,
                          medals: 10,
                          isCurrentUser: false,
                        },
                        {
                          position: 3,
                          name: "Roberto Gómez",
                          average: 96.8,
                          points: 1450,
                          medals: 9,
                          isCurrentUser: false,
                        },
                        {
                          position: 4,
                          name: "Laura Sánchez",
                          average: 95.3,
                          points: 1380,
                          medals: 8,
                          isCurrentUser: false,
                        },
                        {
                          position: 5,
                          name: "María Estudiante",
                          average: 92.5,
                          points: 1250,
                          medals: 8,
                          isCurrentUser: true,
                        },
                      ].map((student, index) => (
                        <tr key={index} className={student.isCurrentUser ? "bg-blue-50 font-medium" : ""}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {student.position <= 3 ? (
                                <Trophy
                                  className={`h-5 w-5 ${
                                    student.position === 1
                                      ? "text-amber-500"
                                      : student.position === 2
                                        ? "text-gray-400"
                                        : "text-amber-700"
                                  }`}
                                />
                              ) : (
                                <span className="w-5 text-center">{student.position}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <span>{student.name}</span>
                              {student.isCurrentUser && (
                                <Badge variant="outline" className="ml-2">
                                  Tú
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">{student.average}</td>
                          <td className="px-4 py-3">{student.points}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Medal className="h-4 w-4 text-purple-600" />
                              <span>{student.medals}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Tu progreso hacia el siguiente nivel</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>1,250 puntos</span>
                      <span>1,380 puntos (Posición 4)</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    <p className="text-sm text-blue-700">Necesitas 130 puntos más para alcanzar la posición 4</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="course">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    {
                      course: "Gestión Estratégica",
                      position: 3,
                      average: 94.5,
                      totalStudents: 25,
                    },
                    {
                      course: "Finanzas Corporativas",
                      position: 7,
                      average: 88.0,
                      totalStudents: 28,
                    },
                    {
                      course: "Marketing Digital",
                      position: 2,
                      average: 96.5,
                      totalStudents: 22,
                    },
                    {
                      course: "Liderazgo Empresarial",
                      position: 5,
                      average: 90.0,
                      totalStudents: 24,
                    },
                  ].map((course, index) => (
                    <Card key={index} className="border-t-4 border-t-blue-500">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">{course.course}</h3>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span className="text-sm">
                              Posición {course.position} de {course.totalStudents}
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {course.average}
                          </Badge>
                        </div>
                        <Progress value={100 - (course.position / course.totalStudents) * 100} className="h-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Curso</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Posición</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Promedio</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Mejor Calificación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        {
                          course: "Gestión Estratégica",
                          position: "3/25",
                          average: 94.5,
                          bestGrade: 98.0,
                        },
                        {
                          course: "Finanzas Corporativas",
                          position: "7/28",
                          average: 88.0,
                          bestGrade: 95.5,
                        },
                        {
                          course: "Marketing Digital",
                          position: "2/22",
                          average: 96.5,
                          bestGrade: 98.5,
                        },
                        {
                          course: "Liderazgo Empresarial",
                          position: "5/24",
                          average: 90.0,
                          bestGrade: 97.0,
                        },
                      ].map((course, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 font-medium">{course.course}</td>
                          <td className="px-4 py-3">{course.position}</td>
                          <td className="px-4 py-3">{course.average}</td>
                          <td className="px-4 py-3">{course.bestGrade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="medals">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      name: "Excelencia Académica",
                      icon: <Award className="h-8 w-8 text-amber-500" />,
                      description: "Promedio superior a 95",
                      count: 2,
                    },
                    {
                      name: "Participación Destacada",
                      icon: <Users className="h-8 w-8 text-blue-500" />,
                      description: "Contribuciones valiosas en clase",
                      count: 3,
                    },
                    {
                      name: "Proyecto Sobresaliente",
                      icon: <Trophy className="h-8 w-8 text-purple-500" />,
                      description: "Mejor proyecto del curso",
                      count: 1,
                    },
                    {
                      name: "Asistencia Perfecta",
                      icon: <Medal className="h-8 w-8 text-green-500" />,
                      description: "100% de asistencia",
                      count: 2,
                    },
                  ].map((medal, index) => (
                    <Card key={index}>
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">{medal.icon}</div>
                        <h3 className="font-medium mb-1">{medal.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{medal.description}</p>
                        <Badge variant="outline">x{medal.count}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Medallas</CardTitle>
                    <CardDescription>Medallas obtenidas durante tu programa académico</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">Medalla</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Curso</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Otorgada por</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {[
                            {
                              medal: "Excelencia Académica",
                              course: "Fundamentos de Administración",
                              date: "15/12/2022",
                              awardedBy: "Dr. Juan Pérez",
                            },
                            {
                              medal: "Participación Destacada",
                              course: "Economía Empresarial",
                              date: "20/12/2022",
                              awardedBy: "Dra. Ana Martínez",
                            },
                            {
                              medal: "Excelencia Académica",
                              course: "Métodos Cuantitativos",
                              date: "10/02/2023",
                              awardedBy: "Dr. Carlos Rodríguez",
                            },
                            {
                              medal: "Proyecto Sobresaliente",
                              course: "Métodos Cuantitativos",
                              date: "15/02/2023",
                              awardedBy: "Dr. Carlos Rodríguez",
                            },
                            {
                              medal: "Asistencia Perfecta",
                              course: "Fundamentos de Administración",
                              date: "15/12/2022",
                              awardedBy: "Dr. Juan Pérez",
                            },
                          ].map((medal, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Medal className="h-5 w-5 text-purple-600" />
                                  <span className="font-medium">{medal.medal}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">{medal.course}</td>
                              <td className="px-4 py-3">{medal.date}</td>
                              <td className="px-4 py-3">{medal.awardedBy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

