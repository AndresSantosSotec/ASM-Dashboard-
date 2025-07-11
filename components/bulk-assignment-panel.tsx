"use client"

import { useState } from "react"
import type { Student } from "@/services/students"
import type { Course } from "@/services/courses"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Users, BookOpen, Plus, Minus } from "lucide-react"

interface BulkAssignmentPanelProps {
  selectedStudents: Student[]
  courses: Course[]
  onBulkAssignment: (studentIds: string[], courseIds: string[], isAssigned: boolean) => void
  onClose: () => void
}

export function BulkAssignmentPanel({
  selectedStudents,
  courses,
  onBulkAssignment,
  onClose,
}: BulkAssignmentPanelProps) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  const handleCourseSelect = (courseId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCourses((prev) => [...prev, courseId])
    } else {
      setSelectedCourses((prev) => prev.filter((id) => id !== courseId))
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
                {student.name}
                {" "}
                {student.program ? `(${student.program})` : ""}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2 flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            Seleccionar Cursos ({selectedCourses.length} seleccionados)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {courses.map((course) => (
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
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button
            onClick={handleBulkAssign}
            disabled={selectedCourses.length === 0}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Asignar Cursos
          </Button>
          <Button
            onClick={handleBulkUnassign}
            disabled={selectedCourses.length === 0}
            variant="outline"
            className="flex-1 bg-transparent"
          >
            <Minus className="h-4 w-4 mr-2" />
            Desasignar Cursos
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}