"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Users,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  BookOpen,
  UserCheck,
  Database,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { 
  fetchInternalStudentEquivalents,
  type MoodleStudentByCourse,
  type InternalStudentEquivalent 
} from "@/services/moodleCourseQueries";
import { bulkAssignCourses } from "@/services/students";
import type { Course } from "@/services/courses";
import { exportarYDescargarCursosMasivo } from "@/services/courses";

interface MoodleBasedAssignmentPanelProps {
  moodleStudents: MoodleStudentByCourse[];
  courses: Course[];
  selectedCourseIds: string[];
  detectedDay: string | null;
  onClose: () => void;
}

interface StudentCourseSelection {
  moodleStudent: MoodleStudentByCourse;
  internalStudent: InternalStudentEquivalent | null;
  selectedCourseIds: string[];
}

export function MoodleBasedAssignmentPanel({
  moodleStudents,
  courses,
  selectedCourseIds,
  onClose,
}: MoodleBasedAssignmentPanelProps) {
  const { toast } = useToast();

  const [loadingInternals, setLoadingInternals] = useState(true);
  const [selections, setSelections] = useState<StudentCourseSelection[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);
  
  // Estados para paginación y filtrado
  const [currentPage, setCurrentPage] = useState(1);
  const [searchStudent, setSearchStudent] = useState("");
  const [showOnlyWithInternal, setShowOnlyWithInternal] = useState(false);
  const STUDENTS_PER_PAGE = 20; // Mostrar 20 estudiantes por página
  
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

  // Cargar estudiantes internos equivalentes
  useEffect(() => {
    (async () => {
      setLoadingInternals(true);
      try {
        // Extraer carnets de estudiantes de Moodle
        const carnets = moodleStudents.map((s) => s.carnet);

        const result = await fetchInternalStudentEquivalents(carnets);

        // Crear mapa de carnets a estudiantes internos
        const internalMap = new Map<string, InternalStudentEquivalent>();
        result.estudiantes.forEach((est) => {
          internalMap.set(est.carnet.toUpperCase(), est);
        });

        // Inicializar selecciones
        const initialSelections: StudentCourseSelection[] = moodleStudents.map((moodleStudent) => {
          const internal = internalMap.get(moodleStudent.carnet.toUpperCase()) || null;
          return {
            moodleStudent,
            internalStudent: internal,
            selectedCourseIds: [], // No seleccionar ningún curso por defecto
          };
        });

        setSelections(initialSelections);

        toast({
          title: "Estudiantes cargados",
          description: `${result.total_encontrados} de ${result.total_buscados} estudiantes encontrados en el sistema interno`,
        });

      } catch (error) {
        console.error("Error cargando estudiantes internos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los estudiantes internos",
          variant: "destructive",
        });
      } finally {
        setLoadingInternals(false);
      }
    })();
  }, [moodleStudents, toast]);

  // Obtener cursos disponibles
  const availableCourses = useMemo(() => {
    const filtered = courses.filter(c => selectedCourseIds.includes(String(c.id)));
    console.log('[DEBUG MoodlePanel] Filtrado de cursos:', {
      totalCourses: courses.length,
      selectedCourseIds: selectedCourseIds,
      filteredCount: filtered.length,
      coursesIds: courses.map(c => String(c.id)),
      filtered: filtered.map(c => ({ id: c.id, name: c.name }))
    });
    return filtered;
  }, [courses, selectedCourseIds]);

  // Toggle selección de curso para un estudiante
  const toggleCourseSelection = (studentCarnet: string, courseId: string) => {
    setSelections((prev) =>
      prev.map((s) => {
        if (s.moodleStudent.carnet !== studentCarnet) return s;
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

  // Total de cursos seleccionados
  const totalSelectedCourses = useMemo(
    () => selections.reduce((sum, s) => sum + s.selectedCourseIds.length, 0),
    [selections]
  );

  // Estudiantes con selecciones válidas (tienen estudiante interno y cursos seleccionados)
  const validSelections = useMemo(
    () => selections.filter((s) => s.internalStudent && s.selectedCourseIds.length > 0),
    [selections]
  );

  // Cursos seleccionados globalmente
  const selectedCourses = useMemo(
    () => courses.filter((c) => selectedCourseIds.includes(String(c.id))),
    [courses, selectedCourseIds]
  );

  // Filtrar estudiantes
  const filteredSelections = useMemo(() => {
    let filtered = selections;

    // Filtro por búsqueda
    if (searchStudent.trim()) {
      const searchLower = searchStudent.toLowerCase();
      filtered = filtered.filter((s) =>
        s.moodleStudent.nombre_completo.toLowerCase().includes(searchLower) ||
        s.moodleStudent.carnet.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por equivalente interno
    if (showOnlyWithInternal) {
      filtered = filtered.filter((s) => s.internalStudent !== null);
    }

    return filtered;
  }, [selections, searchStudent, showOnlyWithInternal]);

  // Paginación
  const paginatedSelections = useMemo(() => {
    const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE;
    const endIndex = startIndex + STUDENTS_PER_PAGE;
    return filteredSelections.slice(startIndex, endIndex);
  }, [filteredSelections, currentPage, STUDENTS_PER_PAGE]);

  const totalPages = Math.ceil(filteredSelections.length / STUDENTS_PER_PAGE);

  const handleConfirmClick = () => {
    if (validSelections.length === 0) {
      toast({
        title: "Sin selección",
        description: "Debes seleccionar al menos un curso para un estudiante",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    try {
      // Preparar asignaciones
      const assignments = validSelections.map((s) => ({
        studentId: String(s.internalStudent!.id),
        courseIds: s.selectedCourseIds,
      }));

      await bulkAssignCourses(assignments);

      // Preparar resultado
      const totalStudents = assignments.length;
      const totalCourses = assignments.reduce((sum, a) => sum + a.courseIds.length, 0);

      const details = assignments.map((assignment) => {
        const selection = validSelections.find((s) => String(s.internalStudent!.id) === assignment.studentId)!;
        const assignedCourses = courses.filter((c) => assignment.courseIds.includes(String(c.id)));

        return {
          studentName: selection.internalStudent!.nombre_completo,
          studentCarnet: selection.internalStudent!.carnet,
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

  // Descargar CSV de cursos asignados
  const handleDownloadCSV = async () => {
    if (!assignmentResult) return;
    
    setIsDownloadingCSV(true);
    
    try {
      // Obtener los carnets de los estudiantes que recibieron cursos
      const carnets = assignmentResult.details.map(d => d.studentCarnet).filter(Boolean);
      
      toast({
        title: "📥 Descargando...",
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
        title: "❌ Error al descargar",
        description: error?.message || "Hubo un problema al descargar el CSV",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  if (loadingInternals) {
    return (
      <Card className="border-2 border-blue-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <p className="text-gray-600">Cargando estudiantes internos equivalentes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Estudiantes de Moodle - Asignación</span>
            <Badge variant="secondary">
              {moodleStudents.length} de Moodle
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              {validSelections.length} con equivalente interno
            </Badge>
            {totalSelectedCourses > 0 && (
              <Badge className="bg-blue-600 text-white animate-pulse">
                {totalSelectedCourses} curso(s) seleccionados
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Selecciona qué cursos deseas asignar a cada estudiante encontrado en el sistema interno
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 🎯 Alert informativo al inicio */}
        <Alert className="bg-blue-50 border-blue-300">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900 font-semibold">¿Cómo funciona esta asignación?</AlertTitle>
          <AlertDescription className="text-blue-800">
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Revisa los estudiantes encontrados en el sistema interno (marcados en verde ✓)</li>
              <li>Expande cada estudiante para ver sus cursos disponibles</li>
              <li>Selecciona los cursos que deseas asignar a cada estudiante</li>
              <li>Haz clic en "Confirmar Asignación" cuando termines</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* 📊 Resumen de progreso */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white border-2 border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Estudiantes</p>
                <p className="text-2xl font-bold text-blue-600">{selections.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Con Equivalente</p>
                <p className="text-2xl font-bold text-green-600">
                  {selections.filter(s => s.internalStudent).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Sin Equivalente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {selections.filter(s => !s.internalStudent).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Cursos Seleccionados</p>
                <p className="text-2xl font-bold text-purple-600">{totalSelectedCourses}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Resumen de cursos disponibles */}
        <Alert className="bg-blue-50 border-blue-200">
          <BookOpen className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Cursos Disponibles para Asignar</AlertTitle>
          <AlertDescription className="text-blue-800">
            <div className="mt-2 space-y-1">
              {selectedCourses.map((course) => (
                <div key={course.id} className="text-sm">
                  • {course.name} ({course.code})
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>

        {/* 🔍 Filtros y búsqueda */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o carnet..."
                value={searchStudent}
                onChange={(e) => {
                  setSearchStudent(e.target.value);
                  setCurrentPage(1); // Reset a primera página
                }}
                className="pl-10"
              />
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-internal"
                  checked={showOnlyWithInternal}
                  onCheckedChange={(checked) => {
                    setShowOnlyWithInternal(!!checked);
                    setCurrentPage(1); // Reset a primera página
                  }}
                />
                <label
                  htmlFor="filter-internal"
                  className="text-sm font-medium cursor-pointer"
                >
                  Solo con equivalente interno
                </label>
              </div>
            </div>
          </div>

          {/* Resumen de filtrado */}
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
            <span className="text-gray-600">
              Mostrando {paginatedSelections.length} de {filteredSelections.length} estudiantes
              {filteredSelections.length !== selections.length && (
                <span className="text-gray-500"> (filtrados de {selections.length} totales)</span>
              )}
            </span>
            {totalPages > 1 && (
              <span className="text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
            )}
          </div>
        </div>

        {/* Acordeón de estudiantes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Estudiantes ({selections.length})
            </h3>
            {validSelections.length > 0 && (
              <Badge className="bg-purple-600 text-white animate-pulse">
                {validSelections.length} listo(s) para asignar
              </Badge>
            )}
          </div>

          <Accordion type="multiple" className="w-full space-y-3">
          {filteredSelections.length === 0 ? (
            <Alert className="bg-gray-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No se encontraron estudiantes con los filtros aplicados.
              </AlertDescription>
            </Alert>
          ) : (
            paginatedSelections.map((selection) => {
            const hasInternal = !!selection.internalStudent;
            const selectedCount = selection.selectedCourseIds.length;

            return (
              <AccordionItem
                key={selection.moodleStudent.carnet}
                value={selection.moodleStudent.carnet}
                className={`border rounded-lg ${
                  hasInternal ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"
                }`}
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center space-x-3">
                      {hasInternal ? (
                        <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-full">
                          <UserCheck className="h-5 w-5 text-white" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-10 h-10 bg-orange-600 rounded-full">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-medium text-base">
                          {selection.moodleStudent.nombre_completo}
                        </p>
                        <p className="text-sm text-gray-600">
                          Carnet: {selection.moodleStudent.carnet} • Plan: {selection.moodleStudent.plan_duracion}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!hasInternal ? (
                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                          ⚠️ No encontrado
                        </Badge>
                      ) : selectedCount > 0 ? (
                        <Badge className="bg-purple-600 text-white">
                          ✓ {selectedCount} curso(s) seleccionado(s)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600">
                          Sin cursos seleccionados
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {!hasInternal ? (
                    <Alert className="bg-orange-50 border-2 border-orange-300">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <AlertTitle className="text-orange-900 font-semibold">
                        ⚠️ Estudiante No Encontrado en Sistema Interno
                      </AlertTitle>
                      <AlertDescription className="text-orange-800">
                        <p className="mt-2">
                          No se puede asignar cursos a este estudiante porque no existe en el sistema interno.
                        </p>
                        <div className="mt-3 p-3 bg-white rounded border border-orange-200">
                          <p className="font-medium text-sm mb-2">Posibles soluciones:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Verifica que el carnet <strong>{selection.moodleStudent.carnet}</strong> sea correcto</li>
                            <li>Registra al estudiante en el sistema interno primero</li>
                            <li>Contacta al administrador si crees que debería existir</li>
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {/* Información del estudiante interno */}
                      {selection.internalStudent && (
                        <>
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="font-medium text-sm text-gray-900 mb-2">Estudiante en Sistema Interno:</h4>
                            <div className="text-sm space-y-1 text-gray-700">
                              <p>
                                <strong>Nombre:</strong> {selection.internalStudent.nombre_completo}
                              </p>
                              <p>
                                <strong>Carnet:</strong> {selection.internalStudent.carnet}
                              </p>
                              <p>
                                <strong>Correo:</strong> {selection.internalStudent.correo}
                              </p>
                              <p>
                                <strong>Programa(s):</strong>{" "}
                                {selection.internalStudent.programas.map((p) => p.nombre).join(", ") || "N/A"}
                              </p>
                              <p>
                                <strong>Estado:</strong>{" "}
                                <Badge variant="outline">{selection.internalStudent.estado}</Badge>
                              </p>
                            </div>
                          </div>

                          {/* Selección de cursos */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm text-gray-900">
                                📚 Seleccionar Cursos para Asignar:
                              </h4>
                              {selection.selectedCourseIds.length > 0 && (
                                <Badge className="bg-purple-600 text-white">
                                  {selection.selectedCourseIds.length} de {selectedCourses.length} seleccionado(s)
                                </Badge>
                              )}
                            </div>

                            {selectedCourses.length === 0 ? (
                              <Alert className="bg-yellow-50 border-yellow-300">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                  No hay cursos disponibles para asignar en este momento.
                                </AlertDescription>
                              </Alert>
                            ) : (
                              <div className="space-y-2">
                                {selectedCourses.map((course) => {
                                  const isSelected = selection.selectedCourseIds.includes(String(course.id));
                                  return (
                                    <div
                                      key={course.id}
                                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-purple-50 border-purple-300 shadow-sm'
                                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                      }`}
                                      onClick={() => toggleCourseSelection(selection.moodleStudent.carnet, String(course.id))}
                                    >
                                      <Checkbox
                                        id={`${selection.moodleStudent.carnet}-${course.id}`}
                                        checked={isSelected}
                                        onCheckedChange={() =>
                                          toggleCourseSelection(selection.moodleStudent.carnet, String(course.id))
                                        }
                                      />
                                      <label
                                        htmlFor={`${selection.moodleStudent.carnet}-${course.id}`}
                                        className="flex-1 cursor-pointer"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="font-medium text-sm">{course.name}</p>
                                            <p className="text-xs text-gray-600">
                                              {course.code} • Inicio: {course.startDate}
                                            </p>
                                          </div>
                                          {isSelected && (
                                            <CheckCircle2 className="h-5 w-5 text-purple-600" />
                                          )}
                                        </div>
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })
          )}
        </Accordion>

        {/* 📄 Controles de paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum ? "bg-purple-600" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
        </div>

        {/* Botón de asignación */}
        <div className="space-y-3 pt-4 border-t-2 border-gray-200">
          {validSelections.length === 0 ? (
            <Alert className="bg-yellow-50 border-yellow-300">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>No hay cursos listos para asignar.</strong> Expande un estudiante y selecciona al menos un curso.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-green-50 border-green-300">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>¡Listo para asignar!</strong> {validSelections.length} estudiante(s) con {totalSelectedCourses} curso(s) seleccionado(s).
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={handleConfirmClick}
              disabled={validSelections.length === 0}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              size="lg"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {validSelections.length === 0 
                ? 'Selecciona cursos para continuar' 
                : `Confirmar Asignación de ${totalSelectedCourses} Curso(s)`
              }
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1 border-2" size="lg">
              <X className="h-5 w-5 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Modal de Confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mr-3">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p>Confirmar Asignación de Cursos</p>
                <p className="text-sm text-gray-600 font-normal mt-1">
                  Revisa cuidadosamente antes de confirmar
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <Alert className="bg-blue-50 border-2 border-blue-300">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-900 font-semibold">📊 Resumen de Asignación</AlertTitle>
              <AlertDescription className="text-blue-800">
                <div className="mt-2 space-y-1">
                  <p>• <strong>{validSelections.length} estudiante(s)</strong> recibirán cursos</p>
                  <p>• <strong>{totalSelectedCourses} curso(s)</strong> serán asignados en total</p>
                  <p>• Los estudiantes podrán ver estos cursos en su perfil inmediatamente</p>
                </div>
              </AlertDescription>
            </Alert>

            {validSelections.map((selection, index) => {
              const assignedCourses = courses.filter((c) =>
                selection.selectedCourseIds.includes(String(c.id))
              );

              return (
                <div key={selection.moodleStudent.carnet} className="border-2 rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-600 rounded-full">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-base">{selection.internalStudent!.nombre_completo}</p>
                        <p className="text-sm text-gray-600">Carnet: {selection.internalStudent!.carnet}</p>
                      </div>
                    </div>
                    <Badge className="bg-purple-600 text-white">
                      {selection.selectedCourseIds.length} curso(s)
                    </Badge>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-700 uppercase">Cursos a asignar:</p>
                    {assignedCourses.map((course, idx) => (
                      <div key={course.id} className="flex items-start space-x-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{course.name}</p>
                          <p className="text-xs text-gray-600">{course.code}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex w-full space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 border-2"
                size="lg"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirm} 
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Sí, Confirmar Asignación
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Éxito */}
      <Dialog open={showSuccessDialog} onOpenChange={(open) => {
        setShowSuccessDialog(open);
        if (!open) {
          onClose();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-green-600">
              <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-full mr-3">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p>¡Asignación Completada Exitosamente! 🎉</p>
                <p className="text-sm text-gray-600 font-normal mt-1">
                  Todos los cursos han sido asignados correctamente
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {assignmentResult && (
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <Alert className="bg-green-50 border-2 border-green-300">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-900 font-semibold">✅ Resumen del Proceso</AlertTitle>
                <AlertDescription className="text-green-800">
                  <div className="mt-2 space-y-1">
                    <p>• Se asignaron <strong>{assignmentResult.totalCourses} curso(s)</strong></p>
                    <p>• A <strong>{assignmentResult.totalStudents} estudiante(s)</strong></p>
                    <p>• Los estudiantes ya pueden ver los cursos en su perfil</p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700">Detalle por Estudiante:</h3>
                {assignmentResult.details.map((detail, idx) => (
                  <div key={idx} className="border-2 rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-full">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{detail.studentName}</p>
                          <p className="text-sm text-gray-600">Carnet: {detail.studentCarnet}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        {detail.coursesCount} curso(s) asignado(s)
                      </Badge>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 space-y-2">
                      {detail.courseNames.map((name, i) => (
                        <div key={i} className="flex items-start space-x-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <p>{name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4">
            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                onClick={handleDownloadCSV}
                disabled={isDownloadingCSV}
                className="flex-1 border-2 border-green-600 text-green-700 hover:bg-green-50"
                size="lg"
              >
                {isDownloadingCSV ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Descargando...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-5 w-5 mr-2" />
                    Descargar CSV
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessDialog(false);
                  onClose();
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Cerrar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
