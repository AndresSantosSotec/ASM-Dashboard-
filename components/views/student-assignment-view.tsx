"use client";

import { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { Student } from "@/services/students";
import type { Course } from "@/services/courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  GripVertical,
  Save,
  Award,
  BookOpen,
  User,
} from "lucide-react";
import type React from "react";

interface StudentAssignmentViewProps {
  student: Student;
  courses: Course[];
  onCourseAssignment: (studentId: string, courseId: string, isAssigned: boolean) => void;
}

interface DraggableCourseProps {
  course: Course;
  status: "assigned" | "available" | "completed";
}

const DraggableCourse = ({ course, status }: DraggableCourseProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "course",
    item: { courseId: course.id, status },
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
            {status !== "completed" && <GripVertical className="h-4 w-4 text-gray-400" />}
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
  onDrop: (courseId: string, toStatus: "assigned" | "available") => void;
  children: React.ReactNode;
  title: string;
  count: number;
  icon: React.ReactNode;
}

const DropZone = ({ status, onDrop, children, title, count, icon }: DropZoneProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "course",
    drop: (item: { courseId: string; status: "assigned" | "available" | "completed" }) => {
      if (item.status !== status && item.status !== "completed") {
        onDrop(item.courseId, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const getDropZoneStyle = () => {
    const base = "min-h-[400px] p-6 rounded-lg border-2 border-dashed transition-all duration-200";
    if (isOver) {
      return status === "assigned" ? `${base} border-yellow-400 bg-yellow-50` : `${base} border-blue-400 bg-blue-50`;
    }
    return status === "assigned" ? `${base} border-yellow-200 bg-yellow-25` : `${base} border-blue-200 bg-blue-25`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold text-lg flex items-center ${status === "assigned" ? "text-yellow-700" : "text-blue-700"}`}>{icon}{title}</h3>
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

export function StudentAssignmentView({ student, courses, onCourseAssignment }: StudentAssignmentViewProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const programCourses = courses;
  const assignedCourses = programCourses.filter((course) =>
    student.assignedCourses.includes(String(course.id)),
  );
  const completedCourses = programCourses.filter((course) =>
    student.completedCourses.includes(String(course.id)),
  );
  const availableCourses = programCourses.filter(
    (course) =>
      !student.assignedCourses.includes(String(course.id)) &&
      !student.completedCourses.includes(String(course.id))
  );

  const handleCourseDrop = (courseId: string, toStatus: "assigned" | "available") => {
    const isAssigned = toStatus === "assigned";
    onCourseAssignment(student.id, courseId, isAssigned);
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setHasUnsavedChanges(false);
    alert("Cambios guardados exitosamente");
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
              <p className="text-gray-900">{assignedCourses.length}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Cursos Completados:</span>
              <p className="text-gray-900">{completedCourses.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DropZone
          status="assigned"
          onDrop={handleCourseDrop}
          title="Cursos Asignados"
          count={assignedCourses.length}
          icon={<Check className="h-5 w-5 mr-2" />}
        >
          {assignedCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Arrastra cursos aquí para asignar</p>
            </div>
          ) : (
            assignedCourses.map((course) => <DraggableCourse key={course.id} course={course} status="assigned" />)
          )}
        </DropZone>

        <DropZone
          status="available"
          onDrop={handleCourseDrop}
          title="Cursos Disponibles"
          count={availableCourses.length}
          icon={<X className="h-5 w-5 mr-2" />}
        >
          {availableCourses.length === 0 ? (
            <div className="text-center py-12">
              <Check className="h-12 w-12 text-green-300 mx-auto mb-4" />
              <p className="text-gray-500">Todos los cursos están asignados o completados</p>
            </div>
          ) : (
            availableCourses.map((course) => <DraggableCourse key={course.id} course={course} status="available" />)
          )}
        </DropZone>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center text-green-700">
              <Award className="h-5 w-5 mr-2" />
              Cursos Completados
            </h3>
            <Badge variant="outline" className="text-sm">
              {completedCourses.length} cursos
            </Badge>
          </div>

          <div className="min-h-[400px] p-6 rounded-lg border-2 border-solid border-green-200 bg-green-25">
            <div className="space-y-3">
              {completedCourses.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay cursos completados</p>
                </div>
              ) : (
                completedCourses.map((course) => <DraggableCourse key={course.id} course={course} status="completed" />)
              )}
            </div>
          </div>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6">
          <Button onClick={handleSaveChanges} size="lg" className="shadow-lg">
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      )}
    </div>
  );
}
