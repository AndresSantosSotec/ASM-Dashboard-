"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { Student } from "@/services/students";
import type { Course } from "@/services/courses";
import { fetchCourses } from "@/services/courses";
import { fetchStudentCourseLists, bulkAssignCourses } from "@/services/students";
import { fetchStudentsByCourseDay, type MoodleStudentsByCourseResponse } from "@/services/moodleCourseQueries";
import { MoodleBasedAssignmentPanel } from "@/components/views/moodle-based-assignment-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  BookOpen,
  Users,
  CheckCircle2,
  Search,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Caché global para datos de estudiantes
const studentDataCache = new Map<string, {
  completedCourseIds: string[];
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const BATCH_SIZE = 10; // Procesar 10 estudiantes a la vez

interface CourseBasedAssignmentProps {
  students: Student[];
}

interface CourseSelection {
  courseId: string;
  selected: boolean;
}

interface StudentEligibility {
  studentId: string;
  eligibleCourseIds: string[];
  completedCourseIds: string[];
}

// Función auxiliar para comparar nombres (de bulk-assignment)
const normalizeName = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");

const areNamesSimilar = (a: string, b: string) => {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na.includes(nb) || nb.includes(na)) return true;
  const distance = levenshtein(na, nb);
  const ratio = distance / Math.max(na.length, nb.length);
  return ratio <= 0.3;
};

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

// Función para extraer día de la semana del nombre del curso
const extractDayFromCourseName = (courseName: string): string | null => {
  const days = ['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo'];
  const nameLower = courseName.toLowerCase();
  
  for (const day of days) {
    if (nameLower.includes(day)) {
      // Normalizar días con y sin acento
      if (day === 'miercoles') return 'miércoles';
      if (day === 'sabado') return 'sábado';
      return day;
    }
  }
  
  return null;
};

export function CourseBasedAssignment({ students }: CourseBasedAssignmentProps) {
  const { toast } = useToast();

  // Estados principales
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudentData, setLoadingStudentData] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [studentEligibility, setStudentEligibility] = useState<StudentEligibility[]>([]);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });

  // Estados para filtro por día de Moodle
  const [filterByDay, setFilterByDay] = useState(true);
  const [detectedDay, setDetectedDay] = useState<string | null>(null);
  const [moodleStudents, setMoodleStudents] = useState<MoodleStudentsByCourseResponse | null>(null);
  const [loadingMoodleStudents, setLoadingMoodleStudents] = useState(false);
  const [showMoodlePanel, setShowMoodlePanel] = useState(false);

  // Filtros
  const [searchName, setSearchName] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterProgram, setFilterProgram] = useState("todos");

  // Estados de confirmación
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
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

  // Ref para cancelar operaciones en curso
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cargar cursos del mes actual
  useEffect(() => {
    (async () => {
      setLoadingCourses(true);
      try {
        const allCourses = await fetchCourses();
        
        // Filtrar solo cursos del mes actual y excluir sincronizados
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const currentMonthCourses = allCourses.filter((course: Course) => {
          const courseStartDate = new Date(course.startDate);
          return courseStartDate >= monthStart && 
                 courseStartDate <= monthEnd && 
                 course.status !== 'synced';
        });

        setCourses(currentMonthCourses);
        console.log(`Cursos cargados del mes actual: ${currentMonthCourses.length}`);
      } catch (error) {
        console.error("Error cargando cursos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los cursos",
          variant: "destructive",
        });
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, []);

  // Detectar día y cargar estudiantes de Moodle cuando se seleccionan cursos
  useEffect(() => {
    if (selectedCourseIds.length === 0) {
      setDetectedDay(null);
      setMoodleStudents(null);
      setShowMoodlePanel(false);
      return;
    }

    // Detectar día del primer curso seleccionado
    const firstSelectedCourse = courses.find(c => String(c.id) === selectedCourseIds[0]);
    if (!firstSelectedCourse) return;

    const day = extractDayFromCourseName(firstSelectedCourse.name);
    setDetectedDay(day);

    // Cargar estudiantes de Moodle si el filtro está activo
    const loadMoodleStudents = async () => {
      setLoadingMoodleStudents(true);
      try {
        const result = await fetchStudentsByCourseDay(
          firstSelectedCourse.name,
          firstSelectedCourse.programIds?.[0],
          !filterByDay
        );
        setMoodleStudents(result);
        console.log(`Estudiantes de Moodle cargados: ${result.total_estudiantes}`);
      } catch (error) {
        console.error("Error cargando estudiantes de Moodle:", error);
        toast({
          title: "Advertencia",
          description: "No se pudieron cargar estudiantes de Moodle",
          variant: "default",
        });
      } finally {
        setLoadingMoodleStudents(false);
      }
    };

    loadMoodleStudents();
  }, [selectedCourseIds, courses, filterByDay, toast]);

  // Obtener programas únicos de los cursos
  const programOptions = useMemo(() => {
    const programs = new Set<string>();
    courses.forEach(course => {
      course.programas?.forEach(programa => {
        if (programa.nombre_del_programa) {
          programs.add(programa.nombre_del_programa);
        }
      });
    });
    return Array.from(programs).sort();
  }, [courses]);

  // Filtrar cursos según criterios (optimizado con useMemo)
  const filteredCourses = useMemo(() => {
    let result = courses;

    // Aplicar filtros solo si hay valores
    if (searchName) {
      const searchLower = searchName.toLowerCase();
      result = result.filter(course => course.name.toLowerCase().includes(searchLower));
    }

    if (searchCode) {
      const codeLower = searchCode.toLowerCase();
      result = result.filter(course => course.code.toLowerCase().includes(codeLower));
    }

    if (filterDate) {
      result = result.filter(course => course.startDate.includes(filterDate));
    }
    
    if (filterProgram !== "todos") {
      result = result.filter(course => 
        course.programas?.some(p => p.nombre_del_programa === filterProgram)
      );
    }

    return result;
  }, [courses, searchName, searchCode, filterDate, filterProgram]);

  // Toggle selección de curso
  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Limpiar caché manualmente si es necesario
  const clearCache = useCallback(() => {
    studentDataCache.clear();
    toast({
      title: "Caché limpiado",
      description: "Los datos se recargarán en la próxima selección",
    });
  }, [toast]);

  // Función optimizada para obtener datos de estudiante con caché
  const getStudentDataCached = useCallback(async (studentId: string) => {
    const now = Date.now();
    const cached = studentDataCache.get(studentId);
    
    // Usar caché si está disponible y no ha expirado
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.completedCourseIds;
    }

    try {
      const courseLists = await fetchStudentCourseLists(studentId);
      const completedCourses = Array.isArray(courseLists?.completed) ? courseLists.completed : [];
      const completedCourseIds = completedCourses.map((c: any) => String(c.id));
      
      // Guardar en caché
      studentDataCache.set(studentId, {
        completedCourseIds,
        timestamp: now,
      });
      
      return completedCourseIds;
    } catch (error) {
      console.error(`Error cargando datos del estudiante ${studentId}:`, error);
      return [];
    }
  }, []);

  // Filtrar estudiantes por programa antes de procesar
  const getEligibleStudentsByProgram = useCallback(() => {
    if (selectedCourseIds.length === 0) return students;

    // Obtener programas de los cursos seleccionados
    const selectedCourses = courses.filter(c => selectedCourseIds.includes(String(c.id)));
    const programsInCourses = new Set<number>();
    
    selectedCourses.forEach(course => {
      if (course.programIds && course.programIds.length > 0) {
        course.programIds.forEach(pid => programsInCourses.add(pid));
      }
    });

    // Si no hay programas específicos, incluir todos los estudiantes
    if (programsInCourses.size === 0) return students;

    // Filtrar estudiantes que pertenezcan a alguno de los programas
    return students.filter(student => {
      // Si el estudiante tiene programId, verificar que coincida
      if (student.programId && programsInCourses.has(student.programId)) {
        return true;
      }
      // Si tiene array de programs, verificar que alguno coincida
      if (student.programs && student.programs.length > 0) {
        return student.programs.some(p => programsInCourses.has(p.id));
      }
      // Si no tiene programa definido, incluirlo por seguridad
      return true;
    });
  }, [selectedCourseIds, courses, students]);

  // Procesar estudiantes en lotes para evitar sobrecarga
  const processStudentsInBatches = useCallback(async (studentsToProcess: Student[]) => {
    const eligibilityData: StudentEligibility[] = [];
    const total = studentsToProcess.length;
    
    setLoadingProgress({ current: 0, total });

    for (let i = 0; i < studentsToProcess.length; i += BATCH_SIZE) {
      // Verificar si la operación fue cancelada
      if (abortControllerRef.current?.signal.aborted) {
        break;
      }

      const batch = studentsToProcess.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (student) => {
          const completedCourseIds = await getStudentDataCached(student.id);

          // Determinar qué cursos seleccionados puede tomar este estudiante
          const eligibleCourseIds = selectedCourseIds.filter(courseId => {
            const course = courses.find(c => String(c.id) === courseId);
            if (!course) return false;

            // Excluir si ya completó el curso
            if (completedCourseIds.includes(courseId)) return false;

            return true;
          });

          return {
            studentId: student.id,
            eligibleCourseIds,
            completedCourseIds,
          };
        })
      );

      // Procesar resultados del lote
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          eligibilityData.push(result.value);
        } else {
          console.error('Error procesando estudiante:', result.reason);
        }
      });

      // Actualizar progreso
      setLoadingProgress({ current: Math.min(i + BATCH_SIZE, total), total });
    }

    return eligibilityData;
  }, [selectedCourseIds, courses, getStudentDataCached]);

  // Obtener estudiantes elegibles cuando se seleccionan cursos (con debounce)
  useEffect(() => {
    if (selectedCourseIds.length === 0) {
      setStudentEligibility([]);
      setLoadingProgress({ current: 0, total: 0 });
      return;
    }

    // Cancelar operación anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    const loadEligibility = async () => {
      setLoadingStudentData(true);
      
      try {
        // Primero filtrar por programa para reducir peticiones
        const eligibleByProgram = getEligibleStudentsByProgram();
        
        console.log(`Procesando ${eligibleByProgram.length} estudiantes de ${students.length} totales`);

        // Procesar en lotes
        const eligibilityData = await processStudentsInBatches(eligibleByProgram);
        
        if (!abortControllerRef.current?.signal.aborted) {
          setStudentEligibility(eligibilityData);
        }
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error("Error cargando elegibilidad de estudiantes:", error);
          toast({
            title: "Advertencia",
            description: "Algunos datos no se pudieron cargar completamente",
            variant: "default",
          });
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoadingStudentData(false);
          setLoadingProgress({ current: 0, total: 0 });
        }
      }
    };

    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      loadEligibility();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedCourseIds, students, courses, getEligibleStudentsByProgram, processStudentsInBatches, toast]);

  // Obtener estudiantes elegibles para mostrar
  const eligibleStudents = useMemo(() => {
    return students.filter(student => {
      const eligibility = studentEligibility.find(e => e.studentId === student.id);
      return eligibility && eligibility.eligibleCourseIds.length > 0;
    });
  }, [students, studentEligibility]);

  // Manejar confirmación de asignación
  const handleConfirmClick = () => {
    if (selectedCourseIds.length === 0 || eligibleStudents.length === 0) {
      toast({
        title: "Sin selección",
        description: "Debes seleccionar cursos y tener estudiantes elegibles",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    try {
      // Preparar asignaciones: cada estudiante elegible recibe TODOS los cursos seleccionados que puede tomar
      const assignments = eligibleStudents.map(student => {
        const eligibility = studentEligibility.find(e => e.studentId === student.id);
        return {
          studentId: student.id,
          courseIds: eligibility?.eligibleCourseIds || [],
        };
      }).filter(assignment => assignment.courseIds.length > 0);

      if (assignments.length === 0) {
        toast({
          title: "Sin asignaciones",
          description: "No hay estudiantes elegibles para los cursos seleccionados",
          variant: "destructive",
        });
        return;
      }

      await bulkAssignCourses(assignments);

      // Preparar resultado para modal de éxito
      const totalStudents = assignments.length;
      const totalCourses = assignments.reduce((sum, a) => sum + a.courseIds.length, 0);
      
      const details = assignments.map(assignment => {
        const student = students.find(s => s.id === assignment.studentId);
        const assignedCourses = courses.filter(c => assignment.courseIds.includes(String(c.id)));
        
        return {
          studentName: student?.name || 'Desconocido',
          studentCarnet: student?.carnet || '',
          coursesCount: assignment.courseIds.length,
          courseNames: assignedCourses.map(c => c.name),
        };
      });

      setAssignmentResult({ totalStudents, totalCourses, details });
      setShowConfirmDialog(false);
      setShowSuccessDialog(true);
      setSelectedCourseIds([]); // Limpiar selección

    } catch (error) {
      console.error("Error en asignación:", error);
      toast({
        title: "❌ Error",
        description: "Hubo un problema al asignar los cursos",
        variant: "destructive",
      });
    }
  };

  if (loadingCourses) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando cursos del mes actual...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con resumen */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <span>Asignación por Cursos</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
              </Badge>
              {selectedCourseIds.length > 0 && (
                <Badge className="bg-green-600 text-white animate-pulse">
                  {selectedCourseIds.length} cursos seleccionados
                </Badge>
              )}
            </div>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Selecciona cursos del mes actual para encontrar estudiantes que puedan tomarlos
            {selectedCourseIds.length > 0 && (
              <span className="ml-2 text-green-600 font-semibold">
                {eligibleStudents.length} estudiante(s) elegibles encontrados
              </span>
            )}
          </p>
          
          {/* Toggle de filtro por día y botón de estudiantes Moodle */}
          {selectedCourseIds.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="filterByDay" 
                  checked={filterByDay} 
                  onCheckedChange={(checked) => setFilterByDay(checked as boolean)}
                />
                <label 
                  htmlFor="filterByDay" 
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  Filtrar estudiantes por día del curso
                  {detectedDay && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                      {detectedDay.charAt(0).toUpperCase() + detectedDay.slice(1)}
                    </Badge>
                  )}
                  {!detectedDay && filterByDay && (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                      No se detectó día
                    </Badge>
                  )}
                </label>
              </div>

              <Button
                onClick={() => setShowMoodlePanel(!showMoodlePanel)}
                variant={showMoodlePanel ? "default" : "outline"}
                className="ml-auto"
                disabled={loadingMoodleStudents}
              >
                {loadingMoodleStudents ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    {showMoodlePanel ? 'Ocultar' : 'Mostrar'} Estudiantes de Moodle
                    {moodleStudents && (
                      <Badge className="ml-2 bg-white text-blue-600">
                        {moodleStudents.total_estudiantes}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="h-5 w-5 mr-2" />
            Filtros de Cursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por código..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los programas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los programas</SelectItem>
                {programOptions.map(program => (
                  <SelectItem key={program} value={program}>
                    {program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Panel de estudiantes de Moodle */}
      {(() => {
        console.log('[DEBUG CourseBasedAssignment] Estado del panel Moodle:', {
          showMoodlePanel,
          hasMoodleStudents: !!moodleStudents,
          moodleStudentsCount: moodleStudents?.data?.length || 0,
          coursesCount: courses.length,
          selectedCourseIds: selectedCourseIds,
          detectedDay
        });
        return null;
      })()}
      {showMoodlePanel && moodleStudents && moodleStudents.data.length > 0 && (
        <MoodleBasedAssignmentPanel
          moodleStudents={moodleStudents.data}
          courses={courses}
          selectedCourseIds={selectedCourseIds}
          detectedDay={detectedDay}
          onClose={() => setShowMoodlePanel(false)}
        />
      )}

      {/* Lista de cursos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cursos disponibles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                Cursos Disponibles ({filteredCourses.length})
              </span>
              {selectedCourseIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCourseIds([])}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCourses.map(course => {
                const isSelected = selectedCourseIds.includes(String(course.id));
                return (
                  <div
                    key={course.id}
                    className={`border rounded p-3 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-100 border-blue-400 shadow-sm"
                        : "bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                    }`}
                    onClick={() => toggleCourseSelection(String(course.id))}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleCourseSelection(String(course.id))}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{course.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{course.code}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Inicio: {new Date(course.startDate).toLocaleDateString()}
                        </p>
                        {course.programas && course.programas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {course.programas.slice(0, 2).map((programa, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {programa.nombre_del_programa}
                              </Badge>
                            ))}
                            {course.programas.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{course.programas.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredCourses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>No hay cursos que coincidan con los filtros</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estudiantes elegibles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                Estudiantes Elegibles ({eligibleStudents.length})
              </span>
              {loadingStudentData && (
                <div className="flex items-center text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {loadingProgress.total > 0 ? (
                    <span>
                      Procesando {loadingProgress.current}/{loadingProgress.total}...
                    </span>
                  ) : (
                    <span>Analizando compatibilidad...</span>
                  )}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCourseIds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p>Selecciona cursos para ver estudiantes elegibles</p>
              </div>
            ) : loadingStudentData && loadingProgress.total > 0 ? (
              <div className="py-8">
                <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
                  <span>Cargando estudiantes...</span>
                  <span>{Math.round((loadingProgress.current / loadingProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Procesando {loadingProgress.current} de {loadingProgress.total} estudiantes
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {eligibleStudents.map(student => {
                  const eligibility = studentEligibility.find(e => e.studentId === student.id);
                  const eligibleCount = eligibility?.eligibleCourseIds.length || 0;
                  
                  return (
                    <div key={student.id} className="border rounded p-3 bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {student.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {student.carnet} | {student.program}
                          </p>
                        </div>
                        <Badge className="bg-green-600 text-white ml-2 flex-shrink-0">
                          {eligibleCount} curso(s)
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {eligibleStudents.length === 0 && !loadingStudentData && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p>No hay estudiantes elegibles para los cursos seleccionados</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Botón de asignación */}
      {selectedCourseIds.length > 0 && eligibleStudents.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-900">
                  Listo para asignar {selectedCourseIds.length} curso(s) a {eligibleStudents.length} estudiante(s)
                </p>
                <p className="text-sm text-green-700">
                  Cada estudiante recibirá solo los cursos que puede tomar
                </p>
              </div>
              <Button
                onClick={handleConfirmClick}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Confirmar Asignación
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <AlertCircle className="h-6 w-6 mr-2 text-green-600" />
              Confirmar Asignación por Cursos
            </DialogTitle>
            <DialogDescription>
              Revisa qué estudiantes recibirán qué cursos antes de confirmar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Resumen de Asignación</AlertTitle>
              <AlertDescription className="text-green-800">
                Se asignarán cursos a <strong>{eligibleStudents.length}</strong> estudiante(s)
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {eligibleStudents.map(student => {
                const eligibility = studentEligibility.find(e => e.studentId === student.id);
                const eligibleCourses = courses.filter(c => 
                  eligibility?.eligibleCourseIds.includes(String(c.id))
                );

                return (
                  <div key={student.id} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{student.name}</h4>
                        <p className="text-xs text-gray-600">
                          {student.carnet} | {student.program}
                        </p>
                      </div>
                      <Badge className="bg-green-600 text-white ml-2 flex-shrink-0">
                        {eligibleCourses.length} curso(s)
                      </Badge>
                    </div>
                    
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {eligibleCourses.map((course, idx) => (
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
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar Asignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de éxito */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-green-600">
              <CheckCircle2 className="h-6 w-6 mr-2" />
              Asignación Completada Exitosamente
            </DialogTitle>
            <DialogDescription>
              Los cursos han sido asignados correctamente a los estudiantes elegibles.
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

          <DialogFooter>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}