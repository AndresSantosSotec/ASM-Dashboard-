"use client"

import { useState, useMemo } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface Props {
  countries: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function CountryCombobox({
  countries,
  value,
  onChange,
  placeholder = "Seleccione",
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(
    () =>
      countries.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase()),
      ),
    [countries, search],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full"
        >
          {value ? value : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar país"
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No hay resultados.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {filtered.map((c) => (
                <CommandItem
                  key={c}
                  value={c}
                  onSelect={(v) => {
                    onChange(v)
                    setOpen(false)
                  }}
                >
                  {c}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === c ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
