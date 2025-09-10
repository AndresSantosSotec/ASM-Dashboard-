"use client"

import { useEffect, useState } from "react"
import { Search, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Student, fetchEnrolledStudents, inactivateStudents } from "@/services/students"

export default function InactivarEstudiantes() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchEnrolledStudents()
      .then(setStudents)
      .catch((err) => console.error(err))
  }, [])

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.carnet.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filtered.map((s) => s.id) : [])
  }

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((p) => p !== id)
    )
  }

  const handleInactivate = async () => {
    if (selectedIds.length === 0) return
    setLoading(true)
    try {
      await inactivateStudents(selectedIds)
      toast({ title: "Estudiantes inactivados" })
      setSelectedIds([])
      // Optionally reload students
      const data = await fetchEnrolledStudents()
      setStudents(data)
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "No se pudo inactivar estudiantes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Inactivar Estudiantes</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={handleInactivate} disabled={loading || selectedIds.length === 0}>
              <Ban className="mr-2 h-4 w-4" />
              {loading ? "Procesando..." : "Inactivar Seleccionados"}
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Carnet</TableHead>
                <TableHead>Programa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(s.id)}
                      onCheckedChange={(checked) => toggleSelectOne(s.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.carnet}</TableCell>
                  <TableCell>{s.program}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
