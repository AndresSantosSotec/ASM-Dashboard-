"use client"

import { useState, useEffect } from "react"
import { Calendar } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface FiltroFechaRangoProps {
  label: string
  valueDesde: string
  valueHasta: string
  onChangeDesde: (value: string) => void
  onChangeHasta: (value: string) => void
  onClear?: () => void
  className?: string
}

/**
 * 📅 Componente de filtro de rango de fechas
 * Permite seleccionar una fecha inicial (desde) y una fecha final (hasta)
 */
export default function FiltroFechaRango({
  label,
  valueDesde,
  valueHasta,
  onChangeDesde,
  onChangeHasta,
  onClear,
  className = "",
}: FiltroFechaRangoProps) {
  const [desdeLocal, setDesdeLocal] = useState(valueDesde)
  const [hastaLocal, setHastaLocal] = useState(valueHasta)

  useEffect(() => {
    setDesdeLocal(valueDesde)
  }, [valueDesde])

  useEffect(() => {
    setHastaLocal(valueHasta)
  }, [valueHasta])

  const handleClear = () => {
    setDesdeLocal("")
    setHastaLocal("")
    onChangeDesde("")
    onChangeHasta("")
    onClear?.()
  }

  const hasValue = desdeLocal || hastaLocal

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {label}
        </Label>
        {hasValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Limpiar
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${label}-desde`} className="text-xs text-muted-foreground">
            Desde
          </Label>
          <Input
            id={`${label}-desde`}
            type="date"
            value={desdeLocal}
            onChange={(e) => {
              setDesdeLocal(e.target.value)
              onChangeDesde(e.target.value)
            }}
            max={hastaLocal || undefined}
            className="h-9 text-sm"
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${label}-hasta`} className="text-xs text-muted-foreground">
            Hasta
          </Label>
          <Input
            id={`${label}-hasta`}
            type="date"
            value={hastaLocal}
            onChange={(e) => {
              setHastaLocal(e.target.value)
              onChangeHasta(e.target.value)
            }}
            min={desdeLocal || undefined}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {hasValue && (
        <div className="text-xs text-muted-foreground">
          {desdeLocal && hastaLocal ? (
            <>
              Del <span className="font-medium">{new Date(desdeLocal).toLocaleDateString()}</span> al{" "}
              <span className="font-medium">{new Date(hastaLocal).toLocaleDateString()}</span>
            </>
          ) : desdeLocal ? (
            <>
              Desde <span className="font-medium">{new Date(desdeLocal).toLocaleDateString()}</span>
            </>
          ) : (
            <>
              Hasta <span className="font-medium">{new Date(hastaLocal).toLocaleDateString()}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
