"use client";

import type { Student } from "@/services/students";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Settings, Download } from "lucide-react";
import { exportarYDescargarCursos } from "@/services/courses";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

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
  const [downloadState, setDownloadState] = useState<'idle' | 'processing' | 'downloading'>('idle');

  const handleExportCourses = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (downloadState !== 'idle') return; // Prevenir múltiples clics
    
    setDownloadState('processing');
    
    const processingToast = toast({
      title: "🔄 Procesando...",
      description: `Generando CSV para ${student.name}...`,
      duration: 0, // No auto-dismiss
    });

    try {
      await exportarYDescargarCursos(student.carnet);
      
      // Dismiss processing toast
      if (processingToast?.dismiss) {
        processingToast.dismiss();
      }
      
      setDownloadState('downloading');
      
      toast({
        title: "⬇️ Descargando...",
        description: `CSV de ${student.name} se está descargando`,
        duration: 3000,
      });
      
      // Reset state after download indication
      setTimeout(() => setDownloadState('idle'), 3000);

    } catch (error: any) {
      console.error("Error exportando CSV:", error);
      
      // Dismiss processing toast
      if (processingToast?.dismiss) {
        processingToast.dismiss();
      }
      
      const errorMessage = error?.message || error?.response?.data?.error || "Error al exportar cursos";
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      setDownloadState('idle');
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
            disabled={downloadState !== 'idle'}
            className={downloadState !== 'idle' ? "opacity-75 cursor-not-allowed" : ""}
          >
            {downloadState === 'idle' && <Download className="h-4 w-4" />}
            {downloadState === 'processing' && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            )}
            {downloadState === 'downloading' && (
              <div className="h-4 w-4 animate-bounce">⬇️</div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
