// src/components/componentesAcademico/ProgramCard.tsx
"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Clock, DollarSign } from "lucide-react"
import { Programa } from "./types"
import { Progress } from "@/components/ui/progress"

interface Props {
  program: Programa
  onClick: () => void
}

export default function ProgramCard({ program, onClick }: Props) {
  const statusBadge = program.activo
    ? (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300">
        Activo
      </Badge>
    )
    : (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300">
        Inactivo
      </Badge>
    )

  const occupied = program.totalSpots
    ? ((program.totalSpots - (program.availableSpots ?? 0)) / program.totalSpots) * 100
    : 0

  return (
    <Card onClick={onClick} className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 flex justify-between">
        <CardTitle className="text-lg">{program.nombre}</CardTitle>
        {statusBadge}
      </CardHeader>
      <CardContent className="pb-2 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span>{program.level ?? "—"} • {program.modality ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{program.meses} meses</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{program.availableSpots ?? "?"} / {program.totalSpots ?? "?"} cupos</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>${program.cost?.toLocaleString() ?? "—"}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {program.totalSpots
          ? (
            <div className="w-full">
              <div className="text-xs text-muted-foreground mb-1">Ocupación de cupos</div>
              <Progress value={occupied} className="h-2" />
            </div>
          )
          : null}
      </CardFooter>
    </Card>
  )
}
