"use client"

import { useEffect, useState } from 'react'
import { fetchProspectoWithPrograms } from '@/services/prospectoService'
import type { ProspectoConProgramas } from '@/types/prospecto'

export function ProspectoDetail({ id }: { id: number }) {
  const [prospecto, setProspecto] = useState<ProspectoConProgramas | null>(null)

  useEffect(() => {
    fetchProspectoWithPrograms(id).then(setProspecto).catch(console.error)
  }, [id])

  if (!prospecto) return <div>…Cargando prospecto…</div>

  return (
    <div>
      <h1>{prospecto.nombre_completo}</h1>
      <h2>Programas inscritos</h2>
      <ul>
        {prospecto.programas.map(ep => (
          <li key={ep.id}>
            {ep.programa.nombre_del_programa} ({ep.programa.abreviatura})
          </li>
        ))}
      </ul>
    </div>
  )
}
