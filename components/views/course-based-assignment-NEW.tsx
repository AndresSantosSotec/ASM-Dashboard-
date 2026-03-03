"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from "@/components/ui/select";
import {Accordion,AccordionContent,AccordionItem,AccordionTrigger,} from "@/components/ui/accordion";
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle,} from "@/components/ui/dialog";
import {Alert,AlertDescription,AlertTitle,} from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {Loader2,Search,Filter,CheckCircle2,X,Users,BookOpen,UserCheck,AlertCircle,Calendar,Award,ChevronLeft,ChevronRight,AlertTriangle,GraduationCap,} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { fetchMoodleCursosHistoricos, fetchMoodleEstudiantesMultiplesCursos, type MoodleCursoHistorico,} from "@/services/moodleHistoricoCursos";
import {
  fetchInternalStudentEquivalents,
  type InternalStudentEquivalent,
} from "@/services/moodleCourseQueries";
import { fetchCourses, type Course, exportarYDescargarCursosMasivo } from "@/services/courses";
import { bulkAssignCourses, fetchStudentCourseLists } from "@/services/students";
import fetchApprovedMoodleCourses, { MoodleQueryCourse } from "@/services/moodleCourseQueries";

// 🎯 Configuración de paginación
const ITEMS_PER_PAGE = 20;

// Interfaz para el progreso de carrera desde Moodle
interface CareerProgress {
  cursos_aprobados: number;
  total_cursos_carrera: number;
  cursos_faltantes: number;
  en_area_cierre: boolean;
  porcentaje_avance: number;
  programa?: string;
}

interface CourseBasedAssignmentProps {
  students: any[]; // No se usa en la nueva lógica
}

interface StudentWithInternalData {
  moodleUserId: number;
  carnet: string; // Carnet original de Moodle (minúsculas)
  nombreCompleto: string;
  email: string;
  cursosLlevados: string;
  totalCursosLlevados: number;
  internalStudent: InternalStudentEquivalent | null;
  selectedCourseIds: string[]; // IDs de cursos del mes actual a asignar
  completedCourseIds: string[]; // IDs de cursos completados del sistema
  assignedCourseIds: string[]; // IDs de cursos ya asignados actualmente
  moodleCompletedCourses: MoodleQueryCourse[]; // Cursos aprobados en Moodle
  // 🚀 OPTIMIZACIÓN: Lazy loading de datos pesados
  coursesLoaded?: boolean; // Flag para saber si ya se cargaron los cursos
}

// Función auxiliar para comparar nombres (igual que en bulk-assignment-improved-panel)
// 🧹 Limpiar nombre de curso eliminando prefijos (replica lógica del backend)
const cleanCourseName = (name: string): string => {
  // Regex que coincide con el backend PHP:
  // - Mes opcional: Enero, Febrero, Marzo, etc.
  // - Día opcional: Lunes, Martes, Miércoles, etc.
  // - Año opcional: 2024, 2025, 2026
  // - Programa opcional: BBA, MBA, DBA, etc. (2-5 letras mayúsculas)
  const month = '(?:Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)';
  const day = '(?:Lunes|Martes|Mi(?:é|e)rcoles|Jueves|Viernes|S(?:á|a)bado|Domingo)';
  const year = '\\d{4}';
  const program = '[A-Z]{2,5}';
  
  // Patrón completo: ^(Mes )?(Día )?(Año )?(PROGRAMA )?
  const regex = new RegExp(
    `^(?:${month}\\s+)?(?:${day}\\s+)?(?:${year}\\s+)?(?:${program}\\s+)?`,
    'i'
  );
  
  const cleaned = name.replace(regex, '').trim();
  
  // Log para debugging
  if (cleaned !== name) {
    console.log(`🧹 Limpieza: "${name}" → "${cleaned}"`);
  }
  
  return cleaned;
};

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

// ✅ Comparar nombres de cursos limpiando prefijos PRIMERO
const areNamesSimilar = (a: string, b: string) => {
  // 1️⃣ Limpiar ambos nombres primero
  const cleanA = cleanCourseName(a);
  const cleanB = cleanCourseName(b);
  
  // 2️⃣ Normalizar (minúsculas, sin acentos, solo alfanuméricos)
  const na = normalizeName(cleanA);
  const nb = normalizeName(cleanB);
  
  // 3️⃣ Comparación exacta (después de normalizar)
  if (na === nb) {
    console.log(`✅ MATCH EXACTO: "${a}" ≈ "${b}" (limpio: "${cleanA}" = "${cleanB}")`);
    return true;
  }
  
  // 4️⃣ Coincidencia parcial (uno contiene al otro)
  if (na.includes(nb) || nb.includes(na)) {
    console.log(`✅ MATCH PARCIAL: "${a}" ≈ "${b}" (limpio: "${cleanA}" ~ "${cleanB}")`);
    return true;
  }
  
  // 5️⃣ Levenshtein distance (similitud >= 70%)
  const distance = levenshtein(na, nb);
  const ratio = distance / Math.max(na.length, nb.length);
  
  if (ratio <= 0.3) {
    console.log(`✅ MATCH LEVENSHTEIN: "${a}" ≈ "${b}" (similitud: ${Math.round((1 - ratio) * 100)}%)`);
    return true;
  }
  
  return false;
};

// 🆕 Verificar si un estudiante fue inscrito en los últimos N días
const isNuevo = (date: string | null | undefined, days: number = 15): boolean => {
  if (!date) return false;
  const enrolled = new Date(date);
  if (isNaN(enrolled.getTime())) return false;
  const diffDays = (Date.now() - enrolled.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
};

// 🚀 Componente memoizado para cada estudiante (evita re-renders)
const StudentAccordionItem = memo(({ 
  student, 
  currentMonthCourses,
  onLoadCourses,
  onToggleCourseSelection,
  careerProgress,
}: {
  student: StudentWithInternalData;
  currentMonthCourses: Course[];
  onLoadCourses: (carnet: string) => void;
  onToggleCourseSelection: (carnet: string, courseId: string) => void;
  careerProgress?: CareerProgress;
}) => {
  const hasInternal = !!student.internalStudent;
  const selectedCount = student.selectedCourseIds.length;
  const totalCursosLlevados = student.totalCursosLlevados || 0;
  const isInClosingArea = careerProgress?.en_area_cierre === true;

  // Calcular cursos completados
  const systemCompleted = currentMonthCourses.filter((course) =>
    student.completedCourseIds.includes(String(course.id))
  );
  const moodleCompleted = student.moodleCompletedCourses || [];
  const totalCompleted = systemCompleted.length + moodleCompleted.length;

  // Cursos disponibles filtrados por programa
  const availableCourses = useMemo(() => {
    if (!student.internalStudent) return [];
    
    const filtered = currentMonthCourses.filter((course) => {
      // 🚫 Excluir cursos ya completados del sistema (por ID exacto)
      if (student.completedCourseIds.includes(String(course.id))) {
        console.log(`🚫 [${student.carnet}] EXCLUIDO por ID del sistema: ${course.name} (ID: ${course.id})`);
        return false;
      }
      
      // 🚫 Excluir cursos ya aprobados en Moodle (por nombre similar)
      // Esto detecta si el estudiante ya llevó este curso en meses anteriores
      const alreadyApprovedInMoodle = student.moodleCompletedCourses?.some(
        (moodleCourse) => {
          const similar = areNamesSimilar(moodleCourse.coursename, course.name);
          if (similar) {
            console.log(`🚫 [${student.carnet}] EXCLUIDO por Moodle (similar): "${course.name}" ≈ "${moodleCourse.coursename}"`);
          }
          return similar;
        }
      );
      if (alreadyApprovedInMoodle) {
        return false;
      }
      
      // 🚫 Excluir cursos ya asignados actualmente
      if (student.assignedCourseIds.includes(String(course.id))) {
        console.log(`🚫 [${student.carnet}] EXCLUIDO por asignación actual: ${course.name} (ID: ${course.id})`);
        return false;
      }
      
      // Si el estudiante no tiene programa interno, mostrar todos los cursos
      if (!student.internalStudent?.programas || student.internalStudent.programas.length === 0) {
        return true;
      }
      // Si el curso no tiene programas asignados, mostrar a todos
      if (!course.programas || course.programas.length === 0) {
        return true;
      }
      // Verificar coincidencia de programas
      const studentProgramIds = student.internalStudent.programas.map(p => p.id);
      const matchesProgram = course.programas.some(p => studentProgramIds.includes(p.id));
      if (!matchesProgram) {
        console.log(`🚫 [${student.carnet}] EXCLUIDO por programa: ${course.name}`);
      }
      return matchesProgram;
    });
    
    if (filtered.length > 0 && student.coursesLoaded) {
      console.log(`✅ [${student.carnet}] Cursos disponibles: ${filtered.length}/${currentMonthCourses.length}`);
    }
    
    return filtered;
  }, [student, currentMonthCourses]);

  return (
    <AccordionItem
      key={student.carnet}
      value={student.carnet}
      className={`border rounded-lg ${
        isInClosingArea 
          ? "border-2 border-amber-400 bg-amber-50 ring-2 ring-amber-200" 
          : hasInternal 
            ? "border-green-300 bg-green-50" 
            : "border-orange-200 bg-orange-50"
      }`}
    >
      <AccordionTrigger 
        className={`px-3 py-2 hover:no-underline ${isInClosingArea ? 'hover:bg-amber-100' : ''}`}
        onClick={() => {
          if (hasInternal && !student.coursesLoaded) {
            onLoadCourses(student.carnet);
          }
        }}
      >
        <div className="flex items-center justify-between w-full pr-3">
          <div className="flex items-center space-x-2">
            {isInClosingArea ? (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            ) : hasInternal ? (
              <UserCheck className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-600" />
            )}
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{student.nombreCompleto}</p>
                {isNuevo(student.internalStudent?.created_at) && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                    Nuevo
                  </Badge>
                )}
                {isInClosingArea && (
                  <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600 animate-pulse text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Área de Cierre
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600">
                {student.carnet} • {totalCompleted} completado(s) • {totalCursosLlevados} histórico(s)
              </p>
              {careerProgress && careerProgress.total_cursos_carrera > 0 && (
                <p className={`text-xs ${isInClosingArea ? 'text-amber-700 font-medium' : 'text-green-600'}`}>
                  <GraduationCap className="h-3 w-3 inline mr-1" />
                  {careerProgress.cursos_aprobados}/{careerProgress.total_cursos_carrera} ({careerProgress.porcentaje_avance}%)
                  {isInClosingArea && ` - Faltan ${careerProgress.cursos_faltantes}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!hasInternal && (
              <Badge variant="outline" className="text-xs bg-orange-100">
                No en sistema
              </Badge>
            )}
            {totalCompleted > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                {totalCompleted} aprobados
              </Badge>
            )}
            {selectedCount > 0 && (
              <Badge className="bg-blue-600 text-white text-xs">
                {selectedCount}
              </Badge>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3">
        {!hasInternal ? (
          <Alert className="bg-orange-100 border-orange-300">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-xs">
              No encontrado en sistema interno
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {/* Info del estudiante */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2 rounded border">
              <div><span className="text-gray-500">ID:</span> {student.internalStudent!.id}</div>
              <div><span className="text-gray-500">Carnet:</span> {student.internalStudent!.carnet}</div>
              <div className="col-span-2"><span className="text-gray-500">Email:</span> {student.internalStudent!.correo}</div>
              <div className="col-span-2">
                <span className="text-gray-500">Programa(s):</span>{" "}
                {student.internalStudent!.programas.map(p => p.nombre).join(", ") || "N/A"}
              </div>
            </div>

            {/* Mostrar loading si aún no se han cargado los cursos */}
            {!student.coursesLoaded ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">Cargando cursos...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Cursos completados */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-3 shadow-sm">
                  <h5 className="font-semibold text-xs text-green-800 mb-2 flex items-center">
                    <Award className="h-3 w-3 mr-1" />
                    Cursos Completados ({totalCompleted})
                  </h5>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {systemCompleted.map((course) => (
                      <div key={`sys-${course.id}`} className="bg-white rounded border border-green-200 p-2 text-xs hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-green-900">{course.name}</p>
                            <p className="text-green-700 mt-0.5">{course.code}</p>
                            <Badge className="mt-1 text-xs bg-green-600 text-white">Sistema</Badge>
                          </div>
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                        </div>
                      </div>
                    ))}
                    {moodleCompleted.map((course) => (
                      <div key={`moo-${course.courseid}`} className="bg-white rounded border border-green-200 p-2 text-xs hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-green-900">{course.coursename}</p>
                            <p className="text-green-700 mt-0.5">
                              Código: {course.courseid}
                              {course.finalgrade && ` • Nota: ${course.finalgrade}`}
                            </p>
                            <Badge className="mt-1 text-xs bg-purple-600 text-white">Moodle</Badge>
                          </div>
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                        </div>
                      </div>
                    ))}
                    {totalCompleted === 0 && (
                      <div className="text-center py-6">
                        <Award className="h-8 w-8 text-green-300 mx-auto mb-2" />
                        <p className="text-xs text-green-700 italic">Sin cursos completados</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 🚫 Cursos ya asignados actualmente */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-lg p-3 shadow-sm">
                  <h5 className="font-semibold text-xs text-yellow-800 mb-2 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Ya Asignados ({student.assignedCourseIds.length})
                  </h5>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {currentMonthCourses
                      .filter(course => student.assignedCourseIds.includes(String(course.id)))
                      .map((course) => (
                        <div key={`assigned-${course.id}`} className="bg-white rounded border border-yellow-200 p-2 text-xs hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-yellow-900">{course.name}</p>
                              <p className="text-yellow-700 mt-0.5">{course.code}</p>
                              <Badge className="mt-1 text-xs bg-yellow-600 text-white">En curso</Badge>
                            </div>
                            <X className="h-4 w-4 text-yellow-600 flex-shrink-0 ml-2" />
                          </div>
                        </div>
                      ))}
                    {student.assignedCourseIds.length === 0 && (
                      <div className="text-center py-6">
                        <Calendar className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
                        <p className="text-xs text-yellow-700 italic">Sin cursos asignados</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cursos disponibles */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-3 shadow-sm">
                  <h5 className="font-semibold text-xs text-blue-800 mb-2 flex items-center justify-between">
                    <span className="flex items-center">
                      <BookOpen className="h-3 w-3 mr-1" />
                      Cursos Disponibles - Mes Actual
                    </span>
                    <Badge variant="outline" className="text-xs bg-blue-100">
                      {selectedCount}/{availableCourses.length}
                    </Badge>
                  </h5>
                  <div className="text-xs text-blue-700 mb-2 bg-blue-100/70 p-1.5 rounded border border-blue-200">
                    📅 Solo cursos del programa del estudiante (excluye completados y asignados)
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {availableCourses.length === 0 ? (
                      <div className="text-center py-6">
                        <Calendar className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                        <Alert className="py-2 bg-blue-50 border-blue-200">
                          <AlertDescription className="text-xs text-blue-700">
                            No hay cursos disponibles este mes
                          </AlertDescription>
                        </Alert>
                      </div>
                    ) : (
                      availableCourses.map((course) => {
                        const isSelected = student.selectedCourseIds.includes(String(course.id));
                        return (
                          <div
                            key={course.id}
                            className={`rounded border cursor-pointer transition-all p-2 hover:shadow-sm ${
                              isSelected
                                ? "border-blue-400 bg-blue-100 shadow-sm"
                                : "border-blue-200 bg-white hover:bg-blue-50"
                            }`}
                            onClick={() => onToggleCourseSelection(student.carnet, String(course.id))}
                          >
                            <div className="flex items-start space-x-2">
                              <Checkbox checked={isSelected} className="mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium line-clamp-2 text-blue-900">{course.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs h-4 px-1">{course.code}</Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(course.startDate).toLocaleDateString('es-ES', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
});

StudentAccordionItem.displayName = "StudentAccordionItem";

export function CourseBasedAssignment({ students }: CourseBasedAssignmentProps) {
  const { toast } = useToast();

  // Estados principales
  const [moodleCursos, setMoodleCursos] = useState<MoodleCursoHistorico[]>([]);
  const [loadingMoodleCursos, setLoadingMoodleCursos] = useState(true);
  const [selectedMoodleCourseIds, setSelectedMoodleCourseIds] = useState<number[]>([]);
  
  const [studentsData, setStudentsData] = useState<StudentWithInternalData[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  const [currentMonthCourses, setCurrentMonthCourses] = useState<Course[]>([]);
  const [loadingCurrentCourses, setLoadingCurrentCourses] = useState(false);

  // Filtros
  const [mesesHistorico, setMesesHistorico] = useState(6);
  const [searchMoodleCourse, setSearchMoodleCourse] = useState("");
  const [searchStudent, setSearchStudent] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("todos");
  const [showOnlyWithInternal, setShowOnlyWithInternal] = useState(false);
  const [showOnlyWithSelections, setShowOnlyWithSelections] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCoursesList, setShowCoursesList] = useState(true);

  // 📄 Paginación
  const [currentPage, setCurrentPage] = useState(1);

  // Estados de confirmación
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
      courseNames: string[];
    }>;
  } | null>(null);

  // 🆕 Estados para Asignación Masiva
  const [showMassiveAssignmentModal, setShowMassiveAssignmentModal] = useState(false);
  const [massiveSelectedCourseIds, setMassiveSelectedCourseIds] = useState<string[]>([]);

  // Estado para progreso de carrera (área de cierre)
  const [careerProgressMap, setCareerProgressMap] = useState<Record<string, CareerProgress>>({});

  // 1️⃣ Cargar cursos históricos de Moodle
  useEffect(() => {
    const loadMoodleCursos = async () => {
      setLoadingMoodleCursos(true);
      try {
        const response = await fetchMoodleCursosHistoricos(mesesHistorico);
        setMoodleCursos(response.cursos);
        console.log(`✅ ${response.total_cursos} cursos de Moodle cargados (${mesesHistorico} meses)`);
      } catch (error) {
        console.error("Error cargando cursos de Moodle:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los cursos de Moodle",
          variant: "destructive",
        });
      } finally {
        setLoadingMoodleCursos(false);
      }
    };

    loadMoodleCursos();
  }, [mesesHistorico, toast]);

  // 2️⃣ Cuando se seleccionan cursos de Moodle → Cargar estudiantes (SIN cursos completados aún)
  useEffect(() => {
    if (selectedMoodleCourseIds.length === 0) {
      setStudentsData([]);
      setCurrentPage(1);
      return;
    }

    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        // Obtener estudiantes de Moodle que llevaron esos cursos
        const moodleResponse = await fetchMoodleEstudiantesMultiplesCursos(selectedMoodleCourseIds);
        
        console.log(`✅ ${moodleResponse.total_estudiantes_unicos} estudiantes únicos de Moodle`);

        // Buscar equivalentes internos
        const carnets = moodleResponse.carnets; // Ya vienen en mayúsculas
        const internalResponse = await fetchInternalStudentEquivalents(carnets);

        console.log(`✅ ${internalResponse.total_encontrados} estudiantes encontrados en sistema interno`);

        // Mapear estudiantes con equivalentes internos
        const internalMap = new Map<string, InternalStudentEquivalent>();
        internalResponse.estudiantes.forEach((est) => {
          internalMap.set(est.carnet.toUpperCase(), est);
        });

        // 🚀 OPTIMIZACIÓN: NO cargar cursos completados aquí - se cargarán bajo demanda
        const mappedStudents: StudentWithInternalData[] = moodleResponse.estudiantes.map((moodleStudent) => {
          const carnetUpper = moodleStudent.carnet.toUpperCase();
          const internal = internalMap.get(carnetUpper) || null;

          return {
            moodleUserId: moodleStudent.user_id,
            carnet: moodleStudent.carnet,
            nombreCompleto: moodleStudent.nombre_completo,
            email: moodleStudent.email,
            cursosLlevados: moodleStudent.cursos_llevados,
            totalCursosLlevados: moodleStudent.total_cursos_llevados,
            internalStudent: internal,
            selectedCourseIds: [],
            completedCourseIds: [],
            assignedCourseIds: [], // 🚫 Cursos ya asignados
            moodleCompletedCourses: [],
            coursesLoaded: false, // 🚀 Aún no se han cargado
          };
        });

        setStudentsData(mappedStudents);
        setCurrentPage(1); // Reset a página 1

        // Cargar progreso de carrera para todos los estudiantes
        try {
          // Enviar carnets en mayúsculas para mejor compatibilidad con el sistema interno
          const carnets = mappedStudents.map(s => s.carnet.toUpperCase());
          const careerResponse = await fetch(
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
          
          if (careerResponse.ok) {
            const careerData = await careerResponse.json();
            if (careerData.success && careerData.data) {
              const progressMap: Record<string, CareerProgress> = {};
              // Si es objeto, usarlo directamente; si es array, convertir
              if (Array.isArray(careerData.data)) {
                careerData.data.forEach((item: any) => {
                  // Guardar tanto en mayúsculas como en minúsculas para fácil acceso
                  progressMap[item.carnet] = item;
                  progressMap[item.carnet.toLowerCase()] = item;
                  progressMap[item.carnet.toUpperCase()] = item;
                });
              } else {
                // Es un objeto, normalizar keys
                Object.entries(careerData.data).forEach(([key, value]: [string, any]) => {
                  progressMap[key] = value;
                  progressMap[key.toLowerCase()] = value;
                  progressMap[key.toUpperCase()] = value;
                });
              }
              setCareerProgressMap(progressMap);
            }
          }
        } catch (careerError) {
          console.warn('[CourseBasedAssignment-NEW] Could not fetch career progress:', careerError);
        }

        toast({
          title: "✅ Estudiantes cargados",
          description: `${moodleResponse.total_estudiantes_unicos} estudiantes, ${internalResponse.total_encontrados} en sistema interno`,
        });

      } catch (error) {
        console.error("❌ Error cargando estudiantes:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudieron cargar los estudiantes",
          variant: "destructive",
        });
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, [selectedMoodleCourseIds, toast]);

  // 3️⃣ Cargar cursos del mes actual para asignar
  useEffect(() => {
    const loadCurrentCourses = async () => {
      setLoadingCurrentCourses(true);
      try {
        const allCourses = await fetchCourses();
        
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const añoActual = String(now.getFullYear());

        // Meses en español para detectar por nombre del curso
        const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                          'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const mesActual = MESES_ES[now.getMonth()];

        // Un curso pertenece al mes actual si:
        //  A) su startDate cae dentro del mes, O
        //  B) su nombre contiene el mes actual (en español) y el año actual (prefijo de nombre)
        const courseMatchesCurrentMonth = (course: Course): boolean => {
          if (course.status === "synced") return false;

          // A) Por startDate
          const courseStartDate = new Date(course.startDate);
          if (!isNaN(courseStartDate.getTime()) &&
              courseStartDate >= monthStart &&
              courseStartDate <= monthEnd) {
            return true;
          }

          // B) Por nombre: buscar "Mes Año" o "Año Mes" en el nombre del curso
          const nameUpper = course.name.toUpperCase();
          const mesUpper = mesActual.toUpperCase();
          if (nameUpper.includes(mesUpper) && nameUpper.includes(añoActual)) {
            console.log(`📅 [Nombre] Curso "${course.name}" detectado como del mes actual por nombre`);
            return true;
          }

          return false;
        };

        const currentMonth = allCourses.filter(courseMatchesCurrentMonth);

        setCurrentMonthCourses(currentMonth);
        console.log(`✅ ${currentMonth.length} cursos del mes actual disponibles (${mesActual} ${añoActual})`);
      } catch (error) {
        console.error("Error cargando cursos actuales:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los cursos del mes actual",
          variant: "destructive",
        });
      } finally {
        setLoadingCurrentCourses(false);
      }
    };

    loadCurrentCourses();
  }, [toast]);

  // Filtrar cursos de Moodle
  const filteredMoodleCursos = useMemo(() => {
    let result = moodleCursos;

    if (searchMoodleCourse) {
      const searchLower = searchMoodleCourse.toLowerCase();
      result = result.filter(
        (c) =>
          c.course_name.toLowerCase().includes(searchLower) ||
          c.course_code.toLowerCase().includes(searchLower)
      );
    }

    if (filterMonth !== "todos") {
      result = result.filter((c) => c.start_date.startsWith(filterMonth));
    }

    return result;
  }, [moodleCursos, searchMoodleCourse, filterMonth]);

  // Obtener meses únicos de los cursos
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    moodleCursos.forEach((c) => {
      const month = c.start_date.substring(0, 7); // YYYY-MM
      months.add(month);
    });
    return Array.from(months).sort().reverse();
  }, [moodleCursos]);

  // Filtrar estudiantes (con memoización)
  const filteredStudents = useMemo(() => {
    let result = studentsData;
    
    if (searchStudent) {
      const searchLower = searchStudent.toLowerCase();
      result = result.filter(
        (s) =>
          s.nombreCompleto.toLowerCase().includes(searchLower) ||
          s.carnet.toLowerCase().includes(searchLower) ||
          s.email.toLowerCase().includes(searchLower)
      );
    }
    
    if (showOnlyWithInternal) {
      result = result.filter((s) => s.internalStudent !== null);
    }
    
    if (showOnlyWithSelections) {
      result = result.filter((s) => s.selectedCourseIds.length > 0);
    }
    
    return result;
  }, [studentsData, searchStudent, showOnlyWithInternal, showOnlyWithSelections]);

  // � Calcular resumen de especialidades y cursos disponibles
  const programSummary = useMemo(() => {
    const summary = new Map<string, { count: number; totalCourses: number }>();
    
    studentsData.forEach(student => {
      if (!student.internalStudent) return;
      
      // Obtener especialidades del estudiante
      const especialidades = student.internalStudent.programas
        .map(p => {
          // Extraer abreviatura del nombre o usar primeras letras
          const nombre = p.nombre || '';
          // Buscar patrones comunes: BBA, MBA, DBA, etc.
          const match = nombre.match(/\b([A-Z]{2,5})\b/);
          return match ? match[1] : nombre.substring(0, 4).toUpperCase();
        })
        .filter(Boolean);
      
      // Calcular cursos disponibles para este estudiante
      const availableCoursesCount = currentMonthCourses.filter((course) => {
        // Excluir completados del sistema
        if (student.completedCourseIds.includes(String(course.id))) return false;
        
        // Excluir cursos ya aprobados en Moodle (por nombre similar)
        const alreadyApprovedInMoodle = student.moodleCompletedCourses?.some(
          (moodleCourse) => areNamesSimilar(moodleCourse.coursename, course.name)
        );
        if (alreadyApprovedInMoodle) return false;
        
        // Excluir asignados
        if (student.assignedCourseIds.includes(String(course.id))) return false;
        
        // Verificar programa
        if (!student.internalStudent?.programas || student.internalStudent.programas.length === 0) return true;
        if (!course.programas || course.programas.length === 0) return true;
        
        const studentProgramIds = student.internalStudent.programas.map(p => p.id);
        return course.programas.some(p => studentProgramIds.includes(p.id));
      }).length;
      
      // Agregar a resumen por cada especialidad
      especialidades.forEach(esp => {
        const current = summary.get(esp) || { count: 0, totalCourses: 0 };
        summary.set(esp, {
          count: current.count + 1,
          totalCourses: current.totalCourses + availableCoursesCount
        });
      });
    });
    
    return Array.from(summary.entries()).map(([especialidad, data]) => ({
      especialidad,
      studentCount: data.count,
      totalAvailableCourses: data.totalCourses
    }));
  }, [studentsData, currentMonthCourses]);

  // �📄 Paginación de estudiantes
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchStudent, showOnlyWithInternal, showOnlyWithSelections]);

  // Toggle selección de curso de Moodle
  const toggleMoodleCourseSelection = (courseId: number) => {
    setSelectedMoodleCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  // 🔹 Función para verificar si un curso pertenece al programa del estudiante
  const courseMatchesStudentProgram = (course: Course, student: StudentWithInternalData): boolean => {
    // Si el estudiante no tiene programa interno, mostrar todos los cursos
    if (!student.internalStudent?.programas || student.internalStudent.programas.length === 0) {
      return true;
    }

    // Si el curso no tiene programas asignados, mostrar a todos
    if (!course.programas || course.programas.length === 0) {
      return true;
    }

    // Obtener IDs de programas del estudiante
    const studentProgramIds = student.internalStudent.programas.map(p => p.id);

    // Verificar si algún programa del curso coincide con los programas del estudiante
    return course.programas.some(p => studentProgramIds.includes(p.id));
  };

  // 🚀 OPTIMIZACIÓN: Cargar cursos completados solo cuando se expande el accordion
  const loadStudentCompletedCourses = useCallback(async (studentCarnet: string) => {
    const student = studentsData.find(s => s.carnet === studentCarnet);
    
    if (!student || student.coursesLoaded || !student.internalStudent) {
      console.log(`⏭️ [${studentCarnet}] Skip: ${!student ? 'No encontrado' : student.coursesLoaded ? 'Ya cargado' : 'Sin interno'}`);
      return; // Ya cargado o sin equivalente interno
    }

    console.log(`🔄 [${studentCarnet}] Iniciando carga de cursos...`);

    try {
      // Cargar cursos del sistema en paralelo con cursos de Moodle
      const [lists, moodle] = await Promise.all([
        fetchStudentCourseLists(String(student.internalStudent.id)),
        fetchApprovedMoodleCourses(student.carnet),
      ]);

      console.log(`📥 [${studentCarnet}] Respuestas recibidas:`, {
        completedFromSystem: lists?.completed?.length || 0,
        assignedFromSystem: lists?.assigned?.length || 0,
        approvedFromMoodle: Array.isArray(moodle) ? moodle.length : 0
      });

      // Cursos completados del sistema
      const completedCourses = Array.isArray(lists?.completed) ? lists.completed : [];
      const completedCourseIds = completedCourses.map((c: any) => String(c.id));

      // 🚫 Cursos ya asignados actualmente (NO completados)
      const assignedCourses = Array.isArray(lists?.assigned) ? lists.assigned : [];
      const assignedCourseIds = assignedCourses.map((c: any) => String(c.id));

      // Cursos aprobados de Moodle
      const moodleCourses = Array.isArray(moodle) ? moodle : [];

      console.log(`📋 [${studentCarnet}] Cursos de Moodle RAW:`, moodleCourses.map(m => ({
        id: m.courseid,
        name: m.coursename,
        grade: m.finalgrade
      })));

      // Filtrar Moodle para evitar duplicados con cursos del sistema
      const moodleCompletedCourses = moodleCourses.filter(
        (m) => !completedCourses.some((c: any) => areNamesSimilar(m.coursename, c.name))
      );

      console.log(`✅ [${studentCarnet}] Cursos finales:`, {
        completedIds: completedCourseIds,
        assignedIds: assignedCourseIds,
        moodleCompleted: moodleCompletedCourses.map(m => m.coursename)
      });

      // Actualizar solo este estudiante
      setStudentsData(prev => prev.map(s => 
        s.carnet === studentCarnet 
          ? { ...s, completedCourseIds, assignedCourseIds, moodleCompletedCourses, coursesLoaded: true }
          : s
      ));

      console.log(`📚 [${studentCarnet}] ✅ Carga completa: ${completedCourseIds.length} completados, ${assignedCourseIds.length} asignados, ${moodleCompletedCourses.length} Moodle`);
    } catch (err) {
      console.error(`❌ [${studentCarnet}] Error cargando cursos:`, err);
    }
  }, [studentsData]);

  // Obtener cursos completados del sistema para un estudiante (memoizado)
  const getCompletedCoursesForStudent = useCallback((studentCarnet: string) => {
    const student = studentsData.find((s) => s.carnet === studentCarnet);
    if (!student || !student.completedCourseIds) return [];

    return currentMonthCourses.filter((course) =>
      student.completedCourseIds.includes(String(course.id))
    );
  }, [studentsData, currentMonthCourses]);

  // Obtener cursos completados de Moodle para un estudiante (memoizado)
  const getMoodleCompletedCoursesForStudent = useCallback((studentCarnet: string) => {
    const student = studentsData.find((s) => s.carnet === studentCarnet);
    if (!student) return [];
    return student.moodleCompletedCourses || [];
  }, [studentsData]);

  // 🔹 Obtener cursos disponibles del mes filtrados por programa del estudiante (memoizado)
  const getAvailableCoursesForStudent = useCallback((studentCarnet: string) => {
    const student = studentsData.find((s) => s.carnet === studentCarnet);
    if (!student) return [];

    return currentMonthCourses.filter((course) => {
      // Verificar programa
      if (!courseMatchesStudentProgram(course, student)) return false;
      
      // Excluir completados del sistema
      if (student.completedCourseIds.includes(String(course.id))) return false;
      
      // Excluir cursos ya aprobados en Moodle (por nombre similar)
      const alreadyApprovedInMoodle = student.moodleCompletedCourses?.some(
        (moodleCourse) => areNamesSimilar(moodleCourse.coursename, course.name)
      );
      if (alreadyApprovedInMoodle) return false;
      
      // Excluir asignados
      if (student.assignedCourseIds.includes(String(course.id))) return false;
      
      return true;
    });
  }, [studentsData, currentMonthCourses]);

  // Toggle selección de curso actual para un estudiante (optimizado)
  const toggleStudentCourseSelection = useCallback((studentCarnet: string, courseId: string) => {
    setStudentsData((prev) =>
      prev.map((s) => {
        if (s.carnet !== studentCarnet) return s;
        const isSelected = s.selectedCourseIds.includes(courseId);
        return {
          ...s,
          selectedCourseIds: isSelected
            ? s.selectedCourseIds.filter((id) => id !== courseId)
            : [...s.selectedCourseIds, courseId],
        };
      })
    );
  }, []);

  // Totales
  const totalSelectedCourses = useMemo(
    () => studentsData.reduce((sum, s) => sum + s.selectedCourseIds.length, 0),
    [studentsData]
  );

  const validAssignments = useMemo(
    () =>
      studentsData.filter(
        (s) => s.internalStudent && s.selectedCourseIds.length > 0
      ),
    [studentsData]
  );

  // Confirmar asignación
  const handleConfirmClick = () => {
    if (validAssignments.length === 0) {
      toast({
        title: "Sin selección",
        description: "Debes seleccionar cursos para al menos un estudiante",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    try {
      const assignments = validAssignments.map((s) => ({
        studentId: String(s.internalStudent!.id),
        courseIds: s.selectedCourseIds,
      }));

      await bulkAssignCourses(assignments);

      const totalStudents = assignments.length;
      const totalCourses = assignments.reduce((sum, a) => sum + a.courseIds.length, 0);

      const details = assignments.map((assignment) => {
        const student = studentsData.find(
          (s) => String(s.internalStudent?.id) === assignment.studentId
        );
        const assignedCourses = currentMonthCourses.filter((c) =>
          assignment.courseIds.includes(String(c.id))
        );

        return {
          studentName: student?.nombreCompleto || "Desconocido",
          studentCarnet: student?.carnet || "",
          coursesCount: assignment.courseIds.length,
          courseNames: assignedCourses.map((c) => c.name),
        };
      });

      setAssignmentResult({ totalStudents, totalCourses, details });
      setShowConfirmDialog(false);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error en asignación:", error);
      toast({
        title: "❌ Error",
        description: "Hubo un problema al asignar los cursos",
        variant: "destructive",
      });
    }
  };

  // Descargar CSV de cursos asignados (OPTIMIZADO - Un solo archivo)
  const handleDownloadCSV = async () => {
    if (!assignmentResult) return;
    
    setIsDownloadingCSV(true);
    
    try {
      // Obtener los carnets de los estudiantes que recibieron cursos
      const carnets = assignmentResult.details.map(d => d.studentCarnet).filter(Boolean);
      
      if (carnets.length === 0) {
        toast({
          title: "⚠️ Sin datos",
          description: "No hay estudiantes para exportar",
          variant: "destructive",
        });
        setIsDownloadingCSV(false);
        return;
      }

      // Mostrar notificación de progreso
      const progressToast = toast({
        title: "⚡ Generando CSV optimizado...",
        description: `Procesando ${carnets.length} estudiante(s) en modo rápido`,
        duration: 0, // No auto-dismiss
      });

      // ✅ Llamada optimizada: Todos los estudiantes en UNA sola petición
      await exportarYDescargarCursosMasivo(carnets);

      // Dismiss toast de progreso
      if (progressToast?.dismiss) {
        progressToast.dismiss();
      }

      toast({
        title: "✅ CSV descargado exitosamente",
        description: `Archivo generado con ${carnets.length} estudiante(s) en tiempo récord ⚡`,
      });

    } catch (error: any) {
      console.error("❌ Error descargando CSV:", error);
      toast({
        title: "❌ Error en descarga",
        description: error?.message || "No se pudo generar el archivo CSV",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  if (loadingMoodleCursos) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header compacto */}
      <Card className="border-2 border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <span className="font-semibold">Asignación desde Historial Moodle</span>
            </div>
            <div className="flex items-center space-x-2">
              {selectedMoodleCourseIds.length > 0 && (
                <Badge variant="secondary">
                  {selectedMoodleCourseIds.length} curso(s)
                </Badge>
              )}
              {studentsData.length > 0 && (
                <Badge className="bg-green-600">
                  {studentsData.length} estudiantes
                </Badge>
              )}
              {totalSelectedCourses > 0 && (
                <Badge className="bg-blue-600">
                  {totalSelectedCourses} a asignar
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Selecciona cursos históricos → Elige estudiantes → Asigna cursos actuales
          </p>
        </CardHeader>
      </Card>

      {/* Filtros colapsables */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-sm">Filtros</span>
            </div>
            <Button variant="ghost" size="sm">
              {showFilters ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Período</label>
                <Select
                  value={String(mesesHistorico)}
                  onValueChange={(value) => setMesesHistorico(Number(value))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Buscar curso</label>
                <Input
                  placeholder="Nombre o código..."
                  value={searchMoodleCourse}
                  onChange={(e) => setSearchMoodleCourse(e.target.value)}
                  className="h-9"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Mes</label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {availableMonths.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Badge variant="outline" className="h-9 px-3 flex items-center">
                  {filteredMoodleCursos.length} curso(s)
                </Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lista de cursos colapsable */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowCoursesList(!showCoursesList)}>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-sm">Cursos Históricos de Moodle</span>
              {selectedMoodleCourseIds.length > 0 && (
                <Badge className="bg-purple-600 text-white">
                  {selectedMoodleCourseIds.length} seleccionados
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm">
              {showCoursesList ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
        </CardHeader>
        {showCoursesList && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredMoodleCursos.map((curso) => {
                const isSelected = selectedMoodleCourseIds.includes(curso.course_id);
                return (
                  <div
                    key={curso.course_id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                    }`}
                    onClick={() => toggleMoodleCourseSelection(curso.course_id)}
                  >
                    <div className="flex items-start space-x-2">
                      <Checkbox checked={isSelected} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{curso.course_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {curso.course_code}
                          </Badge>
                          <span className="text-xs text-gray-500">{curso.start_date}</span>
                        </div>
                        <div className="flex items-center mt-1 text-xs text-gray-600">
                          <Users className="h-3 w-3 mr-1" />
                          {curso.total_estudiantes}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Panel de estudiantes */}
      {selectedMoodleCourseIds.length > 0 && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-sm">Estudiantes y Asignación</span>
                <Badge variant="outline" className="bg-green-50">
                  {validAssignments.length} con equivalente
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingStudents || loadingCurrentCourses ? (
              <div className="space-y-4">
                {/* Skeleton de filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
                
                {/* Skeleton de estadísticas */}
                <Skeleton className="h-10 w-full" />
                
                {/* Skeleton de acordeones */}
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* 🎯 Alert informativo */}
                <Alert className="bg-blue-50 border-blue-300">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <AlertTitle className="text-blue-900 font-semibold">¿Cómo funciona esta asignación?</AlertTitle>
                  <AlertDescription className="text-blue-800">
                    <ol className="list-decimal list-inside space-y-1 mt-2">
                      <li>Selecciona cursos históricos de Moodle arriba</li>
                      <li>Se cargarán los estudiantes que tomaron esos cursos</li>
                      <li>Revisa los cursos completados de cada estudiante</li>
                      <li>Selecciona los cursos nuevos a asignar (solo del mismo programa)</li>
                      <li>Confirma la asignación masiva</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                {/* 📊 Tarjetas de estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="bg-white border-2 border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Total Estudiantes</p>
                        <p className="text-2xl font-bold text-blue-600">{studentsData.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Con Equivalente</p>
                        <p className="text-2xl font-bold text-green-600">
                          {studentsData.filter(s => s.internalStudent).length}
                        </p>
                      </div>
                      <UserCheck className="h-8 w-8 text-green-600 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Cursos a Asignar</p>
                        <p className="text-2xl font-bold text-purple-600">{totalSelectedCourses}</p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-purple-600 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Listos para Asignar</p>
                        <p className="text-2xl font-bold text-orange-600">{validAssignments.length}</p>
                      </div>
                      <Award className="h-8 w-8 text-orange-600 opacity-20" />
                    </div>
                  </div>
                </div>

                {/* Filtros de estudiantes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar estudiante..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="only-internal"
                      checked={showOnlyWithInternal}
                      onCheckedChange={(checked) => setShowOnlyWithInternal(checked as boolean)}
                    />
                    <label htmlFor="only-internal" className="text-sm cursor-pointer">
                      Solo con equivalente interno
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="only-selections"
                      checked={showOnlyWithSelections}
                      onCheckedChange={(checked) => setShowOnlyWithSelections(checked as boolean)}
                    />
                    <label htmlFor="only-selections" className="text-sm cursor-pointer">
                      Solo con cursos seleccionados
                    </label>
                  </div>
                </div>

                {/* 🆕 Botón "Seleccionar todos los estudiantes" */}
                {filteredStudents.length > 0 && (
                  <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-sm text-blue-900">
                          Seleccionar todos los estudiantes filtrados
                        </p>
                        <p className="text-xs text-blue-700">
                          Se abrirán automáticamente {filteredStudents.filter(s => s.internalStudent).length} estudiantes con equivalente interno
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        // Cargar cursos de todos los estudiantes con equivalente interno
                        const studentsToLoad = filteredStudents.filter(s => s.internalStudent && !s.coursesLoaded);
                        
                        if (studentsToLoad.length === 0) {
                          toast({
                            title: "Info",
                            description: "Todos los estudiantes ya tienen sus cursos cargados",
                          });
                          return;
                        }

                        toast({
                          title: "🔄 Cargando...",
                          description: `Cargando cursos de ${studentsToLoad.length} estudiantes...`,
                        });

                        // Cargar cursos de forma secuencial para evitar sobrecarga
                        studentsToLoad.forEach((student, index) => {
                          setTimeout(() => {
                            loadStudentCompletedCourses(student.carnet);
                          }, index * 200); // 200ms de delay entre cada carga
                        });

                        setTimeout(() => {
                          toast({
                            title: "✅ Completado",
                            description: "Cursos cargados. Ahora puedes seleccionar los cursos a asignar.",
                          });
                        }, studentsToLoad.length * 200 + 500);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Cargar todos
                    </Button>
                  </div>
                )}

                {/* Estadísticas de filtrado */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-3 rounded text-xs gap-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="text-gray-600">
                      Mostrando <strong>{Math.min(ITEMS_PER_PAGE, filteredStudents.length - (currentPage - 1) * ITEMS_PER_PAGE)}</strong> de <strong>{filteredStudents.length}</strong> estudiantes filtrados
                    </span>
                    <span className="text-gray-400 hidden sm:inline">|</span>
                    <span className="text-green-700">
                      <strong>{studentsData.filter(s => s.internalStudent).length}</strong> en sistema interno
                    </span>
                    <span className="text-gray-400 hidden sm:inline">|</span>
                    <span className="text-blue-700">
                      <strong>{studentsData.filter(s => s.selectedCourseIds.length > 0).length}</strong> con selecciones
                    </span>
                    {/* Contador de estudiantes en área de cierre */}
                    {Object.values(careerProgressMap).filter(p => p.en_area_cierre).length > 0 && (
                      <>
                        <span className="text-gray-400 hidden sm:inline">|</span>
                        <span className="text-amber-700 font-medium">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          <strong>{Object.values(careerProgressMap).filter(p => p.en_area_cierre).length}</strong> en área de cierre
                        </span>
                      </>
                    )}
                    
                    {/* 🎯 Resumen por especialidad con cursos disponibles */}
                    {programSummary.length > 0 && (
                      <>
                        <span className="text-gray-400 hidden sm:inline">|</span>
                        <div className="flex flex-wrap items-center gap-2">
                          {programSummary.map((prog) => (
                            <span key={prog.especialidad} className="inline-flex items-center gap-1.5">
                              <span className="text-gray-700 font-medium">{prog.especialidad}</span>
                              <Badge variant="outline" className="text-xs">
                                {prog.totalAvailableCourses}
                              </Badge>
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {totalPages > 1 && (
                    <span className="text-gray-600">
                      Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                    </span>
                  )}
                </div>

                {/* Acordeón compacto de estudiantes */}
                {filteredStudents.length === 0 ? (
                  <Alert className="bg-gray-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      No se encontraron estudiantes con los filtros aplicados.
                      {(showOnlyWithInternal || showOnlyWithSelections || searchStudent) && (
                        <span className="block mt-1 text-xs text-gray-600">
                          Intenta ajustar o limpiar los filtros.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Accordion type="multiple" className="w-full space-y-2">
                      {paginatedStudents.map((student) => (
                        <StudentAccordionItem
                          key={student.carnet}
                          student={student}
                          currentMonthCourses={currentMonthCourses}
                          onLoadCourses={loadStudentCompletedCourses}
                          onToggleCourseSelection={toggleStudentCourseSelection}
                          careerProgress={careerProgressMap[student.carnet] || careerProgressMap[student.carnet.toUpperCase()]}
                        />
                      ))}
                    </Accordion>

                  {/* 📄 Controles de paginación */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          Página {currentPage} de {totalPages}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({paginatedStudents.length} de {filteredStudents.length} estudiantes)
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                  </>
                )}

                {/* Botones de acción */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Button
                    onClick={() => setShowMassiveAssignmentModal(true)}
                    disabled={filteredStudents.filter(s => s.internalStudent).length === 0}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Asignación Masiva
                  </Button>
                  <Button
                    onClick={handleConfirmClick}
                    disabled={validAssignments.length === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Asignar {totalSelectedCourses} Curso(s)
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* 🆕 Modal de Asignación Masiva */}
      <Dialog open={showMassiveAssignmentModal} onOpenChange={setShowMassiveAssignmentModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <Users className="h-6 w-6 mr-2 text-green-600" />
              Asignación Masiva de Cursos
            </DialogTitle>
            <DialogDescription>
              Selecciona cursos para asignar a {filteredStudents.filter(s => s.internalStudent).length} estudiante(s) filtrado(s)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Reutilizar la misma vista de cursos */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4 shadow-sm">
              <h5 className="font-semibold text-sm text-blue-800 mb-3 flex items-center justify-between">
                <span className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Cursos Disponibles - Mes Actual
                </span>
                <Badge variant="outline" className="text-sm bg-blue-100">
                  {massiveSelectedCourseIds.length}/{currentMonthCourses.length}
                </Badge>
              </h5>
              <div className="text-sm text-blue-700 mb-3 bg-blue-100/70 p-2 rounded border border-blue-200">
                📅 Solo cursos del programa del estudiante (excluye completados y asignados)
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {currentMonthCourses.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-blue-300 mx-auto mb-3" />
                    <Alert className="py-3 bg-blue-50 border-blue-200">
                      <AlertDescription className="text-sm text-blue-700">
                        No hay cursos disponibles este mes
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  currentMonthCourses.map((course) => {
                    const isSelected = massiveSelectedCourseIds.includes(String(course.id));
                    return (
                      <div
                        key={course.id}
                        className={`rounded border cursor-pointer transition-all p-3 hover:shadow-md ${
                          isSelected
                            ? "border-blue-400 bg-blue-100 shadow-md"
                            : "border-blue-200 bg-white hover:bg-blue-50"
                        }`}
                        onClick={() => {
                          setMassiveSelectedCourseIds(prev => 
                            isSelected
                              ? prev.filter(id => id !== String(course.id))
                              : [...prev, String(course.id)]
                          );
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox checked={isSelected} className="mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2 text-blue-900">{course.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs h-5 px-2">{course.code}</Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(course.startDate).toLocaleDateString('es-ES', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-600">
                Se asignarán <strong>{massiveSelectedCourseIds.length} curso(s)</strong> a{" "}
                <strong>{filteredStudents.filter(s => s.internalStudent).length} estudiante(s)</strong>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowMassiveAssignmentModal(false);
                    setMassiveSelectedCourseIds([]);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    // Aplicar selección masiva a todos los estudiantes filtrados con equivalente interno
                    setStudentsData(prev => 
                      prev.map(student => {
                        // Solo actualizar estudiantes que están filtrados y tienen equivalente interno
                        const isFiltered = filteredStudents.find(s => s.carnet === student.carnet);
                        if (!isFiltered || !student.internalStudent) {
                          return student;
                        }
                        
                        // Filtrar solo cursos compatibles con el programa del estudiante
                        const compatibleCourseIds = massiveSelectedCourseIds.filter(courseId => {
                          const course = currentMonthCourses.find(c => String(c.id) === courseId);
                          if (!course) return false;
                          return courseMatchesStudentProgram(course, student);
                        });
                        
                        // Combinar con selecciones existentes (sin duplicados)
                        const newSelectedIds = Array.from(
                          new Set([...student.selectedCourseIds, ...compatibleCourseIds])
                        );
                        
                        return {
                          ...student,
                          selectedCourseIds: newSelectedIds,
                        };
                      })
                    );
                    
                    setShowMassiveAssignmentModal(false);
                    setMassiveSelectedCourseIds([]);
                    
                    toast({
                      title: "✅ Asignación masiva aplicada",
                      description: `${massiveSelectedCourseIds.length} curso(s) agregados a ${filteredStudents.filter(s => s.internalStudent).length} estudiante(s)`,
                    });
                  }}
                  disabled={massiveSelectedCourseIds.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Asignación
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <AlertCircle className="h-6 w-6 mr-2 text-blue-600" />
              Confirmar Asignación
            </DialogTitle>
            <DialogDescription>
              Revisa los cursos que serán asignados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertTitle>Resumen</AlertTitle>
              <AlertDescription>
                Se asignarán <strong>{totalSelectedCourses} curso(s)</strong> a{" "}
                <strong>{validAssignments.length} estudiante(s)</strong>
              </AlertDescription>
            </Alert>

            {validAssignments.map((student) => {
              const assignedCourses = currentMonthCourses.filter((c) =>
                student.selectedCourseIds.includes(String(c.id))
              );

              return (
                <div key={student.carnet} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{student.nombreCompleto}</p>
                      <p className="text-sm text-gray-600">Carnet: {student.carnet}</p>
                    </div>
                    <Badge>{student.selectedCourseIds.length} curso(s)</Badge>
                  </div>
                  <div className="space-y-1 mt-3">
                    {assignedCourses.map((course) => (
                      <div key={course.id} className="text-sm text-gray-700 pl-4">
                        • {course.name} ({course.code})
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de éxito */}
      <Dialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          setShowSuccessDialog(open);
          if (!open) {
            // Limpiar selecciones
            setSelectedMoodleCourseIds([]);
            setStudentsData([]);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-green-600">
              <CheckCircle2 className="h-6 w-6 mr-2" />
              ¡Asignación Exitosa!
            </DialogTitle>
          </DialogHeader>

          {assignmentResult && (
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Completado</AlertTitle>
                <AlertDescription>
                  Se asignaron <strong>{assignmentResult.totalCourses} curso(s)</strong> a{" "}
                  <strong>{assignmentResult.totalStudents} estudiante(s)</strong>
                </AlertDescription>
              </Alert>

              {assignmentResult.details.map((detail, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{detail.studentName}</p>
                      <p className="text-sm text-gray-600">Carnet: {detail.studentCarnet}</p>
                    </div>
                    <Badge className="bg-green-600">{detail.coursesCount} curso(s)</Badge>
                  </div>
                  <div className="space-y-1 mt-3">
                    {detail.courseNames.map((name, i) => (
                      <div key={i} className="text-sm text-gray-700 pl-4">
                        • {name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadCSV}
              disabled={isDownloadingCSV}
              className="border-green-600 text-green-700 hover:bg-green-50"
            >
              {isDownloadingCSV ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando CSV consolidado...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  📊 Descargar CSV Consolidado
                </>
              )}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setShowSuccessDialog(false);
                setSelectedMoodleCourseIds([]);
                setStudentsData([]);
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
