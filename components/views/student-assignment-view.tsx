"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { Student } from "@/services/students";
import type { Course } from "@/services/courses";
import {
  fetchStudentCourseLists,
  assignCourses,
  unassignCourses,
} from "@/services/students";
import { fetchCourses } from "@/services/courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  GripVertical,
  User,
  X,
} from "lucide-react";

interface StudentAssignmentViewProps {
  student: Student;
}

interface CourseCardProps {
  course: Course;
  status: "assigned" | "available" | "completed";
}

const CourseCard = ({ course, status }: CourseCardProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "course",
    item: { course, status },
    canDrag: status !== "completed",
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

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
      : "bg-green-50 border-green-200";

  const ref = useRef<HTMLDivElement>(null);
  if (status !== "completed") drag(ref);

  return (
    <Card
      ref={status !== "completed" ? (ref as any) : undefined}
      className={`border transition-all duration-200 ${status !== "completed" ? "cursor-move" : "cursor-not-allowed opacity-75"} ${isDragging ? "opacity-50" : ""} ${statusClasses}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {status !== "completed" && <GripVertical className="h-4 w-4 text-gray-400" />}
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
};

interface DropZoneProps {
  status: "assigned" | "available";
  onDrop: (course: Course, to: "assigned" | "available") => void;
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const DropZone = ({ status, onDrop, title, count, icon, children }: DropZoneProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "course",
    drop: (item: { course: Course; status: "assigned" | "available" | "completed" }) => {
      if (item.status !== status && item.status !== "completed") {
        onDrop(item.course, status);
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  const base = "min-h-[400px] p-6 rounded-lg border-2 border-dashed transition-colors duration-200";
  const style = isOver
    ? status === "assigned"
      ? "border-yellow-400 bg-yellow-50"
      : "border-blue-400 bg-blue-50"
    : status === "assigned"
    ? "border-yellow-200 bg-yellow-50"
    : "border-blue-200 bg-blue-50";

  const ref = useRef<HTMLDivElement>(null);
  drop(ref);

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
      <div ref={ref as any} className={`${base} ${style}`}>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
};

export function StudentAssignmentView({ student }: StudentAssignmentViewProps) {
  const [assigned, setAssigned] = useState<Course[]>([]);
  const [completed, setCompleted] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [available, setAvailable] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMonth, setShowMonth] = useState(false);
  const [pendingAssign, setPendingAssign] = useState<string[]>([]);
  const [pendingUnassign, setPendingUnassign] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [lists, courses] = await Promise.all([
          fetchStudentCourseLists(student.id),
          fetchCourses(student.programId),
        ]);
        setAssigned(lists.assigned);
        setCompleted(lists.completed);
        setAllCourses(courses);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [student.id, student.programId]);

  useEffect(() => {
    const avail = allCourses.filter(
      (c) => !assigned.some((a) => a.id === c.id) && !completed.some((co) => co.id === c.id),
    );
    setAvailable(avail);
  }, [allCourses, assigned, completed]);

  const monthCourses = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return available.filter((c) => {
      const d = new Date(c.startDate);
      return d >= start && d <= end;
    });
  }, [available]);

  useEffect(() => {
    setHasUnsavedChanges(pendingAssign.length > 0 || pendingUnassign.length > 0);
  }, [pendingAssign, pendingUnassign]);

  const handleCourseDrop = useCallback(
    (course: Course, to: "assigned" | "available") => {
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
    } catch (err) {
      console.error(err);
    }
  };

  const filterByName = (list: Course[]) =>
    list.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <User className="h-6 w-6 text-blue-600" />
            <div>
              <span className="text-2xl">{student.name}</span>
              <Badge variant="outline" className="ml-3">
                {student.carnet}
              </Badge>
            </div>
          </CardTitle>
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
            <div>
              <span className="font-medium text-gray-600">Cursos Activos:</span>
              <p className="text-gray-900">{assigned.length}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Cursos Completados:</span>
              <p className="text-gray-900">{completed.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Input
          placeholder="Buscar curso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs mb-4"
        />
        <Button onClick={() => setShowMonth((v) => !v)} variant="outline" className="mb-4">
          {showMonth ? "Ocultar mes actual" : "Ver cursos del mes"}
        </Button>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-${showMonth ? 4 : 3} gap-6`}>
        <DropZone
          status="assigned"
          onDrop={handleCourseDrop}
          title="Cursos Asignados"
          count={assigned.length}
          icon={<Check className="h-5 w-5 mr-2" />}
        >
          {filterByName(assigned).length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Arrastra cursos aquí para asignar</p>
            </div>
          ) : (
            filterByName(assigned).map((course) => (
              <CourseCard key={course.id} course={course} status="assigned" />
            ))
          )}
        </DropZone>

        {showMonth && (
          <DropZone
            status="available"
            onDrop={handleCourseDrop}
            title="Mes Actual"
            count={monthCourses.length}
            icon={<Calendar className="h-5 w-5 mr-2" />}
          >
            {filterByName(monthCourses).length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay cursos este mes</p>
              </div>
            ) : (
              filterByName(monthCourses).map((course) => (
                <CourseCard key={course.id} course={course} status="available" />
              ))
            )}
          </DropZone>
        )}

        <DropZone
          status="available"
          onDrop={handleCourseDrop}
          title="Cursos Disponibles"
          count={available.length}
          icon={<X className="h-5 w-5 mr-2" />}
        >
          {filterByName(available).length === 0 ? (
            <div className="text-center py-12">
              <Check className="h-12 w-12 text-green-300 mx-auto mb-4" />
              <p className="text-gray-500">Todos los cursos están asignados o completados</p>
            </div>
          ) : (
            filterByName(available).map((course) => (
              <CourseCard key={course.id} course={course} status="available" />
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
              {completed.length} cursos
            </Badge>
          </div>
          <div className="min-h-[400px] p-6 rounded-lg border-2 border-solid border-green-200 bg-green-50">
            <div className="space-y-3">
              {filterByName(completed).length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay cursos completados</p>
                </div>
              ) : (
                filterByName(completed).map((course) => (
                  <CourseCard key={course.id} course={course} status="completed" />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
        </div>
      )}
    </div>
  );
}
