"use client";

import { useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { Student } from "@/services/students";
import type { Course } from "@/services/courses";
import {
  assignCourses,
  unassignCourses,
  fetchStudentCourseLists,
} from "@/services/students";
import { fetchCourses } from "@/services/courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  GripVertical,
  Award,
  BookOpen,
  Calendar,
  User,
} from "lucide-react";
import type React from "react";

interface StudentAssignmentViewProps {
  student: Student;
}

interface DraggableCourseProps {
  course: Course;
  status: "assigned" | "available" | "completed";
}

const DraggableCourse = ({ course, status }: DraggableCourseProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "course",
    item: { course, status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const getTypeColor = (area: Course["area"]) => {
    switch (area) {
      case "common":
        return "bg-blue-500";
      case "specialty":
        return "bg-green-500";
      case "closure":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeLabel = (area: Course["area"]) => {
    switch (area) {
      case "common":
        return "Común";
      case "specialty":
        return "Especialidad";
      case "closure":
        return "Cierre";
      default:
        return "";
    }
  };

  const getStatusStyle = () => {
    switch (status) {
      case "assigned":
        return "bg-yellow-50 border-yellow-200 hover:bg-yellow-100";
      case "available":
        return "bg-blue-50 border-blue-200 hover:bg-blue-100";
      case "completed":
        return "bg-green-50 border-green-200 hover:bg-green-100";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "assigned":
        return <Check className="h-4 w-4 text-yellow-600" />;
      case "completed":
        return <Award className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <Card
      ref={status !== "completed" ? drag : undefined}
      className={`transition-all duration-200 ${status !== "completed" ? "cursor-move" : "cursor-not-allowed opacity-75"} ${isDragging ? "opacity-50 scale-95" : ""} ${getStatusStyle()}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {status !== "completed" && (
              <GripVertical className="h-4 w-4 text-gray-400" />
            )}
            {getStatusIcon()}
            <span className="font-medium">{course.name}</span>
          </div>
          <Badge className={`${getTypeColor(course.area)} text-white text-xs`}>
            {getTypeLabel(course.area)}
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
  onDrop: (course: Course, toStatus: "assigned" | "available") => void;
  children: React.ReactNode;
  title: string;
  count: number;
  icon: React.ReactNode;
}

const DropZone = ({
  status,
  onDrop,
  children,
  title,
  count,
  icon,
}: DropZoneProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "course",
    drop: (item: { course: Course; status: "assigned" | "available" | "completed" }) => {
      if (item.status !== status && item.status !== "completed") {
        onDrop(item.course, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const getDropZoneStyle = () => {
    const base =
      "min-h-[400px] p-6 rounded-lg border-2 border-dashed transition-all duration-200";
    if (isOver) {
      return status === "assigned"
        ? `${base} border-yellow-400 bg-yellow-50`
        : `${base} border-blue-400 bg-blue-50`;
    }
    return status === "assigned"
      ? `${base} border-yellow-200 bg-yellow-25`
      : `${base} border-blue-200 bg-blue-25`;
  };

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

      <div ref={drop} className={getDropZoneStyle()}>
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
  const [monthCourses, setMonthCourses] = useState<Course[]>([]);
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
          fetchCourses(student.programId || undefined),
        ]);
        setAssigned(lists.assigned);
        setCompleted(lists.completed);
        setAllCourses(courses);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [student.id]);

  useEffect(() => {
    const avail = allCourses.filter(
      (c) =>
        !assigned.some((a) => a.id === c.id) &&
        !completed.some((co) => co.id === c.id),
    );
    setAvailable(avail);

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setMonthCourses(
      avail.filter((c) => {
        const d = new Date(c.startDate);
        return d >= start && d <= end;
      }),
    );
  }, [allCourses, assigned, completed]);

  const handleCourseDrop = (
    course: Course,
    toStatus: "assigned" | "available",
  ) => {
    if (toStatus === "assigned") {
      setAssigned((prev) => [...prev, course]);
      setAvailable((prev) => prev.filter((c) => c.id !== course.id));
      setPendingAssign((prev) =>
        prev.includes(String(course.id)) ? prev : [...prev, String(course.id)],
      );
      setPendingUnassign((prev) =>
        prev.filter((id) => id !== String(course.id)),
      );
    } else {
      setAvailable((prev) => [...prev, course]);
      setAssigned((prev) => prev.filter((c) => c.id !== course.id));
      setPendingUnassign((prev) =>
        prev.includes(String(course.id)) ? prev : [...prev, String(course.id)],
      );
      setPendingAssign((prev) => prev.filter((id) => id !== String(course.id)));
    }
    setHasUnsavedChanges(true);
  };

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
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
    }
  };

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
        <Button
          onClick={() => setShowMonth((v) => !v)}
          variant="outline"
          className="mb-4"
        >
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
          {assigned.filter((c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()),
          ).length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Arrastra cursos aquí para asignar</p>
            </div>
          ) : (
            assigned
              .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((course) => (
                <DraggableCourse key={course.id} course={course} status="assigned" />
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
            {monthCourses.filter((c) =>
              c.name.toLowerCase().includes(searchTerm.toLowerCase()),
            ).length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay cursos este mes</p>
              </div>
            ) : (
              monthCourses
                .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((course) => (
                  <DraggableCourse key={course.id} course={course} status="available" />
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
          {available.filter((c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()),
          ).length === 0 ? (
            <div className="text-center py-12">
              <Check className="h-12 w-12 text-green-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Todos los cursos están asignados o completados
              </p>
            </div>
          ) : (
            available
              .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((course) => (
                <DraggableCourse key={course.id} course={course} status="available" />
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

          <div className="min-h-[400px] p-6 rounded-lg border-2 border-solid border-green-200 bg-green-25">
            <div className="space-y-3">
              {completed.filter((c) =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()),
              ).length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay cursos completados</p>
                </div>
              ) : (
                completed
                  .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((course) => (
                    <DraggableCourse key={course.id} course={course} status="completed" />
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