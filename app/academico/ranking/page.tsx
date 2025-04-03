"use client"

import { useState } from "react"
import { Search, Download, Filter, Trophy, Medal, Award, ArrowUp, ArrowDown, Minus, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"

// Tipos
interface Student {
  id: string
  name: string
  program: string
  semester: number
  gpa: number
  credits: number
  totalCredits: number
  coursesCompleted: number
  totalCourses: number
  ranking: number
  previousRanking: number | null
  badges: string[]
}

interface Course {
  id: string
  name: string
  code: string
  period: string
  students: number
  averageGrade: number
  passingRate: number
  topStudent: {
    id: string
    name: string
    grade: number
  }
}

// Datos de ejemplo
const mockStudents: Student[] = [
  {
    id: "1",
    name: "María González",
    program: "Ingeniería en Sistemas Computacionales",
    semester: 4,
    gpa: 9.8,
    credits: 72,
    totalCredits: 180,
    coursesCompleted: 18,
    totalCourses: 45,
    ranking: 1,
    previousRanking: 2,
    badges: ["Excelencia Académica", "Mejor Promedio"],
  },
  {
    id: "2",
    name: "Juan Pérez",
    program: "Licenciatura en Administración de Empresas",
    semester: 3,
    gpa: 9.5,
    credits: 45,
    totalCredits: 120,
    coursesCompleted: 12,
    totalCourses: 36,
    ranking: 2,
    previousRanking: 1,
    badges: ["Excelencia Académica"],
  },
  {
    id: "3",
    name: "Ana López",
    program: "Licenciatura en Psicología",
    semester: 5,
    gpa: 9.3,
    credits: 90,
    totalCredits: 150,
    coursesCompleted: 22,
    totalCourses: 38,
    ranking: 3,
    previousRanking: 5,
    badges: ["Mejor Promedio en Semestre"],
  },
  {
    id: "4",
    name: "Carlos Rodríguez",
    program: "Maestría en Educación",
    semester: 2,
    gpa: 9.1,
    credits: 24,
    totalCredits: 60,
    coursesCompleted: 6,
    totalCourses: 15,
    ranking: 4,
    previousRanking: 3,
    badges: [],
  },
  {
    id: "5",
    name: "Pedro Sánchez",
    program: "Ingeniería en Sistemas Computacionales",
    semester: 6,
    gpa: 8.9,
    credits: 108,
    totalCredits: 180,
    coursesCompleted: 27,
    totalCourses: 45,
    ranking: 5,
    previousRanking: 4,
    badges: [],
  },
  {
    id: "6",
    name: "Laura Martínez",
    program: "Licenciatura en Administración de Empresas",
    semester: 7,
    gpa: 8.7,
    credits: 105,
    totalCredits: 120,
    coursesCompleted: 30,
    totalCourses: 36,
    ranking: 6,
    previousRanking: 6,
    badges: [],
  },
  {
    id: "7",
    name: "Roberto Díaz",
    program: "Doctorado en Ciencias",
    semester: 3,
    gpa: 8.5,
    credits: 45,
    totalCredits: 90,
    coursesCompleted: 10,
    totalCourses: 20,
    ranking: 7,
    previousRanking: 8,
    badges: [],
  },
  {
    id: "8",
    name: "Sofía Hernández",
    program: "Maestría en Administración de Negocios",
    semester: 4,
    gpa: 8.3,
    credits: 48,
    totalCredits: 60,
    coursesCompleted: 12,
    totalCourses: 15,
    ranking: 8,
    previousRanking: 7,
    badges: [],
  },
]

const mockCourses: Course[] = [
  {
    id: "c1",
    name: "Introducción a la Programación",
    code: "CS101",
    period: "2023-1",
    students: 30,
    averageGrade: 8.2,
    passingRate: 0.85,
    topStudent: {
      id: "1",
      name: "María González",
      grade: 10.0,
    },
  },
  {
    id: "c2",
    name: "Estadística Aplicada",
    code: "STAT202",
    period: "2023-1",
    students: 25,
    averageGrade: 7.8,
    passingRate: 0.76,
    topStudent: {
      id: "3",
      name: "Ana López",
      grade: 9.8,
    },
  },
  {
    id: "c3",
    name: "Metodología de la Investigación",
    code: "RES301",
    period: "2023-1",
    students: 28,
    averageGrade: 8.5,
    passingRate: 0.89,
    topStudent: {
      id: "4",
      name: "Carlos Rodríguez",
      grade: 9.7,
    },
  },
  {
    id: "c4",
    name: "Fundamentos de Administración",
    code: "ADM101",
    period: "2023-1",
    students: 35,
    averageGrade: 8.0,
    passingRate: 0.83,
    topStudent: {
      id: "2",
      name: "Juan Pérez",
      grade: 9.9,
    },
  },
  {
    id: "c5",
    name: "Programación Orientada a Objetos",
    code: "CS201",
    period: "2023-1",
    students: 22,
    averageGrade: 7.9,
    passingRate: 0.77,
    topStudent: {
      id: "1",
      name: "María González",
      grade: 9.8,
    },
  },
]

export default function RankingAcademico() {
  const [students] = useState<Student[]>(mockStudents)
  const [courses] = useState<Course[]>(mockCourses)
  const [searchTerm, setSearchTerm] = useState("")
  const [programFilter, setProgramFilter] = useState<string>("all")
  const [semesterFilter, setSemesterFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("ranking")

  // Obtener programas únicos para el filtro
  const uniquePrograms = Array.from(new Set(students.map(s => s.program)))
  
  // Obtener semestres únicos para el filtro
  const uniqueSemesters = Array.from(new Set(students.map(s => s.semester))).sort((a, b) => a - b)

  // Filtrar estudiantes
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.program.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesProgram = programFilter === "all" || student.program === programFilter
    const matchesSemester = semesterFilter === "all" || student.semester.toString() === semesterFilter
    
    return matchesSearch && matchesProgram && matchesSemester
  })

  // Ordenar estudiantes
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === "ranking") {
      return a.ranking - b.ranking
    } else if (sortBy === "gpa") {
      return b.gpa - a.gpa
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name)
    } else if (sortBy === "credits") {
      return b.credits - a.credits
    } else {
      return a.ranking - b.ranking
    }
  })

  // Descargar reporte
  const handleDownloadReport = () => {
    toast({
      title: "Reporte descargado",
      description: "El reporte de ranking académico ha sido descargado correctamente."
    })
  }

  // Renderizar indicador de cambio en el ranking
  const renderRankingChange = (current: number, previous: number | null) => {
    if (previous === null) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Nuevo
        </Badge>
      )
    }
    
    if (current < previous) {
      return (
        <div className="flex items-center text-green-600">
          <ArrowUp className="h-4 w-4 mr-1" />
          <span>{previous - current}</span>
        </div>
      )
    } else if (current > previous) {
      return (
        <div className="flex items-center text-red-600">
          <ArrowDown className="h-4 w-4 mr-1" />
          <span>{current - previous}</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <Minus className="h-4 w-4 mr-1" />
          <span>0</span>
        </div>
      )
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ranking y Rendimiento Académico</h1>
        <Button onClick={handleDownloadReport}>
          <Download className="mr-2 h-4 w-4" /> Descargar Reporte
        </Button>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="students">
            <Trophy className="h-4 w-4 mr-2" />
            Ranking de Estudiantes
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4 mr-2" />
            Rendimiento por Curso
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="students">
          {/* Top 3 estudiantes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {students.slice(0, 3).map((student, index) => (
              <Card
                key={student.id}
                className={
                  index === 0
                    ? "bg-amber-50 border-amber-200"
                    : index === 1
                    ? "bg-gray-50 border-gray-200"
                    : "bg-orange-50 border-orange-200"
                }
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={
                        index === 0
                          ? "bg-amber-100 p-3 rounded-full mb-3"
                          : index === 1
                          ? "bg-gray-200 p-3 rounded-full mb-3"
                          : "bg-orange-100 p-3 rounded-full mb-3"
                      }
                    >
                      {index === 0 ? (
                        <Trophy className="h-8 w-8 text-amber-600" />
                      ) : index === 1 ? (
                        <Medal className="h-8 w-8 text-gray-600" />
                      ) : (
                        <Award className="h-8 w-8 text-orange-600" />
                      )}
                    </div>
                    <div className="text-lg font-bold mb-1">{student.name}</div>
                    <div className="text-sm text-gray-500 mb-2">{student.program}</div>
                    <div className="flex items-center mb-2">
                      <span className="text-2xl font-bold mr-2">{student.gpa.toFixed(1)}</span>
                      <span className="text-sm text-gray-500">GPA</span>
                    </div>
                    <div className="w-full">
                      <div className="text-xs text-gray-500 flex justify-between mb-1">
                        <span>Progreso</span>
                        <span>{Math.round((student.credits / student.totalCredits) * 100)}%</span>
                      </div>
                      <Progress
                        value={(student.credits / student.totalCredits) * 100}
                        className="h-1.5"
                      />
                    </div>
                    <div className="flex flex-wrap justify-center gap-1 mt-3">
                      {student.badges.map((badge, i) => (
                        <Badge key={i} variant="outline" className="bg-white">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar estudiante..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Programa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los programas</SelectItem>
                    {uniquePrograms.map((program) => (
                      <SelectItem key={program} value={program}>
                        {program}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los semestres</SelectItem>
                    {uniqueSemesters.map((semester) => (
                      <SelectItem key={semester} value={semester.toString()}>
                        Semestre {semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ranking">Ranking</SelectItem>
                    <SelectItem value="gpa">Promedio</SelectItem>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="credits">Créditos</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Aplicar filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de ranking */}
          <Card>
            <CardHeader>
              <CardTitle>Ranking Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Ranking</TableHead>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Promedio</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Cambio</TableHead>
                      <TableHead>Reconocimientos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                          No se encontraron estudiantes con los filtros seleccionados
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium text-center">
                            {student.ranking <= 3 ? (
                              <div
                                className={
                                  student.ranking === 1
                                    ? "text-amber-500"
                                    : student.ranking === 2
                                    ? "text-gray-500"
                                    : "text-orange-500"
                                }
                              >
                                {student.ranking}
                                {student.ranking === 1 ? (
                                  <Trophy className="h-4 w-4 inline ml-1" />
                                ) : student.ranking === 2 ? (
                                  <Medal className="h-4 w-4 inline ml-1" />
                                ) : (
                                  <Award className="h-4 w-4 inline ml-1" />
                                )}
                              </div>
                            ) : (
                              student.ranking
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.program}</div>
                            <div className="text-xs text-gray-500">Semestre {student.semester}</div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`text-lg font-bold ${
                                student.gpa >= 9
                                  ? "text-green-600"
                                  : student.gpa >= 8
                                  ? "text-blue-600"
                                  : student.gpa >= 7
                                  ? "text-amber-600"
                                  : "text-red-600"
                              }`}
                            >
                              {student.gpa.toFixed(1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{Math.round((student.credits / student.totalCredits) * 100)}%</span>
                              <Progress
                                value={(student.credits / student.totalCredits) * 100}
                                className="h-1.5"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            {renderRankingChange(student.ranking, student.previousRanking)}
                          </TableCell>
                          <TableCell>
                            {student.badges.length > 0 ? (
                              student.badges.map((badge, i) => (
                                <Badge key={i} variant="outline" className="bg-white mr-1">
                                  {badge}
                                </Badge>
                              ))
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Estudiantes</TableHead>
                      <TableHead>Promedio</TableHead>
                      <TableHead>Tasa de Aprobación</TableHead>
                      <TableHead>Mejor Estudiante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.code}</TableCell>
                        <TableCell>{course.period}</TableCell>
                        <TableCell>{course.students}</TableCell>
                        <TableCell>{course.averageGrade.toFixed(1)}</TableCell>
                        <TableCell>{Math.round(course.passingRate * 100)}%</TableCell>
                        <TableCell>
                          {course.topStudent.name} ({course.topStudent.grade.toFixed(1)})
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
