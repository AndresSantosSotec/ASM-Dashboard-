"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { calculateAssignmentScore } from "@/utils/prospect-utils"

interface Advisor {
  id: string
  name: string
  specialties: string[]
  currentLoad: number
  maxLoad: number
  performance: number
  language: string
}

interface Prospect {
  id: string
  name: string
  interestedArea: string
  status: string
  assignedTo?: string
  preferredLanguage: string
}

export function LeadAssignment() {
  const [advisors, setAdvisors] = useState<Advisor[]>([
    {
      id: "1",
      name: "Juan Pérez",
      specialties: ["BBA", "IMBA"],
      currentLoad: 5,
      maxLoad: 10,
      performance: 85,
      language: "Español",
    },
    {
      id: "2",
      name: "María García",
      specialties: ["Medicina", "Ciencias"],
      currentLoad: 3,
      maxLoad: 8,
      performance: 92,
      language: "Español",
    },
  ])

  const [prospects, setProspects] = useState<Prospect[]>([
    {
      id: "1",
      name: "Carlos Ruiz",
      interestedArea: "MBA",
      status: "Pendiente",
      preferredLanguage: "Español",
    },
    {
      id: "2",
      name: "Ana López",
      interestedArea: "BBACM",
      status: "Pendiente",
      preferredLanguage: "Español",
    },
  ])

  const [assignments, setAssignments] = useState<{ prospectId: string; advisorId: string }[]>([])

  const handleAutoAssign = () => {
    const unassignedProspects = prospects.filter((p) => !assignments.find((a) => a.prospectId === p.id))

    unassignedProspects.forEach((prospect) => {
      const advisorScores = advisors.map((advisor) => ({
        advisorId: advisor.id,
        score: calculateAssignmentScore(advisor, prospect),
      }))

      const bestMatch = advisorScores.reduce((prev, current) => (current.score > prev.score ? current : prev))

      if (bestMatch.score > 0) {
        setAssignments((prev) => [
          ...prev,
          {
            prospectId: prospect.id,
            advisorId: bestMatch.advisorId,
          },
        ])
      }
    })
  }

  const handleViewAssignments = () => {
    console.log("Viewing current assignments:", assignments)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asignaciones Actuales</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleViewAssignments}>Ver Asignaciones</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Asignación Automática</CardTitle>
            <Button onClick={handleAutoAssign}>Actualizar Asignaciones</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prospecto</TableHead>
                <TableHead>Área de Interés</TableHead>
                <TableHead>Asesor Asignado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prospects.map((prospect) => {
                const assignment = assignments.find((a) => a.prospectId === prospect.id)
                const assignedAdvisor = advisors.find((a) => a.id === assignment?.advisorId)

                return (
                  <TableRow key={prospect.id}>
                    <TableCell>{prospect.name}</TableCell>
                    <TableCell>{prospect.interestedArea}</TableCell>
                    <TableCell>{assignedAdvisor ? assignedAdvisor.name : "Sin asignar"}</TableCell>
                    <TableCell>
                      <Badge variant={assignment ? "success" : "secondary"}>
                        {assignment ? "Asignado" : "Pendiente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

