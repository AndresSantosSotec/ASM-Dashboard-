"use client"

import { useState, useMemo } from "react"
import type { Student } from "@/services/students"
import { StudentCard } from "@/components/cards/student-card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { Search } from "lucide-react"

interface StudentCardsProps {
  students: Student[]
  onViewAssignment: (studentId: string) => void
}

export function StudentCards({ students, onViewAssignment }: StudentCardsProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [programFilter, setProgramFilter] = useState("")

  const programOptions = useMemo(() => {
    const set = new Set<string>()
    students.forEach((s) => {
      if (s.program) set.add(s.program)
    })
    return Array.from(set).sort()
  }, [students])


  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return students.filter((s) => {

      const matchesTerm =
        s.name.toLowerCase().includes(term) ||
        s.carnet.includes(term) ||
        s.program.toLowerCase().includes(term)
      const matchesProgram =
        programFilter === "" || s.program === programFilter
      return matchesTerm && matchesProgram
    })
  }, [students, search, programFilter])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const changePageSize = (value: string) => {
    const size = Number(value)
    if (!isNaN(size)) {
      setPageSize(size)
      setPage(1)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-1 gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por nombre o carnet"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-8"
            />
          </div>
          <Select
            value={programFilter}
            onValueChange={(value) => {
              setProgramFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los programas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los programas</SelectItem>
              {programOptions.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Por página</span>
          <Select value={String(pageSize)} onValueChange={changePageSize}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            isSelected={false}
            onSelect={() => {}}
            onViewAssignment={onViewAssignment}
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
                  e.preventDefault()
                  setPage((p) => Math.max(1, p - 1))
                }}
                className="cursor-pointer"
                aria-disabled={page <= 1}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={(e) => {
                    e.preventDefault()
                    setPage(p)
                  }}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setPage((p) => Math.min(totalPages, p + 1))
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
  )
}

export default StudentCards
