'use client';

import React, { useState } from "react";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, Plus, Edit, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

type Periodo = {
  nombre: string;
  codigo: string;
  inicio: string;   // ISO date: "YYYY-MM-DD"
  fin: string;      // ISO date
  programas: string;
  descripcion: string;
  cupos: number;
  descuento: number;
  activo: boolean;
  visible: boolean;
  notificaciones: boolean;
  // derivados para mostrar
  estado: 'Activo' | 'Próximo' | 'Finalizado';
  porcentaje: number;
};

const initialPeriodos: Periodo[] = [
  {
    nombre: "Primavera 2025",
    codigo: "PRIM-2025",
    inicio: "2025-02-01",
    fin:    "2025-04-30",
    programas: "Todos",
    descripcion: "",
    cupos: 0,
    descuento: 0,
    activo: false,
    visible: true,
    notificaciones: true,
    estado: "Próximo",
    porcentaje: 0
  },
  {
    nombre: "Verano 2025",
    codigo: "VER-2025",
    inicio: "2025-05-01",
    fin:    "2025-07-31",
    programas: "Maestrías",
    descripcion: "",
    cupos: 0,
    descuento: 0,
    activo: false,
    visible: true,
    notificaciones: true,
    estado: "Próximo",
    porcentaje: 0
  },
  {
    nombre: "Otoño 2025",
    codigo: "OTO-2025",
    inicio: "2025-08-01",
    fin:    "2025-10-31",
    programas: "Diplomados",
    descripcion: "",
    cupos: 0,
    descuento: 0,
    activo: false,
    visible: true,
    notificaciones: true,
    estado: "Próximo",
    porcentaje: 0
  },
  {
    nombre: "Invierno 2025",
    codigo: "INV-2025",
    inicio: "2025-11-01",
    fin:    "2025-12-31",
    programas: "Todos",
    descripcion: "",
    cupos: 0,
    descuento: 0,
    activo: false,
    visible: true,
    notificaciones: true,
    estado: "Próximo",
    porcentaje: 0
  }
];

export default function PeriodosInscripcionPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>(initialPeriodos);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPeriodo, setNewPeriodo] = useState<Periodo>({
    nombre: "",
    codigo: "",
    inicio: "2025-01-01",
    fin:    "2025-01-31",
    programas: "todos",
    descripcion: "",
    cupos: 0,
    descuento: 0,
    activo: true,
    visible: true,
    notificaciones: true,
    estado: "Próximo",
    porcentaje: 0
  });

  const abrirDialog = () => setIsDialogOpen(true);
  const cerrarDialog = () => setIsDialogOpen(false);

  const handleSave = () => {
    const p: Periodo = {
      ...newPeriodo,
      estado: newPeriodo.activo ? "Activo" : "Próximo",
      porcentaje: 0
    };
    setPeriodos([...periodos, p]);
    // reset a valores por defecto si quieres:
    setNewPeriodo({
      ...newPeriodo,
      nombre: "",
      codigo: ""
    });
    cerrarDialog();
  };

  const toggleEstado = (idx: number) => {
    setPeriodos(periodos.map((p, i) =>
      i === idx
        ? {
            ...p,
            activo: p.estado !== "Activo",
            estado: p.estado === "Activo" ? "Próximo" : "Activo"
          }
        : p
    ));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Administración de Periodos de Inscripción" />
      <main className="flex-1 p-4 md:p-6">
        {/* Encabezado + Acción Nuevo */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold">Periodos de Inscripción</h1>
            <p className="text-sm text-muted-foreground">
              Gestione los periodos de inscripción para los diferentes programas académicos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar periodo..." className="pl-8 w-[250px]" />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={abrirDialog} className="gap-1">
                  <Plus className="h-4 w-4" /> Nuevo Periodo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Periodo de Inscripción</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Nombre y Código */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={newPeriodo.nombre}
                        onChange={e => setNewPeriodo({ ...newPeriodo, nombre: e.target.value })}
                        placeholder="Ej: Primavera 2025"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código *</Label>
                      <Input
                        id="codigo"
                        value={newPeriodo.codigo}
                        onChange={e => setNewPeriodo({ ...newPeriodo, codigo: e.target.value })}
                        placeholder="Ej: PRIM-2025"
                      />
                    </div>
                  </div>
                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de Inicio *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newPeriodo.inicio}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            showOutsideDays={false}
                            className="rounded-md border"
                            selected={new Date(newPeriodo.inicio)}
                            required={true}
                            onSelect={(date: Date) =>
                              setNewPeriodo({
                                ...newPeriodo,
                                inicio: date.toISOString().slice(0, 10)
                              })
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Fin *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newPeriodo.fin}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            showOutsideDays={false}
                            className="rounded-md border"
                            selected={new Date(newPeriodo.fin)}
                            required={true}
                            onSelect={(date: Date) =>
                              setNewPeriodo({
                                ...newPeriodo,
                                fin: date.toISOString().slice(0, 10)
                              })
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  {/* Programas, Descripción, Cupos, Descuento */}
                  <div className="space-y-2">
                    <Label>Programas *</Label>
                    <Select
                      value={newPeriodo.programas}
                      onValueChange={val => setNewPeriodo({ ...newPeriodo, programas: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los Programas</SelectItem>
                        <SelectItem value="maestrias">Maestrías</SelectItem>
                        <SelectItem value="diplomados">Diplomados</SelectItem>
                        <SelectItem value="especificos">Específicos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input
                      value={newPeriodo.descripcion}
                      onChange={e => setNewPeriodo({ ...newPeriodo, descripcion: e.target.value })}
                      placeholder="Detalles opcionales…"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cupos Total *</Label>
                      <Input
                        type="number"
                        min={0}
                        value={newPeriodo.cupos}
                        onChange={e => setNewPeriodo({ ...newPeriodo, cupos: +e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descuento (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={newPeriodo.descuento}
                        onChange={e => setNewPeriodo({ ...newPeriodo, descuento: +e.target.value })}
                      />
                    </div>
                  </div>
                  {/* Switches */}
                  <div className="space-y-2">
                    <Label>Opciones</Label>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="activo">Activo</Label>
                        <Switch
                          id="activo"
                          checked={newPeriodo.activo}
                          onCheckedChange={c => setNewPeriodo({ ...newPeriodo, activo: c || false })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="visible">Visible Público</Label>
                        <Switch
                          id="visible"
                          checked={newPeriodo.visible}
                          onCheckedChange={c => setNewPeriodo({ ...newPeriodo, visible: c || false })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="notificaciones">Notificaciones</Label>
                        <Switch
                          id="notificaciones"
                          checked={newPeriodo.notificaciones}
                          onCheckedChange={c => setNewPeriodo({ ...newPeriodo, notificaciones: c || false })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={cerrarDialog}>Cancelar</Button>
                  <Button onClick={handleSave}>Guardar Periodo</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabla de Periodos */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Programas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cupos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodos.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell>{p.inicio}</TableCell>
                    <TableCell>{p.fin}</TableCell>
                    <TableCell>{p.programas}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {p.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{`${p.cupos}/${p.cupos}`}</div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: `${p.porcentaje}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          {/* … detalle igual que antes … */}
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleEstado(i)}
                        >
                          {p.estado === "Activo" ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {periodos.length} periodos
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled>
                Siguiente
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
