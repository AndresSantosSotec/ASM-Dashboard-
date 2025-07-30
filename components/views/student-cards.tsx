"use client";

import { useState, useMemo, useEffect } from "react";
import type { Student } from "@/services/students";
import { StudentCard } from "@/components/cards/student-card";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

import { Search } from "lucide-react";
import type { Course } from "@/services/courses";
import { getAvailableCoursesForStudents } from "@/services/courses";
import { bulkAssignCourses, unassignCourses } from "@/services/students";
import { BulkAssignmentPanel } from "@/components/bulk-assignment-panel";
import { useToast } from "@/components/ui/use-toast";

interface StudentCardsProps {
  students: Student[];
  onViewAssignment: (studentId: string) => void;
}

export function StudentCards({
  students,
  onViewAssignment,
}: StudentCardsProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15); // Valor inicial 15
  const [programFilter, setProgramFilter] = useState("todos");
  const [specialtyFilter, setSpecialtyFilter] = useState("todos");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [bulkCourses, setBulkCourses] = useState<Course[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const { toast } = useToast();

  const programOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.program) set.add(s.program);
    });
    return Array.from(set).sort();
  }, [students]);

  const specialtyOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.specialty) set.add(s.specialty);
    });
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return students.filter((s) => {
      const matchesTerm =
        s.name.toLowerCase().includes(term) ||
        s.carnet.includes(term) ||
        s.program.toLowerCase().includes(term) ||
        s.specialty.toLowerCase().includes(term);

      const matchesProgram =
        programFilter === "todos" || s.program === programFilter;

      const matchesSpecialty =
        specialtyFilter === "todos" || s.specialty === specialtyFilter;

      const matchesDate =
        (!dateStart || new Date(s.startDate ?? "") >= new Date(dateStart)) &&
        (!dateEnd || new Date(s.startDate ?? "") <= new Date(dateEnd));

      return matchesTerm && matchesProgram && matchesSpecialty && matchesDate;
    });
  }, [students, search, programFilter, specialtyFilter, dateStart, dateEnd]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const getVisiblePages = (current: number, total: number) => {
    const delta = 2;
    const range: (number | string)[] = [];
    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);
    range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total - 1) range.push("...");
    if (total > 1) range.push(total);
    return range;
  };

  const visiblePages = useMemo(
    () => getVisiblePages(page, totalPages),
    [page, totalPages],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? students.map((s) => s.id) : []);
  };

  const toggleSelectFiltered = (checked: boolean) => {
    setSelectedIds((prev) => {
      const filteredIds = filtered.map((s) => s.id);
      if (checked) {
        const union = new Set([...prev, ...filteredIds]);
        return Array.from(union);
      }
      return prev.filter((id) => !filteredIds.includes(id));
    });
  };

  const handleCardCheck = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((pid) => pid !== id),
    );
  };

  useEffect(() => {
    if (!showBulkPanel) return;
    setIsBulkLoading(true);
    setBulkError(null);
    getAvailableCoursesForStudents(selectedIds)
      .then(setBulkCourses)
      .catch(() => setBulkError("Error cargando cursos"))
      .finally(() => setIsBulkLoading(false));
  }, [showBulkPanel, selectedIds]);

  const handleBulkAssignment = async (
    studentIds: string[],
    courseIds: string[],
    assign: boolean,
  ) => {
    try {
      if (assign) {
        await bulkAssignCourses(studentIds, courseIds);
        toast({ title: "Asignación exitosa" });
      } else {
        await unassignCourses(studentIds, courseIds);
        toast({ title: "Desasignación exitosa" });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "No se pudo completar la operación",
        variant: "destructive",
      });
    }
  };

  const changePageSize = (value: string) => {
    const size = Number(value);
    if (!isNaN(size)) {
      setPageSize(size);
      setPage(1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por nombre, carnet o abreviatura"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>
          <Select
            value={programFilter}
            onValueChange={(value) => {
              setProgramFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los programas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los programas</SelectItem>
              {programOptions.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={specialtyFilter}
            onValueChange={(value) => {
              setSpecialtyFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todas las especialidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las especialidades</SelectItem>
              {specialtyOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dateStart}
            onChange={(e) => {
              setDateStart(e.target.value);
              setPage(1);
            }}
            className="w-36"
          />
          <Input
            type="date"
            value={dateEnd}
            onChange={(e) => {
              setDateEnd(e.target.value);
              setPage(1);
            }}
            className="w-36"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8">
                Seleccionar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem
                checked={selectedIds.length === students.length}
                onCheckedChange={toggleSelectAll}
              >
                Seleccionar todos
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={
                  filtered.length > 0 &&
                  filtered.every((s) => selectedIds.includes(s.id))
                }
                onCheckedChange={toggleSelectFiltered}
              >
                Seleccionar filtrados
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedIds.length > 0 && (
            <span className="text-sm">{selectedIds.length} seleccionados</span>
          )}
          <span className="text-sm text-muted-foreground">Por página</span>
          <Select value={String(pageSize)} onValueChange={changePageSize}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border p-2 rounded">
          <span className="text-sm font-medium">
            {selectedIds.length} seleccionados
          </span>
          <Button size="sm" onClick={() => setShowBulkPanel(true)}>
            Asignación Masiva
          </Button>
        </div>
      )}

      {showBulkPanel && (
        <BulkAssignmentPanel
          selectedStudents={students.filter((s) => selectedIds.includes(s.id))}
          courses={bulkCourses}
          isLoading={isBulkLoading}
          error={bulkError}
          onBulkAssignment={handleBulkAssignment}
          onClose={() => setShowBulkPanel(false)}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            onViewAssignment={onViewAssignment}
            selected={selectedIds.includes(student.id)}
            onSelectChange={(checked) => handleCardCheck(student.id, !!checked)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="pt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
                className="cursor-pointer"
                aria-disabled={page <= 1}
              />
            </PaginationItem>
            {visiblePages.map((p, idx) =>
              typeof p === "number" ? (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(p);
                    }}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem
                  key={`ellipsis-${idx}`}
                  className="hidden sm:block"
                >
                  <span className="px-2">…</span>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
                className="cursor-pointer"
                aria-disabled={page >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <div className="text-sm text-right text-gray-500">
        Página {page} de {totalPages}
      </div>
    </div>
  );
}

export default StudentCards;
