import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, RefreshCw } from "lucide-react"
import type { ReportFilters } from "@/components/finanzas/reportes/types"
import { cuotaEstadoLabels, LIMIT_OPTIONS } from "@/components/finanzas/reportes/utils"

interface FiltrosCuotasProps {
  filters: ReportFilters
  onFiltersChange: (updates: Partial<ReportFilters>) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onReset: () => void
  loading: boolean
}

const MONTH_OPTIONS = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

export const FiltrosCuotas = ({
  filters,
  onFiltersChange,
  onSubmit,
  onReset,
  loading,
}: FiltrosCuotasProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap gap-2 rounded-lg bg-muted/50 p-4"
    >
      <Input
        value={filters.search}
        onChange={(event) => onFiltersChange({ search: event.target.value })}
        placeholder="Buscar por estudiante, carnet..."
        className="w-full sm:w-[220px]"
      />
      <Select
        value={filters.estadoCuota}
        onValueChange={(value) => onFiltersChange({ estadoCuota: value })}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Estado cuota" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          {Object.entries(cuotaEstadoLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={filters.fechaInicio || ""}
        onChange={(event) => onFiltersChange({ fechaInicio: event.target.value })}
        placeholder="Fecha inicio"
        className="w-full sm:w-[150px]"
      />
      <Input
        type="date"
        value={filters.fechaFin || ""}
        onChange={(event) => onFiltersChange({ fechaFin: event.target.value })}
        placeholder="Fecha fin"
        className="w-full sm:w-[150px]"
      />
      <Select
        value={filters.mes ? String(filters.mes) : "all"}
        onValueChange={(value) => onFiltersChange({ mes: value === "all" ? "" : value })}
      >
        <SelectTrigger className="w-full sm:w-[120px]">
          <SelectValue placeholder="Mes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {MONTH_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        value={filters.ano || ""}
        onChange={(event) => onFiltersChange({ ano: event.target.value })}
        placeholder="Año"
        min="2020"
        max="2050"
        className="w-full sm:w-[100px]"
      />
      <Select
        value={filters.limit === "all" ? "all" : String(filters.limit)}
        onValueChange={(value) =>
          onFiltersChange({ limit: value === "all" ? "all" : Number(value) })
        }
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Registros" />
        </SelectTrigger>
        <SelectContent>
          {LIMIT_OPTIONS.map(({ label, value }) => (
            <SelectItem key={value} value={String(value)}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onReset}
        disabled={loading}
      >
        Limpiar
      </Button>
    </form>
  )
}
