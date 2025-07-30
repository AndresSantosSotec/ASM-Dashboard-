"use client"

import { useState, useMemo } from "react"
import type { Student } from "@/services/students"
import type { Course } from "@/services/courses"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  X,
  Users,
  Plus,
  Minus,
  Search,
  Loader2,
  Calendar,
} from "lucide-react"

interface BulkAssignmentPanelProps {
  selectedStudents: Student[]
  courses: Course[]
  isLoading: boolean
  error: string | null
  onBulkAssignment: (studentIds: string[], courseIds: string[], isAssigned: boolean) => void
  onClose: () => void
}

export function BulkAssignmentPanel({
  selectedStudents,
  courses,
  isLoading,
  error,
  onBulkAssignment,
  onClose,
}: BulkAssignmentPanelProps) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterArea, setFilterArea] = useState<string>("all")
  const [filterProgram, setFilterProgram] = useState<string>("all")

  const programIds = useMemo(
    () => Array.from(new Set(selectedStudents.map((s) => s.programId).filter(Boolean))),
    [selectedStudents]
  )

  const dedupedCourses = useMemo(() => {
    const uniq = new Map<string | number, Course>()
    courses.forEach((c) => uniq.set(c.id, c))
    const list = Array.from(uniq.values())
    if (programIds.length <= 1) return list
    return list.filter((c) =>
      programIds.every((pid) => c.programIds.includes(pid))
    )
  }, [courses, programIds])

  const programOptions = useMemo(() => {
    const names = dedupedCourses.flatMap((c) =>
      Array.isArray(c.programas) ? c.programas.map((p) => p.nombre_del_programa) : []
    )
    return Array.from(new Set(names))
  }, [dedupedCourses])

  const filtered = useMemo(() => {
    return dedupedCourses.filter((course) => {
      const matchesSearch =
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesArea = filterArea === "all" || course.area === filterArea
      const matchesProgram =
        filterProgram === "all" ||
        course.programas?.some((p) => p.nombre_del_programa === filterProgram)
      return matchesSearch && matchesArea && matchesProgram
    })
  }, [dedupedCourses, searchTerm, filterArea, filterProgram])

  // Solo mostrar cursos del mes actual
  const monthCourses = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return filtered.filter((c) => {
      const d = new Date(c.startDate)
      return d >= start && d <= end
    })
  }, [filtered])

  const handleCourseSelect = (courseId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCourses((prev) => [...prev, courseId])
    } else {
      setSelectedCourses((prev) => prev.filter((id) => id !== courseId))
    }
  }

  const handleSelectAll = () => {
    if (selectedCourses.length === monthCourses.length) {
      setSelectedCourses([])
    } else {
      setSelectedCourses(monthCourses.map((c) => c.id))
    }
  }

  const handleBulkAssign = () => {
    if (selectedCourses.length > 0) {
      onBulkAssignment(
        selectedStudents.map((s) => s.id),
        selectedCourses,
        true
      )
      onClose()
    }
  }

  const handleBulkUnassign = () => {
    if (selectedCourses.length > 0) {
      onBulkAssignment(
        selectedStudents.map((s) => s.id),
        selectedCourses,
        false
      )
      onClose()
    }
  }

  const getTypeColor = (area: Course["area"]) => {
    switch (area) {
      case "common":
        return "bg-blue-500"
      case "specialty":
        return "bg-green-500"
      case "closure":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeLabel = (area: Course["area"]) => {
    switch (area) {
      case "common":
        return "Común"
      case "specialty":
        return "Especialidad"
      case "closure":
        return "Cierre"
      default:
        return ""
    }
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Asignación Masiva</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">
            Estudiantes Seleccionados ({selectedStudents.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedStudents.map((student) => (
              <Badge key={student.id} variant="secondary">
                {student.name} - {student.carnet} - {student.specialty}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar curso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las áreas</SelectItem>
                <SelectItem value="common">Común</SelectItem>
                <SelectItem value="specialty">Especialidad</SelectItem>
                <SelectItem value="closure">Cierre</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los programas</SelectItem>
                {programOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleSelectAll} className="flex-1 bg-transparent">
              {selectedCourses.length === monthCourses.length ? "Deseleccionar" : "Seleccionar"} Todo
            </Button>
          </div>

          <h4 className="font-medium mb-2 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Cursos del Mes Actual ({monthCourses.length})
          </h4>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {monthCourses.length > 0 ? (
                  monthCourses.map((course) => (
                    <div key={course.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        checked={selectedCourses.includes(course.id)}
                        onCheckedChange={(checked) =>
                          handleCourseSelect(course.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{course.name}</span>
                          <Badge className={`${getTypeColor(course.area)} text-white text-xs`}>
                            {getTypeLabel(course.area)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">{course.code}</p>

                        {course.programas && (
                          <p className="text-xs text-gray-500">
                            {course.programas.map((p) => p.nombre_del_programa).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-sm text-gray-500">
                    No hay cursos disponibles este mes con los filtros actuales
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex space-x-2 pt-4">
          <Button
            onClick={handleBulkAssign}
            disabled={selectedCourses.length === 0}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Asignar Cursos ({selectedCourses.length})
          </Button>
          <Button
            onClick={handleBulkUnassign}
            disabled={selectedCourses.length === 0}
            variant="outline"
            className="flex-1 bg-transparent"
          >
            <Minus className="h-4 w-4 mr-2" />
            Desasignar Cursos ({selectedCourses.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}