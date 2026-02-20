"use client"

import { useState, useEffect } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  setYear,
  setMonth
} from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

interface SimpleDatePickerProps {
  value?: string // formato "YYYY-MM-DD"
  onChange: (value: string) => void
  placeholder?: string
}

export function SimpleDatePicker({ value, onChange, placeholder = "Seleccionar fecha" }: SimpleDatePickerProps) {

  // Validación segura del valor recibido
  const parsed = value ? new Date(value + "T00:00:00") : null
  const selectedDate =
    parsed instanceof Date && !isNaN(parsed.getTime()) ? parsed : null

  // Estado del Popover
  const [open, setOpen] = useState(false)

  // Estado del mes mostrado en el calendario
  const initialParsed = value ? new Date(value + "T00:00:00") : null
  const [currentMonth, setCurrentMonth] = useState(
    initialParsed && !isNaN(initialParsed.getTime())
      ? initialParsed
      : new Date()
  )

  // 🔧 FIX: Sincronizar currentMonth cuando cambia el prop value
  // Esto permite que al editar una fecha, el calendario muestre el mes correcto
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00")
      if (!isNaN(d.getTime())) {
        setCurrentMonth(d)
      }
    }
  }, [value])

  // Cálculos del mes
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  // Lista de años desde 1920 hasta el año siguiente (permite agendar a futuro)
  const currentYear = new Date().getFullYear()
  const maxYear = currentYear + 2 // Permitir hasta 2 años en el futuro
  const years = Array.from({ length: maxYear - 1920 + 1 }, (_, i) => maxYear - i)

  // Lista de meses
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const handleYearChange = (yearStr: string) => {
    const newDate = setYear(currentMonth, parseInt(yearStr))
    setCurrentMonth(newDate)
  }

  const handleMonthChange = (monthStr: string) => {
    const newDate = setMonth(currentMonth, parseInt(monthStr))
    setCurrentMonth(newDate)
  }

  const handleSelectDate = (day: Date, e?: React.MouseEvent) => {
    // 💡 FIX EVENT BUBBLING: Evitar que el click se propague al Dialog padre y cause cierres/comportamientos anómalos
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const formatted = format(day, "yyyy-MM-dd")
    onChange(formatted)
    setOpen(false)
  }

  const displayValue = selectedDate
    ? format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })
    : placeholder

  return (
    // 💡 FIX PORTAL: `modal={true}` asegura que el Popover controle su propio Focus Trap y z-index context, aislando el comportamiento del Dialog padre
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button" // Previene submit de formularios
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>

      {/* 💡 FIX Z-INDEX: Asignar un z-index extremadamente alto para garantizar que renderice sobre el Dialog modal */}
      <PopoverContent className="w-auto p-0 z-[9999]" align="start" onInteractOutside={(e) => {
        // Allow clicks on Select popups inside this date picker without closing it
        const target = e.target as HTMLElement
        if (target.closest('[role="listbox"]') || target.closest('[role="option"]')) {
          e.preventDefault()
        }
      }}>
        <div className="p-3">

          {/* Selectores de mes y año */}
          <div className="flex gap-2 mb-3">
            <Select value={currentMonth.getMonth().toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              {/* 💡 FIX Z-INDEX: Elevar los dropdowns interiores por encima del Popover Content */}
              <SelectContent className="z-[10000]">
                {months.map((month, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={currentMonth.getFullYear().toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] z-[10000]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Header navegación */}
          <div className="flex justify-between items-center mb-3">
            <Button type="button" variant="outline" size="icon" onClick={prevMonth} className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold text-sm">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </div>
            <Button type="button" variant="outline" size="icon" onClick={nextMonth} className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
              <div key={day} className="text-center text-xs font-medium py-2 text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">

            {/* Espacios vacíos antes del 1 */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}

            {monthDays.map((day) => {
              const isCurr = isSameMonth(day, currentMonth)
              const isTod = isToday(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <Button
                  type="button"
                  key={day.toString()}
                  variant="ghost"
                  className={`h-9 w-9 p-0 font-normal ${!isCurr ? "text-gray-400" : ""
                    } ${isTod ? "bg-blue-100 text-blue-900" : ""} ${isSelected ? "bg-blue-600 text-white hover:bg-blue-700" : ""
                    }`}
                  // 💡 FIX EVENT BUBBLING: Pasar el evento e
                  onClick={(e) => handleSelectDate(day, e)}
                >
                  {format(day, "d")}
                </Button>
              )
            })}
          </div>

          {/* Botón Hoy */}
          <div className="mt-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="sm"
              // 💡 FIX EVENT BUBBLING: Pasar el evento e aquí también
              onClick={(e) => handleSelectDate(new Date(), e)}
            >
              Hoy
            </Button>
          </div>

        </div>
      </PopoverContent>
    </Popover>
  )
}
