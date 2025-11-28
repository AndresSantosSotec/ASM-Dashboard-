"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DateRange {
  from: Date
  to?: Date
}

interface SimpleDateRangePickerProps {
  value?: DateRange | undefined
  onChange?: (range: DateRange | undefined) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function SimpleDateRangePicker({
  className,
  value,
  onChange,
  placeholder = "Seleccionar rango",
  disabled = false,
}: SimpleDateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempFrom, setTempFrom] = React.useState<string>(
    value?.from ? format(value.from, "yyyy-MM-dd") : ""
  )
  const [tempTo, setTempTo] = React.useState<string>(
    value?.to ? format(value.to, "yyyy-MM-dd") : ""
  )

  React.useEffect(() => {
    if (value?.from) {
      setTempFrom(format(value.from, "yyyy-MM-dd"))
    } else {
      setTempFrom("")
    }
    if (value?.to) {
      setTempTo(format(value.to, "yyyy-MM-dd"))
    } else {
      setTempTo("")
    }
  }, [value])

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value
    setTempFrom(dateStr)
    if (dateStr && tempTo) {
      const fromDate = new Date(dateStr + "T00:00:00")
      const toDate = new Date(tempTo + "T00:00:00")
      if (fromDate <= toDate) {
        onChange?.({ from: fromDate, to: toDate })
      }
    } else if (dateStr) {
      const fromDate = new Date(dateStr + "T00:00:00")
      onChange?.({ from: fromDate })
    }
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value
    setTempTo(dateStr)
    if (dateStr && tempFrom) {
      const fromDate = new Date(tempFrom + "T00:00:00")
      const toDate = new Date(dateStr + "T00:00:00")
      if (fromDate <= toDate) {
        onChange?.({ from: fromDate, to: toDate })
        setIsOpen(false)
      }
    } else if (dateStr && !tempFrom) {
      // Si solo hay "to" sin "from", establecer "from" igual a "to"
      const toDate = new Date(dateStr + "T00:00:00")
      setTempFrom(dateStr)
      onChange?.({ from: toDate, to: toDate })
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setTempFrom("")
    setTempTo("")
    onChange?.(undefined)
  }

  const displayValue = tempFrom && tempTo
    ? `${format(new Date(tempFrom + "T00:00:00"), "dd/MM/yyyy", { locale: es })} - ${format(new Date(tempTo + "T00:00:00"), "dd/MM/yyyy", { locale: es })}`
    : tempFrom
    ? format(new Date(tempFrom + "T00:00:00"), "dd/MM/yyyy", { locale: es })
    : placeholder

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10 transition-all hover:bg-accent hover:border-primary/50",
            !tempFrom && "text-muted-foreground",
            tempFrom && "border-primary/30",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <CalendarIcon className={cn(
            "mr-2 h-4 w-4 shrink-0 transition-colors",
            tempFrom ? "text-primary" : "text-muted-foreground"
          )} />
          <span className="flex-1 text-left truncate font-medium">
            {displayValue}
          </span>
          {tempFrom && !disabled && (
            <X 
              className="h-4 w-4 shrink-0 text-muted-foreground hover:text-destructive transition-colors ml-2" 
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 shadow-lg" align="start">
        <div className="space-y-4 min-w-[280px]">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha desde</label>
            <Input
              type="date"
              value={tempFrom}
              onChange={handleFromChange}
              className="w-full"
              max={tempTo || undefined}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha hasta</label>
            <Input
              type="date"
              value={tempTo}
              onChange={handleToChange}
              className="w-full"
              min={tempFrom || undefined}
            />
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                const today = new Date()
                const lastWeek = new Date()
                lastWeek.setDate(today.getDate() - 7)
                setTempFrom(format(lastWeek, "yyyy-MM-dd"))
                setTempTo(format(today, "yyyy-MM-dd"))
                onChange?.({ from: lastWeek, to: today })
                setIsOpen(false)
              }}
            >
              Últimos 7 días
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                const today = new Date()
                const lastMonth = new Date()
                lastMonth.setMonth(today.getMonth() - 1)
                setTempFrom(format(lastMonth, "yyyy-MM-dd"))
                setTempTo(format(today, "yyyy-MM-dd"))
                onChange?.({ from: lastMonth, to: today })
                setIsOpen(false)
              }}
            >
              Último mes
            </Button>
          </div>
          {tempFrom && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-destructive hover:text-destructive"
              onClick={handleClear}
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
