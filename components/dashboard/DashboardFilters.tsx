"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"

interface DashboardFiltersProps {
  onFiltersChange: (filters: FilterValues) => void
  showProgramaFilter?: boolean
  showAsesorFilter?: boolean
  programas?: Array<{ id: number; nombre: string }>
  asesores?: Array<{ id: number; nombre: string }>
}

export interface FilterValues {
  month?: number
  year?: number
  from?: string
  to?: string
  programa_id?: number
  asesor_id?: number
}

const MONTHS = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
]

const generateYears = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i)
  }
  return years
}

export default function DashboardFilters({
  onFiltersChange,
  showProgramaFilter = false,
  showAsesorFilter = false,
  programas = [],
  asesores = [],
}: DashboardFiltersProps) {
  const currentDate = new Date()
  const [filterMode, setFilterMode] = useState<"month" | "range">("month")
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1)
  const [year, setYear] = useState<number>(currentDate.getFullYear())
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [programaId, setProgramaId] = useState<number>()
  const [asesorId, setAsesorId] = useState<number>()

  const handleApplyFilters = () => {
    const filters: FilterValues = {}

    if (filterMode === "month") {
      filters.month = month
      filters.year = year
    } else if (dateRange?.from && dateRange?.to) {
      filters.from = format(dateRange.from, "yyyy-MM-dd")
      filters.to = format(dateRange.to, "yyyy-MM-dd")
    }

    if (programaId) filters.programa_id = programaId
    if (asesorId) filters.asesor_id = asesorId

    onFiltersChange(filters)
  }

  const handleReset = () => {
    setFilterMode("month")
    setMonth(currentDate.getMonth() + 1)
    setYear(currentDate.getFullYear())
    setDateRange(undefined)
    setProgramaId(undefined)
    setAsesorId(undefined)

    onFiltersChange({
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    })
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetear
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Selector de modo de filtro */}
        <div className="space-y-2">
          <Label>Tipo de Filtro</Label>
          <Select value={filterMode} onValueChange={(v) => setFilterMode(v as "month" | "range")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Por Mes</SelectItem>
              <SelectItem value="range">Rango de Fechas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtros de mes/año */}
        {filterMode === "month" && (
          <>
            <div className="space-y-2">
              <Label>Mes</Label>
              <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Año</Label>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateYears().map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Selector de rango de fechas */}
        {filterMode === "range" && (
          <div className="space-y-2 md:col-span-2">
            <Label>Rango de Fechas</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: es })
                    )
                  ) : (
                    <span>Seleccionar rango</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Filtro de programa */}
        {showProgramaFilter && programas.length > 0 && (
          <div className="space-y-2">
            <Label>Programa</Label>
            <Select value={programaId?.toString()} onValueChange={(v) => setProgramaId(v ? parseInt(v) : undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los programas</SelectItem>
                {programas.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Filtro de asesor */}
        {showAsesorFilter && asesores.length > 0 && (
          <div className="space-y-2">
            <Label>Asesor</Label>
            <Select value={asesorId?.toString()} onValueChange={(v) => setAsesorId(v ? parseInt(v) : undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los asesores</SelectItem>
                {asesores.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleApplyFilters} className="w-full md:w-auto">
          Aplicar Filtros
        </Button>
      </div>
    </div>
  )
}
