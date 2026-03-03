"use client";

import { useState, useMemo, useEffect } from "react";
import type { Student } from "@/services/students";
import type { Course } from "@/services/courses";
import { fetchStudentCourseLists, bulkAssignCourses } from "@/services/students";
import { exportarYDescargarCursosMasivo } from "@/services/courses";
import fetchApprovedMoodleCourses, { MoodleQueryCourse } from "@/services/moodleCourseQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  X,
  Users,
  CheckCircle2,
  Circle,
  Search,
  Calendar,
  Filter,
  Loader2,
  Award,
  BookOpen,
  AlertCircle,
  Check,
  Download,
  AlertTriangle,
  GraduationCap,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// 🆕 Función para verificar si un estudiante fue inscrito en los últimos N días
const isRecentlyEnrolled = (createdAt: string | null, days: number = 5): boolean => {
  if (!createdAt) return false;
  
  const enrolledDate = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - enrolledDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= days;
};

// 🆕 Normalizar el día de estudio para mostrar
const normalizeDayName = (day: string | null): string => {
  if (!day) return '';
  const dayLower = day.toLowerCase();
  const dayMap: Record<string, string> = {
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miércoles': 'Miércoles',
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sábado': 'Sábado',
    'sabado': 'Sábado',
    'domingo': 'Domingo',
  };
  return dayMap[dayLower] || day;
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

interface BulkAssignmentImprovedPanelProps {
  selectedStudents: Student[];
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

interface StudentCourseSelection {
  studentId: string;
  selectedCourseIds: string[];
  completedCourseIds: string[]; // IDs de cursos completados del sistema
  moodleCompletedCourses: MoodleQueryCourse[]; // Cursos de Moodle
}

// Función auxiliar para comparar nombres (de student-assignment-view.tsx)
const normalizeName = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");

const levenshtein = (a: string, b: string) => {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, () => []);
  for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[b.length][a.length];
};

const areNamesSimilar = (a: string, b: string) => {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na.includes(nb) || nb.includes(na)) return true;
  const distance = levenshtein(na, nb);
  const ratio = distance / Math.max(na.length, nb.length);
  return ratio <= 0.3;
};

// 🔹 Hook personalizado para caché local persistente
function usePersistedState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      console.error("Error guardando en localStorage");
    }
  }, [key, state]);

  return [state, setState];
}

export function BulkAssignmentImprovedPanel({
  selectedStudents,
  courses,
  isLoading,
  error,
  onClose,
}: BulkAssignmentImprovedPanelProps) {
  const { toast } = useToast();

  // 🔹 Filtros globales
  const [globalSearchName, setGlobalSearchName] = useState("");
  const [globalSearchCode, setGlobalSearchCode] = useState("");
  const [globalFilterDate, setGlobalFilterDate] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  // 🔹 Estados para modales de confirmación
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<{
    totalStudents: number;
    totalCourses: number;
    details: Array<{ 
      studentName: string; 
      studentCarnet: string;
      coursesCount: number; 
      courseNames: string[] 
    }>;
  } | null>(null);

  // 🔹 Caché persistente de selecciones
  const [selections, setSelections] = usePersistedState<StudentCourseSelection[]>(
    "bulk-assignment-selections",
    []
  );

  // 🔹 Estado para progreso de carrera (área de cierre)
  const [careerProgressMap, setCareerProgressMap] = useState<Record<string, CareerProgress>>({});

  // 🔹 Inicializar selecciones con datos reales del backend
  useEffect(() => {
    (async () => {
      setLoadingData(true);
      try {
        const updated = await Promise.all(
          selectedStudents.map(async (student) => {
            // Verificar si ya existe en cache
            const existing = selections.find((s) => s.studentId === student.id);
            
            // Si ya existe en cache y tiene datos válidos, usarlos
            if (existing && existing.completedCourseIds && existing.moodleCompletedCourses && 
                (existing.completedCourseIds.length > 0 || existing.moodleCompletedCourses.length > 0)) {
              return existing;
            }

            // Si no existe o está vacío, cargar desde backend
            try {
              const [lists, moodle] = await Promise.all([
                fetchStudentCourseLists(student.id),
                fetchApprovedMoodleCourses(student.carnet),
              ]);

              // Asegurar que lists.completed es un array
              const completedCourses = Array.isArray(lists?.completed) ? lists.completed : [];
              // Asegurar que moodle es un array
              const moodleCourses = Array.isArray(moodle) ? moodle : [];

              // Filtrar Moodle para evitar duplicados con cursos del sistema
              const filteredMoodle = moodleCourses.filter(
                (m) => !completedCourses.some((c) => areNamesSimilar(m.coursename, c.name))
              );

              return {
                studentId: student.id,
                selectedCourseIds: existing?.selectedCourseIds || [],
                completedCourseIds: completedCourses.map((c) => String(c.id)),
                moodleCompletedCourses: filteredMoodle,
              };
            } catch (err) {
              console.error(`Error cargando cursos para estudiante ${student.id}:`, err);
              return {
                studentId: student.id,
                selectedCourseIds: existing?.selectedCourseIds || [],
                completedCourseIds: [],
                moodleCompletedCourses: [],
              };
            }
          })
        );
        setSelections(updated);
      } catch (err) {
        console.error("Error inicializando selecciones:", err);
        // En caso de error, inicializar con arrays vacíos
        const fallbackSelections = selectedStudents.map((student) => ({
          studentId: student.id,
          selectedCourseIds: [],
          completedCourseIds: [],
          moodleCompletedCourses: [],
        }));
        setSelections(fallbackSelections);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [selectedStudents.map(s => s.id).join(',')]); // Solo re-ejecutar si cambian los estudiantes

  // 🔹 Cargar progreso de carrera para detectar área de cierre
  useEffect(() => {
    (async () => {
      if (selectedStudents.length === 0) return;
      
      try {
        const carnets = selectedStudents.map(s => s.carnet);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/completed-courses/career-progress-batch`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ carnets }),
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // data.data es un objeto con carnets como keys, ya es un map
            const progressMap: Record<string, CareerProgress> = {};
            // Si es objeto, usarlo directamente; si es array, convertir
            if (Array.isArray(data.data)) {
              data.data.forEach((item: any) => {
                progressMap[item.carnet] = item;
              });
            } else {
              // Es un objeto con carnets como keys
              Object.assign(progressMap, data.data);
            }
            setCareerProgressMap(progressMap);
          }
        }
      } catch (error) {
        console.warn('[BulkAssignment] Could not fetch career progress:', error);
      }
    })();
  }, [selectedStudents.map(s => s.carnet).join(',')]);

  // 🔹 Obtener cursos disponibles para un estudiante específico (SOLO DEL MES ACTUAL)
  const getAvailableCoursesForStudent = (studentId: string) => {
    const selection = selections.find((s) => s.studentId === studentId);
    if (!selection) return [];

    // Calcular rango del mes actual
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return courses.filter((course) => {
      // Excluir cursos completados del sistema
      if (selection.completedCourseIds && selection.completedCourseIds.includes(String(course.id))) return false;

      // Excluir cursos completados de Moodle (por similitud de nombre)
      if (selection.moodleCompletedCourses && Array.isArray(selection.moodleCompletedCourses) && selection.moodleCompletedCourses.some((m) => areNamesSimilar(m.coursename, course.name))) {
        return false;
      }

      // Excluir cursos con status 'synced' (ya sincronizados)
      if (course.status === 'synced') return false;

      // 🔹 FILTRO MES ACTUAL + SIGUIENTE: startDate en rango OR nombre contiene mes+año
      const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthEnd = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, 0, 23, 59, 59);
      const mesActual = MESES_ES[now.getMonth()].toUpperCase();
      const mesSiguiente = MESES_ES[nextMonthDate.getMonth()].toUpperCase();
      const añoActual = String(now.getFullYear());
      const añoSiguiente = String(nextMonthDate.getFullYear());
      const courseStartDate = new Date(course.startDate);
      const inDateRange = !isNaN(courseStartDate.getTime()) && courseStartDate >= monthStart && courseStartDate <= nextMonthEnd;
      const nameUp = course.name.toUpperCase();
      const inNameMatch = (nameUp.includes(mesActual) && nameUp.includes(añoActual)) ||
                          (nameUp.includes(mesSiguiente) && nameUp.includes(añoSiguiente));
      if (!inDateRange && !inNameMatch) return false;

      // Aplicar filtros globales
      const matchesName =
        !globalSearchName ||
        course.name.toLowerCase().includes(globalSearchName.toLowerCase());
      const matchesCode =
        !globalSearchCode ||
        course.code.toLowerCase().includes(globalSearchCode.toLowerCase());
      const matchesDate =
        !globalFilterDate ||
        course.startDate.includes(globalFilterDate);

      return matchesName && matchesCode && matchesDate;
    });
  };

  // 🔹 Obtener cursos completados del sistema para un estudiante
  const getCompletedCoursesForStudent = (studentId: string) => {
    const selection = selections.find((s) => s.studentId === studentId);
    if (!selection || !selection.completedCourseIds) return [];

    return courses.filter((course) =>
      selection.completedCourseIds.includes(String(course.id))
    );
  };

  // 🔹 Obtener cursos completados de Moodle para un estudiante
  const getMoodleCompletedCoursesForStudent = (studentId: string) => {
    const selection = selections.find((s) => s.studentId === studentId);
    if (!selection) return [];

    return selection.moodleCompletedCourses || [];
  };

  // 🔹 Toggle selección de curso para un estudiante
  const toggleCourseSelection = (studentId: string, courseId: string) => {
    setSelections((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;
        const isSelected = s.selectedCourseIds.includes(courseId);
        return {
          ...s,
          selectedCourseIds: isSelected
            ? s.selectedCourseIds.filter((id) => id !== courseId)
            : [...s.selectedCourseIds, courseId],
        };
      })
    );
  };

  // 🔹 Total de cursos seleccionados en todos los estudiantes
  const totalSelectedCourses = useMemo(
    () =>
      selections.reduce(
        (sum, s) => sum + s.selectedCourseIds.length,
        0
      ),
    [selections]
  );

  // Preparar datos para la confirmación
  const handleConfirmClick = () => {
    const studentCourseMap = selections.filter(
      (s) => s.selectedCourseIds.length > 0
    );

    if (studentCourseMap.length === 0) {
      toast({
        title: "Sin selección",
        description: "Debes seleccionar al menos un curso para asignar",
        variant: "destructive",
      });
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirmDialog(true);
  };

  // Confirmar asignación masiva (después de la confirmación del usuario)
  const handleConfirm = async () => {
    const studentCourseMap = selections.filter(
      (s) => s.selectedCourseIds.length > 0
    );

    // 🔹 Preparar asignaciones individualizadas: cada estudiante con sus cursos específicos
    const assignments = studentCourseMap.map((s) => ({
      studentId: s.studentId,
      courseIds: s.selectedCourseIds,
    }));

    // Calcular totales y detalles para el resumen
    const totalStudents = assignments.length;
    const totalCourses = assignments.reduce((sum, a) => sum + a.courseIds.length, 0);

    // Preparar detalles de cada estudiante
    const details = assignments.map((assignment) => {
      const student = selectedStudents.find(s => s.id === assignment.studentId);
      const assignedCourses = courses.filter(c => assignment.courseIds.includes(String(c.id)));
      
      return {
        studentName: student?.name || 'Desconocido',
        studentCarnet: student?.carnet || '',
        coursesCount: assignment.courseIds.length,
        courseNames: assignedCourses.map(c => c.name),
      };
    });

    try {
      // Llamar a la API con la nueva estructura
      await bulkAssignCourses(assignments);
      
      // Cerrar modal de confirmación
      setShowConfirmDialog(false);
      
      // Guardar resultado para mostrar en modal de éxito
      setAssignmentResult({
        totalStudents,
        totalCourses,
        details,
      });
      
      // Mostrar modal de éxito
      setShowSuccessDialog(true);
      
      // Limpiar caché después de confirmar
      setSelections([]);
      
    } catch (err) {
      console.error("Error en asignación masiva:", err);
      setShowConfirmDialog(false);
      toast({
        title: "❌ Error",
        description: "Hubo un problema al asignar los cursos",
        variant: "destructive",
      });
    }
  };

  // Limpiar todas las selecciones
  const handleClearAll = () => {
    setSelections((prev) =>
      prev.map((s) => ({ ...s, selectedCourseIds: [] }))
    );
    toast({
      title: "Selecciones limpiadas",
      description: "Todas las selecciones han sido eliminadas",
    });
  };

  // Descargar CSV de los estudiantes asignados
  const handleDownloadCSV = async () => {
    if (!assignmentResult) return;
    
    setIsDownloadingCSV(true);
    
    try {
      // Obtener los carnets de los estudiantes que recibieron cursos
      const carnets = assignmentResult.details.map(d => d.studentCarnet).filter(Boolean);
      
      toast({
        title: "Descargando...",
        description: `Generando CSV de ${carnets.length} estudiante(s)...`,
      });

      await exportarYDescargarCursosMasivo(carnets);

      toast({
        title: "✅ Descarga exitosa",
        description: `Se descargó el CSV de ${carnets.length} estudiante(s)`,
      });

    } catch (error: any) {
      console.error("Error descargando CSV:", error);
      toast({
        title: "❌ Error",
        description: error?.message || "Hubo un problema al descargar el CSV",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Asignación Masiva de Cursos</span>
            <Badge variant="secondary" className="ml-2">
              {selectedStudents.length} estudiantes
            </Badge>
            {totalSelectedCourses > 0 && (
              <Badge className="bg-blue-600 text-white animate-pulse">
                {totalSelectedCourses} cursos seleccionados
              </Badge>
            )}
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Cursos disponibles del mes actual para asignación
          {totalSelectedCourses > 0 && (
            <span className="ml-2 text-blue-600 font-semibold">
              • {totalSelectedCourses} curso(s) listo(s) para asignar
            </span>
          )}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumen visual de selección */}
        {totalSelectedCourses > 0 && (
          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Cursos Seleccionados</AlertTitle>
            <AlertDescription className="text-blue-800">
              Has seleccionado <strong>{totalSelectedCourses}</strong> curso(s) para{" "}
              <strong>{selections.filter(s => s.selectedCourseIds.length > 0).length}</strong> estudiante(s).
              Haz clic en "Confirmar Asignación" para continuar.
            </AlertDescription>
          </Alert>
        )}

        {/* Estudiantes seleccionados */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium mb-3 text-sm text-blue-900 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Estudiantes Seleccionados ({selectedStudents.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedStudents.map((student) => {
              const selection = selections.find((s) => s.studentId === student.id);
              const selectedCount = selection?.selectedCourseIds.length || 0;
              return (
                <Badge
                  key={student.id}
                  variant="outline"
                  className="px-3 py-2 bg-white border-blue-300"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{student.name}</span>
                    <span className="text-xs text-gray-600">
                      {student.carnet} - {student.specialty}
                    </span>
                    {selectedCount > 0 && (
                      <span className="text-xs text-blue-600 font-medium mt-1">
                        {selectedCount} cursos seleccionados
                      </span>
                    )}
                  </div>
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Filtros globales */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium mb-3 text-sm text-gray-900 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre..."
                value={globalSearchName}
                onChange={(e) => setGlobalSearchName(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por código..."
                value={globalSearchCode}
                onChange={(e) => setGlobalSearchCode(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={globalFilterDate}
                onChange={(e) => setGlobalFilterDate(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </div>
        </div>

        {/* 🔹 Acordeón de estudiantes */}
        <Accordion type="multiple" className="w-full space-y-3">
          {selectedStudents.map((student) => {
            const availableCourses = getAvailableCoursesForStudent(student.id) || [];
            const completedCourses = getCompletedCoursesForStudent(student.id) || [];
            const moodleCompletedCourses = getMoodleCompletedCoursesForStudent(student.id) || [];
            const selection = selections.find((s) => s.studentId === student.id);
            const selectedCount = selection?.selectedCourseIds.length || 0;
            const totalCompleted = (completedCourses?.length || 0) + (moodleCompletedCourses?.length || 0);
            
            // Obtener progreso de carrera para este estudiante
            const careerProgress = careerProgressMap[student.carnet];
            const isInClosingArea = careerProgress?.en_area_cierre === true;
            
            // 🆕 Detectar si fue inscrito recientemente (últimos 5 días)
            const isRecent = isRecentlyEnrolled(student.createdAt, 5);
            
            // 🆕 Obtener día de estudio normalizado
            const dayOfStudy = normalizeDayName(student.diaEstudio);

            return (
              <AccordionItem
                key={student.id}
                value={student.id}
                className={`border rounded-lg shadow-sm ${
                  isInClosingArea 
                    ? 'bg-amber-50 border-2 border-amber-400 ring-2 ring-amber-200' 
                    : 'bg-white'
                }`}
              >
                <AccordionTrigger className={`px-4 ${isInClosingArea ? 'hover:bg-amber-100' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isInClosingArea ? 'bg-amber-200' : 'bg-blue-100'
                      }`}>
                        <span className={`font-semibold text-sm ${
                          isInClosingArea ? 'text-amber-700' : 'text-blue-600'
                        }`}>
                          {student.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          {isInClosingArea && (
                            <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600 animate-pulse text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Área de Cierre
                            </Badge>
                          )}
                          {isRecent && (
                            <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Reciente
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{student.carnet}</span>
                          <span>•</span>
                          <span>{student.program}</span>
                          {dayOfStudy && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-blue-600">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {dayOfStudy}
                              </span>
                            </>
                          )}
                        </div>
                        {careerProgress && careerProgress.total_cursos_carrera > 0 && (
                          <p className={`text-xs mt-0.5 ${isInClosingArea ? 'text-amber-700 font-medium' : 'text-green-600'}`}>
                            <GraduationCap className="h-3 w-3 inline mr-1" />
                            {careerProgress.cursos_aprobados}/{careerProgress.total_cursos_carrera} cursos aprobados ({careerProgress.porcentaje_avance}%)
                            {isInClosingArea && ` - Faltan ${careerProgress.cursos_faltantes}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedCount > 0 && (
                        <Badge className="bg-blue-600 text-white">
                          {selectedCount} seleccionados
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        {totalCompleted} completados
                      </Badge>
                      <Badge variant="outline" className="bg-gray-50">
                        {availableCourses.length} disponibles
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4 pt-2">
                  {loadingData ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-600">Cargando cursos...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Columna izquierda: Cursos completados */}
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <h5 className="font-semibold text-green-800 mb-3 flex items-center">
                          <Award className="h-4 w-4 mr-2" />
                          Cursos Completados ({totalCompleted})
                        </h5>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {/* Cursos del sistema */}
                          {completedCourses && completedCourses.length > 0 && completedCourses.map((course) => (
                            <div
                              key={course.id}
                              className="bg-white border border-green-300 rounded p-3 opacity-75"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900">
                                    {course.name}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">{course.code}</p>
                                  <Badge className="mt-1 text-xs bg-green-600 text-white">Sistema</Badge>
                                </div>
                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                              </div>
                            </div>
                          ))}
                          
                          {/* Cursos de Moodle */}
                          {moodleCompletedCourses && moodleCompletedCourses.length > 0 && moodleCompletedCourses.map((course) => (
                            <div
                              key={`moodle-${course.courseid}`}
                              className="bg-white border border-green-300 rounded p-3 opacity-75"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900">
                                    {course.coursename}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Código: {course.courseid}
                                    {course.finalgrade && ` • Nota: ${course.finalgrade}`}
                                  </p>
                                  <Badge className="mt-1 text-xs bg-purple-600 text-white">Moodle</Badge>
                                </div>
                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                              </div>
                            </div>
                          ))}

                          {totalCompleted === 0 && (
                            <div className="text-center py-8 text-sm text-green-700">
                              <Award className="h-12 w-12 text-green-300 mx-auto mb-2" />
                              <p>No hay cursos completados</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Columna derecha: Cursos disponibles */}
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <h5 className="font-semibold text-blue-800 mb-3 flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Cursos Disponibles - Mes Actual ({availableCourses.length})
                        </h5>
                        <div className="text-xs text-blue-700 mb-3 bg-blue-100 p-2 rounded border border-blue-200">
                          Cursos que inician en {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {availableCourses.length > 0 ? (
                            availableCourses.map((course) => {
                              const isSelected = selection?.selectedCourseIds.includes(
                                String(course.id)
                              );
                              return (
                                <div
                                  key={course.id}
                                  className={`border rounded p-3 cursor-pointer transition-all ${
                                    isSelected
                                      ? "bg-cyan-100 border-cyan-400 shadow-sm"
                                      : "bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                                  }`}
                                  onClick={() =>
                                    toggleCourseSelection(student.id, String(course.id))
                                  }
                                >
                                  <div className="flex items-start space-x-3">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        // Prevenir propagación para evitar doble toggle
                                        toggleCourseSelection(student.id, String(course.id));
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <p className="font-medium text-sm text-gray-900">
                                        {course.name}
                                      </p>
                                      <p className="text-xs text-gray-600 mt-1">
                                        {course.code}
                                      </p>
                                      {course.startDate && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Inicio: {new Date(course.startDate).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <CheckCircle2 className="h-5 w-5 text-cyan-600 flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-8 text-sm text-blue-700">
                              <Circle className="h-12 w-12 text-blue-300 mx-auto mb-2" />
                              <p>No hay cursos disponibles con los filtros actuales</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Botones de acción */}
        <div className="flex space-x-3 pt-4 border-t">
          <Button
            onClick={handleConfirmClick}
            disabled={totalSelectedCourses === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Confirmar Asignación ({totalSelectedCourses} cursos)
          </Button>
          <Button
            onClick={handleClearAll}
            disabled={totalSelectedCourses === 0}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <X className="h-5 w-5 mr-2" />
            Limpiar Todo
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </CardContent>

      {/* 🔹 Modal de Confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <AlertCircle className="h-6 w-6 mr-2 text-blue-600" />
              Confirmar Asignación Masiva
            </DialogTitle>
            <DialogDescription>
              Revisa los cursos que serán asignados a cada estudiante antes de confirmar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Resumen de Asignación</AlertTitle>
              <AlertDescription className="text-blue-800">
                Se asignarán <strong>{totalSelectedCourses}</strong> cursos en total a{" "}
                <strong>{selections.filter(s => s.selectedCourseIds.length > 0).length}</strong> estudiante(s)
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {selections
                .filter(s => s.selectedCourseIds.length > 0)
                .map((selection) => {
                  const student = selectedStudents.find(s => s.id === selection.studentId);
                  const assignedCourses = courses.filter(c => 
                    selection.selectedCourseIds.includes(String(c.id))
                  );

                  return (
                    <div key={selection.studentId} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{student?.name}</h4>
                          <p className="text-xs text-gray-600">
                            {student?.carnet} • {student?.program}
                          </p>
                        </div>
                        <Badge className="bg-blue-600 text-white ml-2 flex-shrink-0">
                          {selection.selectedCourseIds.length} curso(s)
                        </Badge>
                      </div>
                      
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {assignedCourses.map((course, idx) => (
                          <div key={course.id} className="flex items-start bg-white p-2 rounded border text-sm">
                            <span className="text-xs font-semibold text-gray-500 mr-2 mt-0.5 flex-shrink-0">
                              {idx + 1}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-xs leading-tight">{course.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{course.code}</p>
                            </div>
                            <Check className="h-3.5 w-3.5 text-green-600 ml-2 mt-0.5 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar Asignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔹 Modal de Éxito */}
      <Dialog open={showSuccessDialog} onOpenChange={(open) => {
        setShowSuccessDialog(open);
        if (!open) {
          onClose(); // Cerrar el panel principal cuando se cierra el modal de éxito
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-green-600">
              <CheckCircle2 className="h-6 w-6 mr-2" />
              ✅ Asignación Completada Exitosamente
            </DialogTitle>
            <DialogDescription>
              Los cursos han sido asignados correctamente a los estudiantes seleccionados.
            </DialogDescription>
          </DialogHeader>

          {assignmentResult && (
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">Asignación Exitosa</AlertTitle>
                <AlertDescription className="text-green-800">
                  Se asignaron <strong>{assignmentResult.totalCourses}</strong> cursos en total a{" "}
                  <strong>{assignmentResult.totalStudents}</strong> estudiante(s)
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 sticky top-0 bg-white py-2 z-10">
                  Detalle de Asignaciones:
                </h4>
                {assignmentResult.details.map((detail, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-semibold text-sm text-gray-900 truncate">{detail.studentName}</h5>
                          <p className="text-xs text-gray-600">
                            {detail.coursesCount} curso(s) asignado(s)
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs ml-2 flex-shrink-0">
                        Completado
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 pl-10 max-h-32 overflow-y-auto">
                      {detail.courseNames.map((courseName, courseIdx) => (
                        <div key={courseIdx} className="flex items-start text-xs">
                          <Check className="h-3 w-3 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 leading-tight">{courseName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={handleDownloadCSV}
              disabled={isDownloadingCSV}
              variant="outline"
              className="flex-1"
            >
              {isDownloadingCSV ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Descargando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar CSV
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                onClose();
              }}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
