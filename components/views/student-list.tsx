"use client"

import { useState, useMemo } from "react"
import type { Student } from "@/services/students"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface StudentListProps {
  students: Student[]
}

export function StudentList({ students }: StudentListProps) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return students.filter((s) => {
      return (
        s.name.toLowerCase().includes(term) ||
        s.carnet.includes(term) ||
        s.program.toLowerCase().includes(term)
      )
    })
  }, [students, search])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estudiantes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Carnet</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead>Especialidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.carnet}</TableCell>
                  <TableCell>{s.program}</TableCell>
                  <TableCell>{s.specialty}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Sin registros
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default StudentList
