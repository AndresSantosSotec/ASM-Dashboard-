"use client"

import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"

interface Curso {
  id: number
  nombre: string
  shortname: string
  estado: string
}

interface CursosMatriculadosCellProps {
  cursos: Curso[]
  maxVisibleItems?: number
}

/**
 * Componente para mostrar lista de cursos matriculados en una celda de tabla
 * 
 * Muestra los cursos en formato de lista vertical con tooltip para ver el nombre completo
 * Diseñado para ser compacto y legible dentro de una tabla
 */
export function CursosMatriculadosCell({ 
  cursos, 
  maxVisibleItems = 3 
}: CursosMatriculadosCellProps) {
  if (!cursos || cursos.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Sin cursos
      </div>
    )
  }

  const cursosVisible = cursos.slice(0, maxVisibleItems)
  const cursosRestantes = cursos.length - maxVisibleItems

  return (
    <TooltipProvider>
      <div className="space-y-1 max-w-xs">
        {cursosVisible.map((curso, index) => (
          <Tooltip key={curso.id || index}>
            <TooltipTrigger asChild>
              <div className="flex items-start gap-1 text-xs cursor-help">
                <BookOpen className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <span className="line-clamp-1 text-left">
                  {curso.nombre}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              align="start"
              className="max-w-sm"
            >
              <div className="space-y-1">
                <p className="font-medium">{curso.nombre}</p>
                {curso.shortname && (
                  <p className="text-xs text-muted-foreground">
                    Código: {curso.shortname}
                  </p>
                )}
                {curso.estado && (
                  <Badge variant="outline" className="text-xs">
                    {curso.estado}
                  </Badge>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {cursosRestantes > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs text-muted-foreground cursor-help pl-4">
                +{cursosRestantes} más...
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-sm">
              <div className="space-y-1">
                <p className="font-medium mb-2">Cursos adicionales:</p>
                {cursos.slice(maxVisibleItems).map((curso, index) => (
                  <div key={curso.id || index} className="text-xs py-0.5">
                    • {curso.nombre}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

/**
 * Variante compacta que muestra solo el badge con la cantidad
 */
export function CursosCountBadge({ 
  cantidad, 
  cursos 
}: { 
  cantidad: number
  cursos?: Curso[]
}) {
  if (!cantidad || cantidad === 0) {
    return <Badge variant="outline" className="text-xs">0 cursos</Badge>
  }

  if (!cursos || cursos.length === 0) {
    return (
      <Badge variant="secondary" className="text-xs">
        {cantidad} {cantidad === 1 ? 'curso' : 'cursos'}
      </Badge>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="text-xs cursor-help">
            {cantidad} {cantidad === 1 ? 'curso' : 'cursos'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm">
          <div className="space-y-1">
            <p className="font-medium mb-2">Cursos matriculados:</p>
            {cursos.map((curso, index) => (
              <div key={curso.id || index} className="text-xs py-0.5">
                • {curso.nombre}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
