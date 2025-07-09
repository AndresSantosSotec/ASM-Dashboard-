"use client"

import type { Student } from "@/services/students"
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
              <span>Asignados</span>
              <Badge variant="secondary" className="ml-1">
                {student.assignedCourses.length}
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Award className="h-4 w-4" />
              <span>Completados</span>
              <Badge variant="secondary" className="ml-1">
                {student.completedCourses.length}
              </Badge>
            </div>
          </div>
        </div>
        
        {student.assignedCourseNames.length > 0 ? (
          <div className="mt-2 text-xs text-gray-700 space-y-1">
            {student.assignedCourseNames.map((name) => (
              <div key={name} className="truncate">
                • {name}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500 italic">Sin cursos asignados</p>
        )}

        <Button onClick={() => onViewAssignment(student.id)} className="w-full mt-4">
          <Settings className="h-4 w-4 mr-2" />
          Asignar Cursos
        </Button>
      </CardContent>
    </Card>
  )}