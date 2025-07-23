"use client"

import { useState, useEffect } from "react"
import { Search, Download, Filter, Trophy, Medal, Award, ArrowUp, ArrowDown, Minus, BookOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import {
  fetchRankingStudents,
  fetchRankingCourses,
  downloadRankingReport,
  type RankingStudent,
  type CoursePerformance,
} from "@/services/ranking"

// Tipos
// Initial data is fetched from the API

export default function RankingAcademico() {
  const [students, setStudents] = useState<RankingStudent[]>([])
  const [courses, setCourses] = useState<CoursePerformance[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [programFilter, setProgramFilter] = useState<string>("all")
  const [semesterFilter, setSemesterFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("ranking")
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Fetch students whenever filters change
  useEffect(() => {
    const getStudents = async () => {
      setLoadingStudents(true)
      try {
        const { data } = await fetchRankingStudents({
          search: debouncedSearch || undefined,
          program: programFilter !== 'all' ? programFilter : undefined,
          semester: semesterFilter !== 'all' ? Number(semesterFilter) : undefined,
          sortBy,
        })

        const withCourses = data.filter((s) => s.totalCourses > 0)
        setStudents(withCourses)
        setTotalStudents(withCourses.length)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingStudents(false)
      }
    }
    getStudents()
  }, [debouncedSearch, programFilter, semesterFilter, sortBy])

  // Fetch courses on mount
  useEffect(() => {
    const getCourses = async () => {
      setLoadingCourses(true)
      try {
        const { data } = await fetchRankingCourses({})
        setCourses(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingCourses(false)
      }
    }
    getCourses()
  }, [])

  // Obtener programas únicos para el filtro
  const uniquePrograms = Array.from(
    new Set(
      students
        .map((s) => s.program)
        .filter((program) => program !== undefined && program !== null && program !== "")
    )
  )

  // Obtener semestres únicos para el filtro
  const uniqueSemesters = Array.from(
    new Set(
      students
        .map((s) => s.semester)
        .filter((semester) => semester !== undefined && semester !== null)
    )
  ).sort((a, b) => Number(a) - Number(b))

// Filtrar estudiantes
const filteredStudents = students.filter(student => {
    const search = searchTerm.toLowerCase()
    const nameMatch = student.name
      ? student.name.toLowerCase().includes(search)
      : false
    const programMatch = student.program
      ? student.program.toLowerCase().includes(search)
      : false
    const matchesSearch = nameMatch || programMatch
    
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
  const handleDownloadReport = async () => {
    setDownloading(true)
    try {
      const blob = await downloadRankingReport({
        search: debouncedSearch || undefined,
        program: programFilter !== 'all' ? programFilter : undefined,
        semester: semesterFilter !== 'all' ? Number(semesterFilter) : undefined,
        sortBy,
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'ranking.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast({ title: 'Reporte descargado' })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Error',
        description: 'No se pudo descargar el reporte',
        variant: 'destructive',
      })
    } finally {
      setDownloading(false)
    }
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
        <Button onClick={handleDownloadReport} disabled={downloading}>
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {downloading ? 'Descargando...' : 'Descargar Reporte'}
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
          {loadingStudents ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
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
          )}

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
                    {loadingStudents ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                        </TableCell>
                      </TableRow>
                    ) : sortedStudents.length === 0 ? (
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
                    {loadingCourses ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                        </TableCell>
                      </TableRow>
                    ) : courses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                          No hay información disponible
                        </TableCell>
                      </TableRow>
                    ) : (
                      courses.map((course, idx) => (
                        <TableRow key={course.id ?? idx}>
                          <TableCell>{course.name}</TableCell>
                          <TableCell>{course.code}</TableCell>
                          <TableCell>{course.period}</TableCell>
                          <TableCell>{course.students}</TableCell>
                          <TableCell>
                            {course.averageGrade !== undefined && course.averageGrade !== null
                              ? course.averageGrade.toFixed(1)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {course.passingRate !== undefined && course.passingRate !== null
                              ? `${Math.round(course.passingRate * 100)}%`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {course.topStudent && course.topStudent.name
                              ? `${course.topStudent.name} (${course.topStudent.grade?.toFixed(1) ?? "-"})`
                              : "-"}
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
      </Tabs>
    </div>
  )
}
