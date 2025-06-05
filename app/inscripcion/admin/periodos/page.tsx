"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Header } from "@/components/header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { API_BASE_URL } from "@/utils/apiConfig";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CalendarIcon,
  Search,
  Plus,
  Edit,
  FileText,
  Clock as ClockIcon,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const API_DATE = "yyyy-MM-dd";
const pretty = (iso: string) => (iso ? format(parseISO(iso), API_DATE) : "");

function generateCodigo(nombre: string): string {
  const añoMatch = nombre.match(/\d{4}/);
  const year = añoMatch ? añoMatch[0] : format(new Date(), "yyyy");
  const initials = nombre
    .replace(/\d{4}/, "")
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0))
    .join("")
    .slice(0, 4)
    .toUpperCase();
  return `${initials}-${year}`;
}

axios.defaults.baseURL = API_BASE_URL + "/api";

type PeriodoAPI = {
  id: number;
  nombre: string;
  codigo: string;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion: string;
  cupos_total: number;
  descuento: number;
  activo: boolean;
  visible: boolean;
  notificaciones: boolean;
  inscritos_count: number;
  programas: { id: number; abreviatura: string }[];
};

type Periodo = PeriodoAPI & {
  estado: "Activo" | "Finalizado";
  porcentaje: number;
};

export default function PeriodosInscripcionPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [filtered, setFiltered] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] =
    useState<"Todos" | "Activo" | "Finalizado">("Todos");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [mode, setMode] = useState<"create" | "edit" | "view">("create");
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState<PeriodoAPI | null>(null);

  const [form, setForm] = useState<Omit<PeriodoAPI, "id" | "inscritos_count">>({
    nombre: "",
    codigo: "",
    fecha_inicio: format(new Date(), API_DATE),
    fecha_fin: format(new Date(), API_DATE),
    descripcion: "",
    cupos_total: 0,
    descuento: 0,
    activo: true,
    visible: true,
    notificaciones: true,
    programas: [],
  });

  useEffect(() => {
    fetchPeriodos();
  }, []);

  async function fetchPeriodos() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<PeriodoAPI[]>("/periodos");
      const mapped = data.map(p => ({
        ...p,
        estado: p.activo ? ("Activo" as const) : ("Finalizado" as const),
        porcentaje: p.cupos_total
          ? (p.inscritos_count / p.cupos_total) * 100
          : 0,
      }));
      setPeriodos(mapped);
      setFiltered(mapped);
    } catch (e: any) {
      console.error(e);
      setError("No se pudieron cargar los periodos. Revisa tu API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let tmp = [...periodos];
    if (search) {
      tmp = tmp.filter(p =>
        p.nombre.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filterEstado !== "Todos") {
      tmp = tmp.filter(p => p.estado === filterEstado);
    }
    if (dateFrom) {
      const from = parseISO(dateFrom);
      tmp = tmp.filter(p => parseISO(p.fecha_inicio) >= from);
    }
    if (dateTo) {
      const to = parseISO(dateTo);
      tmp = tmp.filter(p => parseISO(p.fecha_fin) <= to);
    }
    setFiltered(tmp);
  }, [search, filterEstado, dateFrom, dateTo, periodos]);

  function openCreate() {
    setMode("create");
    setForm({
      nombre: "",
      codigo: "",
      fecha_inicio: format(new Date(), API_DATE),
      fecha_fin: format(new Date(), API_DATE),
      descripcion: "",
      cupos_total: 0,
      descuento: 0,
      activo: true,
      visible: true,
      notificaciones: true,
      programas: [],
    });
    setActive(null);
    setIsOpen(true);
  }

  function openView(p: PeriodoAPI) {
    setMode("view");
    setActive(p);
    setIsOpen(true);
  }

  function openEdit(p: PeriodoAPI) {
    setMode("edit");
    setActive(p);
    const { id, inscritos_count, ...rest } = p;
    setForm(rest);
    setIsOpen(true);
  }

  async function handleSubmit() {
    try {
      if (mode === "create") {
        await axios.post("/periodos", form);
      } else if (mode === "edit" && active) {
        await axios.put(`/periodos/${active.id}`, form);
      }
      await fetchPeriodos();
      setIsOpen(false);
    } catch (e) {
      console.error(e);
      alert("Error al guardar");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Eliminar este periodo?")) return;
    await axios.delete(`/periodos/${id}`);
    await fetchPeriodos();
  }

  async function handleToggle(p: Periodo) {
    await axios.put(`/periodos/${p.id}`, { activo: !p.activo });
    await fetchPeriodos();
  }

  const badgeStyles: Record<Periodo["estado"], string> = {
    Activo: "bg-green-100 text-green-700 dark:bg-green-800/30",
    Finalizado: "bg-gray-100 text-gray-700 dark:bg-gray-800/30",
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Administración de Periodos de Inscripción" />

      <main className="flex-1 p-4 md:p-6">
        {/* filtros + nuevo */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6 mb-6">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <Select
            value={filterEstado}
            onValueChange={val => setFilterEstado(val as any)}
          >
            <SelectTrigger className="md:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Activo">Activo</SelectItem>
              <SelectItem value="Finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            {[
              { label: "Desde", state: dateFrom, setter: setDateFrom },
              { label: "Hasta", state: dateTo, setter: setDateTo },
            ].map(({ label, state, setter }) => (
              <Popover key={label}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full md:w-auto justify-start"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" /> {label}
                    {state && (
                      <span className="ml-2 text-muted-foreground text-sm">
                        {state}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    locale={es}
                    mode="single"
                    selected={state ? parseISO(state) : undefined}
                    onSelect={d => d && setter(format(d, API_DATE))}
                  />
                </PopoverContent>
              </Popover>
            ))}
          </div>

          <Button
            onClick={openCreate}
            className="md:ml-auto self-start md:self-auto"
          >
            <Plus className="h-4 w-4 mr-2" /> Nuevo Periodo
          </Button>
        </div>

        {/* tabla */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Listado de periodos</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {error && <div className="p-4 text-red-500">{error}</div>}
            <div className="overflow-x-auto text-sm">
              <Table className="min-w-max">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Periodo</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cupos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center">
                        Cargando…
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && filtered.length === 0 && !error && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center">
                        No hay periodos.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map(p => (
                    <TableRow
                      key={p.id}
                      className="even:bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>{p.nombre}</TableCell>
                      <TableCell>{pretty(p.fecha_inicio)}</TableCell>
                      <TableCell>{pretty(p.fecha_fin)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={badgeStyles[p.estado]}
                        >
                          {p.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-64">
                        <div className="mb-1 flex justify-between">
                          <span>
                            {p.inscritos_count}/{p.cupos_total}
                          </span>
                          <span>{Math.round(p.porcentaje)}%</span>
                        </div>
                        <Progress value={p.porcentaje} className="h-1" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openView(p)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(p)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(p.id)}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggle(p)}
                          >
                            {p.activo ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <ClockIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col md:flex-row md:justify-between gap-3 border-t p-4">
            <span className="text-sm text-muted-foreground">
              Mostrando {filtered.length} de {periodos.length} periodos
            </span>
            <div className="flex gap-2 self-end md:self-auto">
              <Button size="sm" variant="outline" disabled>
                Anterior
              </Button>
              <Button size="sm" variant="outline" disabled>
                Siguiente
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>

      {/* modal de formulario */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "create"
                ? "Crear Periodo"
                : mode === "edit"
                ? "Editar Periodo"
                : "Detalle de Periodo"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  disabled={mode === "view"}
                  value={mode === "view" ? active?.nombre ?? "" : form.nombre}
                  onChange={e => {
                    const nombreVal = e.target.value;
                    setForm(f => ({
                      ...f,
                      nombre: nombreVal,
                      codigo: generateCodigo(nombreVal),
                    }));
                  }}
                />
              </div>
              <div>
                <Label>Código</Label>
                <Input
                  disabled
                  value={mode === "view" ? active?.codigo ?? "" : form.codigo}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["fecha_inicio", "fecha_fin"] as const).map((field, i) => {
                const dateStr =
                  mode === "view"
                    ? (active as any)?.[field]
                    : (form as any)[field];
                return (
                  <div key={field}>
                    <Label>{i === 0 ? "Inicio" : "Fin"}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          disabled={mode === "view"}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {pretty(dateStr)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
                        <Calendar
                          locale={es}
                          mode="single"
                          selected={
                            dateStr ? parseISO(dateStr as string) : undefined
                          }
                          onSelect={d => {
                            if (!d) return;
                            setForm(f => ({
                              ...f,
                              [field]: format(d, API_DATE),
                            }));
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                );
              })}
            </div>

            <div>
              <Label>Descripción</Label>
              <Input
                disabled={mode === "view"}
                value={
                  mode === "view"
                    ? active?.descripcion ?? ""
                    : form.descripcion
                }
                onChange={e =>
                  setForm(f => ({ ...f, descripcion: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cupos Total</Label>
                <Input
                  type="number"
                  disabled={mode === "view"}
                  value={
                    mode === "view"
                      ? active?.cupos_total.toString() ?? "0"
                      : form.cupos_total
                  }
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      cupos_total: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Descuento</Label>
                <Input
                  type="number"
                  disabled={mode === "view"}
                  value={
                    mode === "view"
                      ? active?.descuento.toString() ?? "0"
                      : form.descuento
                  }
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      descuento: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="visible"
                  checked={form.visible}
                  disabled={mode === "view"}
                  onCheckedChange={checked =>
                    setForm(f => ({ ...f, visible: checked }))
                  }
                />
                <Label htmlFor="visible">Visible</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="notificaciones"
                  checked={form.notificaciones}
                  disabled={mode === "view"}
                  onCheckedChange={checked =>
                    setForm(f => ({ ...f, notificaciones: checked }))
                  }
                />
                <Label htmlFor="notificaciones">Notificaciones</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cerrar
            </Button>
            {mode !== "view" && (
              <Button onClick={handleSubmit}>
                {mode === "create" ? "Crear" : "Guardar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
