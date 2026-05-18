"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, Search, Eraser, Filter as FilterIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { fetchPrograms, Program } from '@/services/programs';

interface FilterState {
  search: string;
  program: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  minAmount: string;
  maxAmount: string;
  status: string;
}

const initialFilters: FilterState = {
  search: '',
  program: 'all',
  startDate: undefined,
  endDate: undefined,
  minAmount: '',
  maxAmount: '',
  status: 'all'
};

const Filters = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const data = await fetchPrograms();
        setPrograms(data);
      } catch (error) {
        console.error("Error loading programs for filters:", error);
      }
    };
    loadPrograms();
  }, []);

  const handleApplyFilters = () => {
    setIsLoading(true);
    console.log("Applying standardized filters:", filters);
    // Aquí iría la lógica para emitir los filtros al componente padre o refrescar datos
    setTimeout(() => setIsLoading(false), 800);
  };

  const handleReset = () => {
    setFilters(initialFilters);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Búsqueda General */}
        <div className="space-y-2">
          <Label htmlFor="search">Búsqueda General</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              id="search"
              placeholder="Nombre, Carnet o Boleta..." 
              className="pl-9"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
        </div>

        {/* Programa/Curso */}
        <div className="space-y-2">
          <Label htmlFor="program">Programa / Carrera</Label>
          <Select 
            value={filters.program} 
            onValueChange={(val) => setFilters({...filters, program: val})}
          >
            <SelectTrigger id="program">
              <SelectValue placeholder="Seleccionar programa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los programas</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.nombre_del_programa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rango de Fechas */}
        <div className="space-y-2">
          <Label>Fecha Inicio</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? format(filters.startDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(date) => setFilters({...filters, startDate: date})}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Fecha Fin</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? format(filters.endDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(date) => setFilters({...filters, endDate: date})}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Rango de Montos */}
        <div className="space-y-2">
          <Label htmlFor="minAmount">Monto Mínimo (Q)</Label>
          <Input 
            id="minAmount"
            type="number" 
            placeholder="0.00"
            value={filters.minAmount}
            onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAmount">Monto Máximo (Q)</Label>
          <Input 
            id="maxAmount"
            type="number" 
            placeholder="99999.00"
            value={filters.maxAmount}
            onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
          />
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor="status">Estado de Pago</Label>
          <Select 
            value={filters.status} 
            onValueChange={(val) => setFilters({...filters, status: val})}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="overdue">Mora</SelectItem>
              <SelectItem value="reconciled">Conciliado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Acciones */}
        <div className="flex items-end gap-2">
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={handleApplyFilters}
            disabled={isLoading}
          >
            <FilterIcon className="mr-2 h-4 w-4" />
            {isLoading ? "Aplicando..." : "Aplicar Filtros"}
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleReset}
            title="Limpiar filtros"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Filters;