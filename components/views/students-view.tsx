"use client"

import { useState } from "react"
import type { Student } from "@/services/students"
import type { Course } from "@/services/courses"
import { StudentCard } from "@/components/cards/student-card"
import { BulkAssignmentPanel } from "@/components/bulk-assignment-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Search, Filter, Settings } from "lucide-react"

interface StudentsViewProps {
  students: Student[]
  courses: Course[]
  onViewAssignment: (studentId: string) => void
  onBulkAssignment: (studentIds: string[], courseIds: string[], isAssigned: boolean) => void
}

export function StudentsView({ students, courses, onViewAssignment, onBulkAssignment }: StudentsViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProgram, setFilterProgram] = useState<string>("all")
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [showBulkPanel, setShowBulkPanel] = useState(false)

  const programs = Array.from(new Set(students.map((s) => s.program).filter(Boolean)))
  const specialties = Array.from(new Set(students.map((s) => s.specialty).filter(Boolean)))

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.carnet.includes(searchTerm)
    const matchesProgram = filterProgram === "all" || student.program === filterProgram
    const matchesSpecialty = filterSpecialty === "all" || student.specialty === filterSpecialty
    return matchesSearch && matchesProgram && matchesSpecialty
  })

  const handleStudentSelect = (studentId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedStudents((prev) => [...prev, studentId])
    } else {
      setSelectedStudents((prev) => prev.filter((id) => id !== studentId))
    }
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id))
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilterProgram("all")
    setFilterSpecialty("all")
    setSelectedStudents([])
  }

  const selectedProgramIds = Array.from(
    new Set(
      selectedStudents
        .map((id) => students.find((s) => s.id === id)?.programId)
        .filter((id): id is number => id !== undefined)
    )
  )
  const bulkCourses = courses.filter((c) =>
    c.programIds.some((pid) => selectedProgramIds.includes(pid))
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Estudiantes ({filteredStudents.length})</h2>
          {selectedStudents.length > 0 && <Badge variant="secondary">{selectedStudents.length} seleccionados</Badge>}
        </div>
        {selectedStudents.length > 0 && (
          <Button onClick={() => setShowBulkPanel(true)} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Asignación Masiva
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros y Búsqueda</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o carnet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los programas</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program} value={program}>
                    {program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por especialidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las especialidades</SelectItem>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleSelectAll} className="flex-1 bg-transparent">
                {selectedStudents.length === filteredStudents.length ? "Deseleccionar" : "Seleccionar"} Todo
              </Button>
              <Button variant="ghost" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showBulkPanel && (
        <BulkAssignmentPanel
          selectedStudents={selectedStudents.map((id) => students.find((s) => s.id === id)!)}
          courses={bulkCourses}
          onBulkAssignment={onBulkAssignment}
          onClose={() => setShowBulkPanel(false)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            isSelected={selectedStudents.includes(student.id)}
            onSelect={handleStudentSelect}
            onViewAssignment={onViewAssignment}
          />
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron estudiantes</h3>
            <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
          </CardContent>
        </Card>
      )}
      </div>
    )
  }


