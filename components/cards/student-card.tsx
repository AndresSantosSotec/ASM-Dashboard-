"use client";

import type { Student } from "@/services/students";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Settings } from "lucide-react";

interface StudentCardProps {
  student: Student
  onViewAssignment: (studentId: string) => void
  selected?: boolean
  onSelectChange?: (checked: boolean) => void
}

export function StudentCard({
  student,
  onViewAssignment,
  selected = false,
  onSelectChange,
}: StudentCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg">{student.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{student.carnet}</Badge>
            {onSelectChange && (
              <Checkbox checked={selected} onCheckedChange={onSelectChange} />
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div>
            <span className="font-medium">Programa:</span> {student.program}
          </div>
          <div>

            <span className="font-medium">Especialidad:</span>{" "}
            {student.specialty}

          </div>
        </div>

        <Button
          onClick={() => onViewAssignment(student.id)}
          className="w-full mt-4"
        >
          <Settings className="h-4 w-4 mr-2" />
          Asignar Cursos
        </Button>
      </CardContent>
    </Card>
  );
}
