"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange as ReactDayPickerDateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DateRange {
  from: Date
  to?: Date
}

interface DatePickerWithRangeProps {
  value?: DateRange | ReactDayPickerDateRange | undefined
  onChange?: (range: DateRange | undefined) => void
  className?: string
}

export function DatePickerWithRange({
  className,
  value,
  onChange,
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(
    value ? { from: value.from, to: value.to } : undefined
  )

  React.useEffect(() => {
    if (value) {
      setDate({ from: value.from, to: value.to })
    } else {
      setDate(undefined)
    }
  }, [value])

  const handleSelect = (range: ReactDayPickerDateRange | undefined) => {
    if (range) {
      const newRange: DateRange = {
        from: range.from || new Date(),
        to: range.to,
      }
      setDate(newRange)
      onChange?.(newRange)
    } else {
      setDate(undefined)
      onChange?.(undefined)
    }
  }

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                `${format(date.from, "PPP")} - ${format(date.to, "PPP")}`
              ) : (
                format(date.from, "PPP")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date as ReactDayPickerDateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

