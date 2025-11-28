"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface MultiSelectOption {
  label: string
  value: string
  icon?: React.ReactNode
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  maxCount?: number
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seleccionar opciones...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  maxCount = 3,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [options, search])

  const selectedOptions = React.useMemo(() => {
    return options.filter((option) => selected.includes(option.value))
  }, [options, selected])

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter((item) => item !== value))
  }

  const displayText = React.useMemo(() => {
    if (selected.length === 0) return placeholder
    if (selected.length <= maxCount) {
      return selectedOptions.map((opt) => opt.label).join(", ")
    }
    return `${selected.length} seleccionados`
  }, [selected.length, selectedOptions, maxCount, placeholder])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10 h-auto py-2 px-3 text-left font-normal",
            selected.length > 0 && "border-primary/50 bg-primary/5",
            className
          )}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 items-center min-h-[1.5rem]">
            {selected.length === 0 ? (
              <span className="text-muted-foreground text-sm">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, maxCount).map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="mr-0 mb-0 px-2 py-0.5 text-xs font-medium cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(option.value, e)
                    }}
                  >
                    <span className="truncate max-w-[120px]">{option.label}</span>
                    <button
                      type="button"
                      className="ml-1.5 rounded-full hover:bg-secondary-foreground/20 p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleRemove(option.value, e as any)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(option.value, e)
                      }}
                      aria-label={`Eliminar ${option.label}`}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
                {selected.length > maxCount && (
                  <Badge variant="secondary" className="mr-0 mb-0 px-2 py-0.5 text-xs font-medium">
                    +{selected.length - maxCount} más
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            className="h-9"
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center flex-1">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1">{option.label}</span>
                      {isSelected && (
                        <span className="text-xs text-muted-foreground ml-2">Seleccionado</span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onChange([])
                      setOpen(false)
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Limpiar selección ({selected.length})
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

