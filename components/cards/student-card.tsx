"use client";

import type { Student } from "@/services/students";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Settings, Download } from "lucide-react";
import { exportarYDescargarCursos } from "@/services/courses";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  const handleExportCourses = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    toast({
      title: "Exportando...",
      description: `Generando CSV para ${student.name}...`,
    });

    try {
      await exportarYDescargarCursos(student.carnet);

      toast({
        title: "✅ Éxito",
        description: `CSV exportado para ${student.name}`,
      });
    } catch (error: any) {
      console.error("Error exportando CSV:", error);
      const errorMessage = error?.message || error?.response?.data?.error || "Error al exportar cursos";
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

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

        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => onViewAssignment(student.id)}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-2" />
            Asignar Cursos
          </Button>
          <Button
            onClick={handleExportCourses}
            variant="outline"
            size="icon"
            title="Exportar cursos a CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
