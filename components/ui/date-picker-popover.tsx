"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "dd/MM/yyyy", { locale: es })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
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
        />
      </PopoverContent>
    </Popover>
  )
}
