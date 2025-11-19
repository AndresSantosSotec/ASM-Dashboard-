"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerPopoverProps {
  value?: string
  onChange?: (value: string) => void
  fromYear?: number
  toYear?: number
  captionLayout?: "label" | "dropdown" | "dropdown-months"
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function DatePickerPopover({ 
  value, 
  onChange, 
  className, 
  fromYear, 
  toYear, 
  captionLayout = "dropdown", 
  placeholder = "Seleccionar fecha",
  disabled = false
}: DatePickerPopoverProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setDate(value ? new Date(value) : undefined)
  }, [value])

  const handleSelect = (selected: Date | undefined) => {
    setDate(selected)
    onChange?.(selected ? format(selected, "yyyy-MM-dd") : "")
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDate(undefined)
    onChange?.("")
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal transition-all hover:bg-accent hover:border-primary/50",
            !date && "text-muted-foreground",
            date && "border-primary/30",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <CalendarIcon className={cn(
            "mr-2 h-4 w-4 transition-colors",
            date ? "text-primary" : "text-muted-foreground"
          )} />
          {date ? (
            <span className="flex items-center justify-between w-full">
              <span className="font-medium">{format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}</span>
              {!disabled && (
                <X 
                  className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors ml-2" 
                  onClick={handleClear}
                />
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-lg" align="start">
        <div className="border-b px-3 py-2 bg-muted/50">
          <p className="text-sm font-medium text-center">
            {date ? format(date, "MMMM yyyy", { locale: es }) : "Seleccione una fecha"}
          </p>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          weekStartsOn={0}
          locale={es}
          initialFocus
          captionLayout={captionLayout}
          fromYear={fromYear || 1950}
          toYear={toYear || new Date().getFullYear() + 10}
          className="p-3"
        />
        <div className="border-t px-3 py-2 bg-muted/30 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const today = new Date()
              handleSelect(today)
            }}
            className="text-xs"
          >
            Hoy
          </Button>
          {date && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDate(undefined)
                onChange?.("")
                setIsOpen(false)
              }}
              className="text-xs text-destructive hover:text-destructive"
            >
              Limpiar
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
