"use client";

import type { Student } from "@/services/students";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Settings, Download, GraduationCap, AlertTriangle } from "lucide-react";
import { exportarYDescargarCursos } from "@/services/courses";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect, useRef } from "react";
import { fetchAvailablePensumForStudent } from "@/services/courses";

// 🆕 Verificar si un estudiante fue inscrito en los últimos N días
const isNuevo = (date: string | null, days: number = 15): boolean => {
  if (!date) return false;
  const enrolled = new Date(date);
  if (isNaN(enrolled.getTime())) return false;
  const diffDays = (Date.now() - enrolled.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
};

// Interfaz para el progreso de carrera desde Moodle
interface CareerProgress {
  cursos_aprobados: number;
  total_cursos_carrera: number;
  cursos_faltantes: number;
  en_area_cierre: boolean;
  porcentaje_avance: number;
  programa?: string;
}

interface StudentCardProps {
  student: Student
  onViewAssignment: (studentId: string) => void
  selected?: boolean
  onSelectChange?: (checked: boolean) => void
  lazyLoadPensum?: boolean // Nueva prop para controlar lazy loading
}

export function StudentCard({
  student,
  onViewAssignment,
  selected = false,
  onSelectChange,
  lazyLoadPensum = true, // Por defecto, lazy loading activado
}: StudentCardProps) {
  const { toast } = useToast();
  const [downloadState, setDownloadState] = useState<'idle' | 'processing' | 'downloading'>('idle');
  const [pendingCoursesCount, setPendingCoursesCount] = useState<number | null>(null);
  const [pensumProgress, setPensumProgress] = useState<{ completed: number; total: number } | null>(null);
  const [careerProgress, setCareerProgress] = useState<CareerProgress | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!lazyLoadPensum) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' } // Empezar a cargar 50px antes de que sea visible
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoadPensum]);

  // Obtener el conteo de cursos pendientes y progreso del pensum solo cuando es visible
  useEffect(() => {
    if (!isVisible) return;

    (async () => {
      try {
        // Obtener cursos pendientes del pensum
        const pensum = await fetchAvailablePensumForStudent(student.programId, Number(student.id));
        setPendingCoursesCount(pensum.length);
        
        // Obtener progreso completo del pensum (completados vs total)
        try {
          const progressResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/completed-courses/student/${student.id}/progress?programa_id=${student.programId}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Accept': 'application/json',
              }
            }
          );
          
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            // El backend devuelve { prospecto_id, programa_id, progress: { total_cursos, completados, ... } }
            const progress = progressData.progress || progressData;
            setPensumProgress({
              completed: progress.completados || 0,
              total: progress.total_cursos || 0
            });
          }
        } catch (progressError) {
          console.warn('[StudentCard] Could not fetch pensum progress:', progressError);
        }

        // Obtener progreso de carrera desde Moodle (cursos aprobados con nota >= 71)
        try {
          const careerResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/completed-courses/career-progress/${student.carnet}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Accept': 'application/json',
              }
            }
          );
          
          if (careerResponse.ok) {
            const careerData = await careerResponse.json();
            if (careerData.success) {
              // Los datos vienen en careerData.progreso y careerData.estado
              setCareerProgress({
                cursos_aprobados: careerData.progreso?.cursos_aprobados ?? 0,
                total_cursos_carrera: careerData.progreso?.total_cursos_carrera ?? 0,
                cursos_faltantes: careerData.progreso?.cursos_faltantes ?? 0,
                en_area_cierre: careerData.estado?.en_area_cierre ?? false,
                porcentaje_avance: careerData.progreso?.porcentaje_avance ?? 0,
                programa: careerData.programa?.nombre ?? ''
              });
            }
          }
        } catch (careerError) {
          console.warn('[StudentCard] Could not fetch career progress:', careerError);
        }
      } catch (error) {
        console.error('[StudentCard] Error fetching pensum:', error);
        setPendingCoursesCount(null);
      }
    })();
  }, [isVisible, student.programId, student.id, student.carnet]);

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

  // Determinar si el card debe mostrar alerta (área de cierre: le faltan 4 cursos o menos)
  const isInClosingArea = careerProgress?.en_area_cierre === true;

  return (
    <Card 
      ref={cardRef} 
      className={`hover:shadow-md transition-shadow ${
        isInClosingArea 
          ? 'border-2 border-amber-500 bg-amber-50 ring-2 ring-amber-200' 
          : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <User className={`h-5 w-5 ${isInClosingArea ? 'text-amber-600' : 'text-blue-600'}`} />
            <h3 className="font-semibold text-lg">{student.name}</h3>
            {(isNuevo(student.createdAt) || isNuevo(student.startDate)) && (
              <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                ✨ Nuevo
              </Badge>
            )}
            {isInClosingArea && (
              <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600 animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Área de Cierre
              </Badge>
            )}
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
            <span className="inline-flex items-center gap-2">
              {student.specialty}
              {pensumProgress && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  {pensumProgress.completed} de {pensumProgress.total}
                </Badge>
              )}
              {!pensumProgress && pendingCoursesCount !== null && pendingCoursesCount > 0 && (
                <Badge variant="outline">
                  {pendingCoursesCount}
                </Badge>
              )}
            </span>
          </div>
          
          {/* Progreso de carrera desde Moodle */}
          {careerProgress && careerProgress.total_cursos_carrera > 0 && (
            <div className={`mt-2 p-2 rounded-lg ${isInClosingArea ? 'bg-amber-100 border border-amber-300' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className={`h-4 w-4 ${isInClosingArea ? 'text-amber-600' : 'text-green-600'}`} />
                <span className="font-medium text-xs uppercase tracking-wide">
                  Progreso en Moodle
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">
                  <strong className={isInClosingArea ? 'text-amber-700' : 'text-green-700'}>
                    {careerProgress.cursos_aprobados}
                  </strong> de {careerProgress.total_cursos_carrera} cursos aprobados
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    isInClosingArea 
                      ? 'bg-amber-200 text-amber-800 border-amber-400' 
                      : 'bg-green-50 text-green-700 border-green-300'
                  }`}
                >
                  {careerProgress.porcentaje_avance}%
                </Badge>
              </div>
              {/* Barra de progreso */}
              <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isInClosingArea ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(careerProgress.porcentaje_avance, 100)}%` }}
                />
              </div>
              {isInClosingArea && (
                <p className="text-xs text-amber-700 mt-1 font-medium">
                  ⚠️ Faltan solo {careerProgress.cursos_faltantes} curso{careerProgress.cursos_faltantes !== 1 ? 's' : ''} para completar
                </p>
              )}
            </div>
          )}
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
