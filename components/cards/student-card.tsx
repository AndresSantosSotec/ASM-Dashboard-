"use client"

import type { Student } from "@/academico/asignacion/simple/page"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { User, Settings, Award, BookOpen } from "lucide-react"

interface StudentCardProps {
  student: Student
  isSelected: boolean
  onSelect: (studentId: string, isSelected: boolean) => void
  onViewAssignment: (studentId: string) => void
}

export function StudentCard({ student, isSelected, onSelect, onViewAssignment }: StudentCardProps) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${isSelected ? "ring-2 ring-blue-500" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelect(student.id, checked as boolean)} />
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg">{student.name}</h3>
          </div>
          <Badge variant="outline">{student.carnet}</Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div>
            <span className="font-medium">Programa:</span> {student.program}
          </div>
          <div>
            <span className="font-medium">Especialidad:</span> {student.specialty}
          </div>
          <div className="flex justify-between">
            <div className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>Asignados: {student.assignedCourses.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Award className="h-4 w-4" />
              <span>Completados: {student.completedCourses.length}</span>
            </div>
          </div>
        </div>

        <Button onClick={() => onViewAssignment(student.id)} className="w-full">
          <Settings className="h-4 w-4 mr-2" />
          Asignar Cursos
        </Button>
      </CardContent>
    </Card>
  )
}
