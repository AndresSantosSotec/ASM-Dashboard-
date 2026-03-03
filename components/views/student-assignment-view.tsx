"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { Student } from "@/services/students";
import type { Course, Pensum } from "@/services/courses";
import {
  fetchStudentCourseLists,
  assignCourses,
  unassignCourses,
} from "@/services/students";
import { 
  fetchStudentCourses, 
  fetchAvailablePensumForStudent,
  fetchPensumByProgram,
  createCourseFromPensum,
} from "@/services/courses";


import fetchApprovedMoodleCourses, {
  MoodleQueryCourse,
} from "@/services/moodleCourseQueries";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  GripVertical,
  User,
  X,
  Download,
  Clock,
} from "lucide-react";

// 🧹 Limpiar nombre de curso eliminando prefijos
const cleanCourseName = (name: string): string => {
  const month = '(?:Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)';
  const day = '(?:Lunes|Martes|Mi(?:é|e)rcoles|Jueves|Viernes|S(?:á|a)bado|Domingo)';
  const year = '\\d{4}';
  const program = '[A-Z]{2,5}';
  const regex = new RegExp(`^(?:${month}\\s+)?(?:${day}\\s+)?(?:${year}\\s+)?(?:${program}\\s+)?`, 'i');
  return name.replace(regex, '').trim();
};

const normalizeName = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");

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

// ✅ Comparar nombres limpiando prefijos PRIMERO
const areNamesSimilar = (a: string, b: string) => {
  const cleanA = cleanCourseName(a);
  const cleanB = cleanCourseName(b);
  const na = normalizeName(cleanA);
  const nb = normalizeName(cleanB);
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const distance = levenshtein(na, nb);
  const ratio = distance / Math.max(na.length, nb.length);
  return ratio <= 0.3;
};

interface StudentAssignmentViewProps {
  student: Student;
  onCoursesChange?: (assignedIds: string[], names: string[]) => void;
}

interface CourseCardProps {
  course: Course;
  status: "assigned" | "available" | "completed" | "static";
}

const CourseCard = memo(({ course, status }: CourseCardProps) => {
  const canDrag = status !== "completed" && status !== "static";
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "course",
    item: { course, status },
    canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [course.id, status, canDrag]);

  const areaColors: Record<Course["area"], string> = {
    common: "bg-blue-500",
    specialty: "bg-green-500",
    closure: "bg-purple-500",
  };

  const areaLabels: Record<Course["area"], string> = {
    common: "Común",
    specialty: "Especialidad",
    closure: "Cierre",
  };

  const statusClasses =
    status === "assigned"
      ? "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
      : status === "available"
      ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
      : status === "completed"
      ? "bg-green-50 border-green-200"
      : "bg-gray-100 border-gray-300 cursor-not-allowed";

  const ref = useRef<HTMLDivElement>(null);
  
  // Apply drag ref only if draggable
  useEffect(() => {
    if (canDrag && ref.current) {
      drag(ref);
    }
  }, [drag, canDrag]);

  return (
    <Card
      ref={ref}
      className={`border transition-all duration-200 ${
        canDrag
          ? "cursor-move" 
          : "cursor-not-allowed opacity-75"
      } ${isDragging ? "opacity-50" : ""} ${statusClasses}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {canDrag && (
              <GripVertical className="h-4 w-4 text-gray-400" />
            )}
            {status === "assigned" && <Check className="h-4 w-4 text-yellow-600" />}
            {status === "completed" && <Award className="h-4 w-4 text-green-600" />}
            <span className="font-medium">{course.name}</span>
          </div>
          <Badge className={`${areaColors[course.area]} text-white text-xs`}>
            {areaLabels[course.area]}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{course.code}</span>
          <BookOpen className="h-4 w-4 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 mt-1">{course.schedule}</p>
      </CardContent>
    </Card>
  );
});

CourseCard.displayName = 'CourseCard';

interface PensumCardProps {
  pensum: Pensum;
}

const PensumCard = memo(({ pensum }: PensumCardProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "pensum",
    item: { pensum },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [pensum.id]);

  const areaColors: Record<Pensum["area"], string> = {
    comun: "bg-blue-500",
    especialidad: "bg-green-500",
    cierre: "bg-purple-500",
  };

  const areaLabels: Record<Pensum["area"], string> = {
    comun: "Común",
    especialidad: "Especialidad",
    cierre: "Cierre",
  };

  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      drag(ref);
    }
  }, [drag]);

  return (
    <Card
      ref={ref}
      className={`border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 cursor-move transition-all duration-200 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{pensum.nombre}</span>
          </div>
          <Badge className={`${areaColors[pensum.area]} text-white text-xs`}>
            {areaLabels[pensum.area]}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{pensum.codigo}</span>
          <BookOpen className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">Créditos: {pensum.creditos}</span>
          <span className="text-xs text-gray-500">{pensum.duracion_semanas} semanas</span>
        </div>
        {pensum.descripcion && (
          <p className="text-xs text-gray-500 mt-2 truncate">{pensum.descripcion}</p>
        )}
      </CardContent>
    </Card>
  );
});

PensumCard.displayName = 'PensumCard';

interface MoodleCourseCardProps {
  course: MoodleQueryCourse;
}

const MoodleCourseCard = ({ course }: MoodleCourseCardProps) => (
  <Card className="border-green-200 bg-green-50">
    <CardContent className="p-4 space-y-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <Award className="h-4 w-4 text-green-600" />
          <span className="font-medium">{course.coursename}</span>
        </div>
        <Badge className="bg-green-600 text-white text-xs">Moodle</Badge>
      </div>
      <p className="text-sm text-gray-600">Código: {course.courseid}</p>
      <p className="text-sm text-gray-600">Inicio: {course.fecha_inicio_curso}</p>
      <p className="text-sm text-gray-600">Fin: {course.fecha_fin_curso}</p>
      <p className="text-sm text-gray-600">
        Nota final: {course.finalgrade ?? 'N/A'}
      </p>
      <p className="text-xs text-gray-500">Datos extraídos de Moodle</p>
    </CardContent>
  </Card>
);

interface DropZoneProps {
  status: "assigned" | "available";
  onDrop: (course: Course, to: "assigned" | "available") => void;
  onPensumDrop?: (pensum: Pensum) => void;
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const DropZone = memo(({ status, onDrop, onPensumDrop, title, count, icon, children }: DropZoneProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ["course", "pensum"],
    drop: (item: any) => {
      // Si es un pensum y se suelta en "assigned", crear curso
      if (item.pensum && status === "assigned" && onPensumDrop) {
        onPensumDrop(item.pensum);
      }
      // Si es un curso, manejar normalmente
      else if (item.course && item.status !== status && item.status !== "completed" && item.status !== "static") {
        onDrop(item.course, status);
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }), [status, onDrop, onPensumDrop]);

  const base = "min-h-[400px] p-6 rounded-lg border-2 border-dashed transition-colors duration-200";
  const style = isOver
    ? status === "assigned"
      ? "border-yellow-400 bg-yellow-50"
      : "border-blue-400 bg-blue-50"
    : status === "assigned"
    ? "border-yellow-200 bg-yellow-50"
    : "border-blue-200 bg-blue-50";

  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      drop(ref);
    }
  }, [drop]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3
          className={`font-semibold text-lg flex items-center ${status === "assigned" ? "text-yellow-700" : "text-blue-700"}`}
        >
          {icon}
          {title}
        </h3>
        <Badge variant="outline" className="text-sm">
          {count} cursos
        </Badge>
      </div>
      <div ref={ref} className={`${base} ${style}`}>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
});

DropZone.displayName = 'DropZone';

export function StudentAssignmentView({ student, onCoursesChange }: StudentAssignmentViewProps) {
  const [assigned, setAssigned] = useState<Course[]>([]);
  const [completed, setCompleted] = useState<Course[]>([]);
  const [moodleCompleted, setMoodleCompleted] = useState<MoodleQueryCourse[]>([]);
  const [moodleCourses, setMoodleCourses] = useState<MoodleQueryCourse[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [available, setAvailable] = useState<Course[]>([]);
  const [availablePensum, setAvailablePensum] = useState<Pensum[]>([]);
  const [totalPensumCourses, setTotalPensumCourses] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingAssign, setPendingAssign] = useState<string[]>([]);
  const [pendingUnassign, setPendingUnassign] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPensumLoading, setIsPensumLoading] = useState(false);
  const [isMoodleLoading, setIsMoodleLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('[DEBUG] Datos del estudiante:', student);
  }, [student]);

  useEffect(() => {
    (async () => {
      try {
        // Primera carga: Datos esenciales (más rápido)
        const [lists, courses] = await Promise.all([
          fetchStudentCourseLists(student.id),
          fetchStudentCourses(student.id),
        ]);

        setAssigned(lists.assigned);
        setCompleted(lists.completed);
        setAllCourses(courses);
        setIsLoading(false); // UI ya puede mostrar algo

        // Segunda carga: Datos de Moodle (puede ser más lento)
        setIsMoodleLoading(true);
        const moodle = await fetchApprovedMoodleCourses(student.carnet);
        
        console.log('[DEBUG] Cursos aprobados de Moodle:', moodle);
        setMoodleCourses(moodle);

        const filteredMoodle = moodle.filter(
          (m) => !lists.completed.some((c) => areNamesSimilar(m.coursename, c.name)),
        );
        setMoodleCompleted(filteredMoodle);
        setIsMoodleLoading(false);

        // Tercera carga: Pensum (lazy loading)
        setIsPensumLoading(true);
        const [pensum, totalPensum] = await Promise.all([
          fetchAvailablePensumForStudent(student.programId, Number(student.id)),
          fetchPensumByProgram(student.programId),
        ]);

        console.log('[DEBUG] Pensum disponible:', pensum);
        console.log('[DEBUG] Pensum total:', totalPensum);

        setAvailablePensum(pensum);
        setTotalPensumCourses(totalPensum.length);
        setIsPensumLoading(false);

      } catch (err) {
        console.error(err);
        setIsLoading(false);
        setIsMoodleLoading(false);
        setIsPensumLoading(false);
      }
    })();
  }, [student.id, student.programId, student.carnet]);

  useEffect(() => {
    const avail = allCourses.filter(
      (c) =>
        c.status !== 'synced' &&
        !assigned.some((a) => a.id === c.id) &&
        !completed.some((co) => co.id === c.id) &&
        !moodleCourses.some((m) => areNamesSimilar(m.coursename, c.name)),
    );
    setAvailable(avail);
  }, [allCourses, assigned, completed, moodleCourses]);

  const monthCourses = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextEnd = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, 0, 23, 59, 59);
    const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const mesActual = MESES_ES[now.getMonth()].toUpperCase();
    const mesSiguiente = MESES_ES[nextMonthDate.getMonth()].toUpperCase();
    const añoActual = String(now.getFullYear());
    const añoSiguiente = String(nextMonthDate.getFullYear());

    const isRelevant = (c: Course): boolean => {
      // A) Por startDate dentro del mes actual o siguiente
      const d = new Date(c.startDate);
      if (!isNaN(d.getTime()) && d >= start && d <= nextEnd) return true;
      // B) Por nombre que contenga mes actual o siguiente + año
      const nameUp = c.name.toUpperCase();
      if (nameUp.includes(mesActual) && nameUp.includes(añoActual)) return true;
      if (nameUp.includes(mesSiguiente) && nameUp.includes(añoSiguiente)) return true;
      return false;
    };

    return allCourses.filter((c) =>
      isRelevant(c) &&
      !assigned.some((a) => a.id === c.id) &&
      !completed.some((co) => co.id === c.id) &&
      !moodleCourses.some((m) => areNamesSimilar(m.coursename, c.name))
    );
  }, [allCourses, assigned, completed, moodleCourses]);

  useEffect(() => {
    setHasUnsavedChanges(pendingAssign.length > 0 || pendingUnassign.length > 0);
  }, [pendingAssign, pendingUnassign]);

  const handleCourseDrop = useCallback(
    (course: Course, to: "assigned" | "available") => {
      // Prevent state updates during active drag
      requestAnimationFrame(() => {
        if (to === "assigned") {
          setAssigned((prev) => [...prev, course]);
          setAvailable((prev) => prev.filter((c) => c.id !== course.id));
          setPendingAssign((prev) =>
            prev.includes(String(course.id)) ? prev : [...prev, String(course.id)],
          );
          setPendingUnassign((prev) => prev.filter((id) => id !== String(course.id)));
        } else {
          setAvailable((prev) => [...prev, course]);
          setAssigned((prev) => prev.filter((c) => c.id !== course.id));
          setPendingUnassign((prev) =>
            prev.includes(String(course.id)) ? prev : [...prev, String(course.id)],
          );
          setPendingAssign((prev) => prev.filter((id) => id !== String(course.id)));
        }
      });
    },
    [],
  );

  const handlePensumDrop = useCallback(
    async (pensum: Pensum) => {
      try {
        // Calcular fechas automáticamente (mes actual)
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (pensum.duracion_semanas * 7));

        toast({
          title: "Creando curso...",
          description: `Creando ${pensum.nombre} desde el pensum`,
        });

        // Crear curso desde pensum
        const newCourse = await createCourseFromPensum({
          pensumId: pensum.id,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          schedule: "Por definir", // Puede personalizarse en el modal
          facilitatorId: null,
        });

        // Asignar al estudiante
        await assignCourses([student.id], [String(newCourse.id)]);

        // Actualizar estados
        setAssigned((prev) => [...prev, newCourse]);
        setAvailablePensum((prev) => prev.filter((p) => p.id !== pensum.id));

        toast({
          title: "Éxito",
          description: `${pensum.nombre} creado y asignado correctamente`,
        });

        // Recargar pensum disponible
        const updatedPensum = await fetchAvailablePensumForStudent(
          student.programId,
          Number(student.id)
        );
        setAvailablePensum(updatedPensum);
      } catch (error) {
        console.error('Error al crear curso desde pensum:', error);
        toast({
          title: "Error",
          description: "No se pudo crear el curso desde el pensum",
          variant: "destructive",
        });
      }
    },
    [student.id, student.programId, toast],
  );

  const handleSaveChanges = async () => {
    try {
      if (pendingAssign.length) {
        await assignCourses([student.id], pendingAssign);
      }
      if (pendingUnassign.length) {
        await unassignCourses([student.id], pendingUnassign);
      }
      setPendingAssign([]);
      setPendingUnassign([]);
      if (onCoursesChange) {
        onCoursesChange(
          assigned.map((c) => String(c.id)),
          assigned.map((c) => c.name),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filterCourses = useCallback(
    (list: Course[]) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return list;
      return list.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.code.toLowerCase().includes(term),
      );
    },
    [searchTerm],
  );

  const filterMoodleCourses = useCallback(
    (list: MoodleQueryCourse[]) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return list;
      return list.filter(
        (c) =>
          c.coursename.toLowerCase().includes(term) ||
          String(c.courseid).includes(term),
      );
    },
    [searchTerm],
  );

  const filterPensum = useCallback(
    (list: Pensum[]) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return list;
      return list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(term) ||
          p.codigo.toLowerCase().includes(term),
      );
    },
    [searchTerm],
  );

  const handleExportStudentCSV = () => {
    // Crear encabezados CSV
    const headers = [
      "Tipo",
      "ID/Código",
      "Nombre del Curso",
      "Área",
      "Créditos",
      "Fecha Inicio",
      "Fecha Fin",
      "Horario",
      "Duración",
      "Nota Final"
    ];

    const rows: string[][] = [];

    // Cursos asignados
    assigned.forEach((course) => {
      rows.push([
        "Asignado",
        course.code || "",
        course.name || "",
        course.area || "",
        String(course.credits || ""),
        course.startDate || "",
        course.endDate || "",
        course.schedule || "",
        course.duration || "",
        ""
      ]);
    });

    // Cursos completados del sistema
    completed.forEach((course) => {
      rows.push([
        "Completado",
        course.code || "",
        course.name || "",
        course.area || "",
        String(course.credits || ""),
        course.startDate || "",
        course.endDate || "",
        course.schedule || "",
        course.duration || "",
        ""
      ]);
    });

    // Cursos completados de Moodle
    moodleCompleted.forEach((course) => {
      rows.push([
        "Completado (Moodle)",
        String(course.courseid || ""),
        course.coursename || "",
        "",
        "",
        course.fecha_inicio_curso || "",
        course.fecha_fin_curso || "",
        "",
        "",
        String(course.finalgrade || "N/A")
      ]);
    });

    // Combinar encabezados y filas
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((field) => {
          // Escapar campos que contengan comas, comillas o saltos de línea
          const fieldStr = String(field);
          if (fieldStr.includes(",") || fieldStr.includes('"') || fieldStr.includes("\n")) {
            return `"${fieldStr.replace(/"/g, '""')}"`;
          }
          return fieldStr;
        }).join(",")
      )
    ].join("\n");

    // Crear y descargar archivo
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `${student.carnet}_${student.name.replace(/\s+/g, "_")}_${timestamp}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const totalCourses = assigned.length + completed.length + moodleCompleted.length;
    toast({
      title: "Éxito",
      description: `Se exportaron ${totalCourses} cursos del estudiante ${student.name}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3">
              <User className="h-6 w-6 text-blue-600" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl">{student.name}</span>
                <Badge variant="outline" className="ml-3">
                  {student.carnet}
                </Badge>
                {isRecentlyEnrolled(student.createdAt, 5) && (
                  <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Reciente
                  </Badge>
                )}
              </div>
            </CardTitle>

          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Programa:</span>
              <p className="text-gray-900">{student.program}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Especialidad:</span>
              <div className="text-gray-900 flex items-center gap-2">
                <span>{student.specialty}</span>
                {availablePensum.length > 0 && (
                  <Badge variant="outline">
                    {availablePensum.length}
                  </Badge>
                )}
              </div>
            </div>
            {student.diaEstudio && (
              <div>
                <span className="font-medium text-gray-600">Día de Estudio:</span>
                <p className="text-blue-600 font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {normalizeDayName(student.diaEstudio)}
                </p>
              </div>
            )}
            {student.startDate && (
              <div>
                <span className="font-medium text-gray-600">Inicio:</span>
                <p className="text-gray-900">{student.startDate}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-600">Cursos Asignados:</span>
              <p className="text-gray-900">{assigned.length}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Cursos Completados:</span>
              <p className="text-gray-900">{completed.length + moodleCompleted.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder="Buscar por nombre o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs mb-4"
        />
        <div className="flex items-center gap-2 ml-auto">
          {hasUnsavedChanges && (
            <Button onClick={handleSaveChanges} className="mb-4">
              Guardar Cambios
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <DropZone
          status="assigned"
          onDrop={handleCourseDrop}
          onPensumDrop={handlePensumDrop}
          title="Cursos Asignados"
          count={assigned.length}
          icon={<Check className="h-5 w-5 mr-2" />}
        >
          {filterCourses(assigned).length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Arrastra cursos o pensum aquí para asignar</p>
            </div>
          ) : (
            filterCourses(assigned).map((course) => (
              <CourseCard key={course.id} course={course} status="assigned" />
            ))
          )}
        </DropZone>

        <DropZone
          status="available"
          onDrop={handleCourseDrop}
          title="Mes Actual"
          count={monthCourses.length}
          icon={<Calendar className="h-5 w-5 mr-2" />}
        >
          {filterCourses(monthCourses).length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay cursos este mes</p>
            </div>
          ) : (
            filterCourses(monthCourses).map((course) => (
              <CourseCard key={course.id} course={course} status="available" />
            ))
          )}
        </DropZone>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center text-indigo-700">
              <BookOpen className="h-5 w-5 mr-2" />
              Catálogo Pensum
            </h3>
            <Badge variant="outline" className="text-sm">
              {isPensumLoading ? "Cargando..." : `${availablePensum.length} cursos`}
            </Badge>
          </div>
          <div className="min-h-[400px] p-6 rounded-lg border-2 border-solid border-indigo-200 bg-indigo-50">
            <div className="space-y-3">
              {isPensumLoading ? (
                // Skeleton loader
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border-2 border-indigo-100 animate-pulse">
                    <div className="flex justify-between items-start mb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-5 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))
              ) : filterPensum(availablePensum).length === 0 ? (
                <div className="text-center py-12">
                  <Check className="h-12 w-12 text-indigo-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {availablePensum.length === 0 
                      ? "Todos los cursos del pensum están completados" 
                      : "No hay resultados para tu búsqueda"}
                  </p>
                </div>
              ) : (
                filterPensum(availablePensum).map((pensum) => (
                  <PensumCard key={pensum.id} pensum={pensum} />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center text-green-700">
              <Award className="h-5 w-5 mr-2" />
              Cursos Completados
            </h3>
            <Badge variant="outline" className="text-sm">
              {completed.length + moodleCompleted.length} cursos
            </Badge>
          </div>
          <div className="min-h-[400px] p-6 rounded-lg border-2 border-solid border-green-200 bg-green-50">
            <div className="space-y-3">
              {filterCourses(completed).length === 0 && filterMoodleCourses(moodleCompleted).length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay cursos completados</p>
                </div>
              ) : (
                <>
                  {filterCourses(completed).map((course) => (
                    <CourseCard key={course.id} course={course} status="completed" />
                  ))}
                  {filterMoodleCourses(moodleCompleted).map((course) => (
                    <MoodleCourseCard key={course.courseid} course={course} />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}