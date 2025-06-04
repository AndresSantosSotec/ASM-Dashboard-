// src/components/componentesAcademico/ProgramList.tsx
"use client"

import { School } from "lucide-react"
import ProgramCard from "./ProgramCard"
import { Programa } from "./types"

interface Props {
  programs: Programa[]
  selectProgram: (p: Programa) => void
}

export default function ProgramList({ programs, selectProgram }: Props) {
  if (!programs.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <School className="mx-auto h-12 w-12 opacity-30 mb-2" />
        <p>No se encontraron programas académicos</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {programs.map((program) => (
        <ProgramCard key={program.id} program={program} onClick={() => selectProgram(program)} />
      ))}
    </div>
  )
}
