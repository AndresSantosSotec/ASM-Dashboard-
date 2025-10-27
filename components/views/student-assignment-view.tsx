"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { Student } from "@/services/students";
import type { Course } from "@/services/courses";
import {
  fetchStudentCourseLists,
  assignCourses,
  unassignCourses,
} from "@/services/students";
import { fetchStudentCourses } from "@/services/courses";


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
} from "lucide-react";

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
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const DropZone = memo(({ status, onDrop, title, count, icon, children }: DropZoneProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "course",
    drop: (item: { course: Course; status: "assigned" | "available" | "completed" | "static" }) => {
      if (item.status !== status && item.status !== "completed" && item.status !== "static") {
        onDrop(item.course, status);
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }), [status, onDrop]);

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
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingAssign, setPendingAssign] = useState<string[]>([]);
  const [pendingUnassign, setPendingUnassign] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('[DEBUG] Datos del estudiante:', student);
  }, [student]);

  useEffect(() => {
    (async () => {
      try {
        const [lists, courses, moodle] = await Promise.all([
          fetchStudentCourseLists(student.id),
          fetchStudentCourses(student.id),
          fetchApprovedMoodleCourses(student.carnet),
        ]);


        console.log('[DEBUG] Cursos aprobados de Moodle:', moodle);

        setMoodleCourses(moodle);

        const filteredMoodle = moodle.filter(
          (m) => !lists.completed.some((c) => areNamesSimilar(m.coursename, c.name)),
        );

        setAssigned(lists.assigned);
        setCompleted(lists.completed);
        setMoodleCompleted(filteredMoodle);

        setAllCourses(courses);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
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
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return allCourses.filter((c) => {
      const d = new Date(c.startDate);
      return (
        d >= start &&
        d <= end &&
        !assigned.some((a) => a.id === c.id) &&
        !completed.some((co) => co.id === c.id) &&
        !moodleCourses.some((m) => areNamesSimilar(m.coursename, c.name))
      );
    });
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
              <div>
                <span className="text-2xl">{student.name}</span>
                <Badge variant="outline" className="ml-3">
                  {student.carnet}
                </Badge>
              </div>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportStudentCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar CSV
            </Button>
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
              <p className="text-gray-900">{student.specialty}</p>
            </div>
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
          title="Cursos Asignados"
          count={assigned.length}
          icon={<Check className="h-5 w-5 mr-2" />}
        >
          {filterCourses(assigned).length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Arrastra cursos aquí para asignar</p>
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

        <DropZone
          status="available"
          onDrop={handleCourseDrop}
          title="Cursos Pensum/Pendientes"
          count={available.length}
          icon={<X className="h-5 w-5 mr-2" />}
        >
          {filterCourses(available).length === 0 ? (
            <div className="text-center py-12">
              <Check className="h-12 w-12 text-green-300 mx-auto mb-4" />
              <p className="text-gray-500">Todos los cursos están asignados o completados</p>
            </div>
          ) : (
            filterCourses(available).map((course) => (
              <CourseCard key={course.id} course={course} status="static" />
            ))
          )}
        </DropZone>

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