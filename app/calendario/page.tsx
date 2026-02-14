"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday, setYear, setMonth as setMonthFn,} from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {  Select,  SelectContent,  SelectItem,  SelectTrigger,  SelectValue,} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, Plus, Trash2, Edit, CalendarIcon, Bell,} from "lucide-react";

import {api} from "@/services/api"; 
import Swal from "sweetalert2";

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipo: "reunion" | "tarea" | "recordatorio" | "llamada";
  completada: boolean;
}

interface Cita {
  id: string;
  datecita: string;
  descricita: string;
  nombre_prospecto?: string;
  email_prospecto?: string;
  telefono_prospecto?: string;
}

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [citaModalOpen, setCitaModalOpen] = useState(false);
  const [dayActivitiesModalOpen, setDayActivitiesModalOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [selectedDayActivities, setSelectedDayActivities] = useState<{
    date: Date;
    items: Array<{ kind: 'tarea' | 'cita'; item: Tarea | Cita }>;
  } | null>(null);

  const [nuevaTarea, setNuevaTarea] = useState<Partial<Tarea>>({
    titulo: "",
    descripcion: "",
    fecha: "",
    horaInicio: "09:00",
    horaFin: "10:00",
    tipo: "tarea",
    completada: false,
  });

  const [token, setToken] = useState<string | null>(null);
  const [loadingTareas, setLoadingTareas] = useState(true);
  const [loadingCitas, setLoadingCitas] = useState(true);
  const [upcomingAlerts, setUpcomingAlerts] = useState<Array<{id: string; titulo: string; fecha: string; horaInicio: string; tipo: string}>>([]);
  const [showAlerts, setShowAlerts] = useState(false);

  const colorTipoTarea = {
    reunion: "bg-blue-100 text-blue-800 border-blue-200",
    tarea: "bg-purple-100 text-purple-800 border-purple-200",
    recordatorio: "bg-yellow-100 text-yellow-800 border-yellow-200",
    llamada: "bg-green-100 text-green-800 border-green-200",
  };

  // --- Auth token ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  // Helper: normalizar datos de tarea del backend (snake_case) al frontend (camelCase)
  const normalizeTarea = (t: any): Tarea => ({
    id: t.id?.toString() || "",
    titulo: t.titulo || "",
    descripcion: t.descripcion || "",
    fecha: t.fecha || "",
    horaInicio: (t.horaInicio || t.hora_inicio || "09:00").substring(0, 5),
    horaFin: (t.horaFin || t.hora_fin || "10:00").substring(0, 5),
    tipo: t.tipo || "tarea",
    completada: !!t.completada,
  });

  // --- Fetch tareas ---
  useEffect(() => {
    if (!token) return;
    setLoadingTareas(true);
    api
      .get("/tareas", {
        withCredentials: true,
      })
      .then((res) => {
        const rawTareas = Array.isArray(res.data.data) ? res.data.data : [];
        setTareas(rawTareas.map(normalizeTarea));
      })
      .catch(console.error)
      .finally(() => setLoadingTareas(false));
  }, [token]);

  // --- Fetch citas ---
  useEffect(() => {
    if (!token) return;
    setLoadingCitas(true);
    api
      .get("/citas")
      .then((res) => {
        const arr = Array.isArray(res.data) ? res.data : res.data.data || [];
        setCitas(arr);
      })
      .catch(console.error)
      .finally(() => setLoadingCitas(false));
  }, [token]);

  // --- Alerta de eventos próximos (próximas 24 horas) ---
  useEffect(() => {
    if (tareas.length === 0 && citas.length === 0) return;
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcoming: typeof upcomingAlerts = [];

    tareas.forEach((t) => {
      if (t.completada) return;
      const tareaDate = parseISO(t.fecha);
      // Componer la fecha+hora completa
      const [hh, mm] = (t.horaInicio || "09:00").split(":").map(Number);
      const tareaDateTime = new Date(tareaDate.getFullYear(), tareaDate.getMonth(), tareaDate.getDate(), hh, mm);
      if (tareaDateTime >= now && tareaDateTime <= in24h) {
        upcoming.push({ id: t.id, titulo: t.titulo, fecha: t.fecha, horaInicio: t.horaInicio || "09:00", tipo: t.tipo });
      }
    });

    citas.forEach((c) => {
      const citaDate = parseISO(c.datecita);
      if (citaDate >= now && citaDate <= in24h) {
        upcoming.push({ id: c.id, titulo: c.descricita, fecha: c.datecita, horaInicio: format(citaDate, "HH:mm"), tipo: "cita" });
      }
    });

    setUpcomingAlerts(upcoming);

    // Mostrar notificación si hay eventos próximos (solo la primera vez)
    if (upcoming.length > 0) {
      const eventList = upcoming.slice(0, 5).map(e => 
        `• ${e.horaInicio} - ${e.titulo}`
      ).join("\n");
      
      Swal.fire({
        icon: "info",
        title: `🔔 ${upcoming.length} evento(s) próximo(s)`,
        html: `<div class="text-left"><p class="mb-2">Tienes eventos en las próximas 24 horas:</p><pre class="text-sm bg-gray-50 p-2 rounded">${eventList}</pre></div>`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 6000,
        timerProgressBar: true,
      });
    }
  }, [tareas, citas]);

  // --- Calendar helpers ---
  const calendarYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i); // 2 años atrás, 2 adelante
  const calendarMonths = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // --- Calendar days ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // --- Helpers ---
  const getTareasForDate = (d: Date) =>
    tareas.filter((t) => isSameDay(parseISO(t.fecha), d));
  const getCitasForDate = (d: Date) =>
    citas.filter((c) => isSameDay(parseISO(c.datecita), d));

  // --- Handlers: open modals ---
  const openNewTareaModal = (d: Date) => {
    setSelectedDate(d);
    setSelectedTarea(null);
    setNuevaTarea({
      titulo: "",
      descripcion: "",
      fecha: d.toISOString(),
      horaInicio: "09:00",
      horaFin: "10:00",
      tipo: "tarea",
      completada: false,
    });
    setModalOpen(true);
  };
  const openEditTareaModal = (t: Tarea) => {
    setSelectedTarea(t);
    setNuevaTarea({ ...t });
    setModalOpen(true);
  };
  const openTareaDetails = (t: Tarea) => {
    setSelectedTarea(t);
    setDetailsModalOpen(true);
  };
  const openCitaDetails = (c: Cita) => {
    setSelectedCita(c);
    setCitaModalOpen(true);
  };

  const openDayActivities = (day: Date, items: Array<{ kind: 'tarea' | 'cita'; item: Tarea | Cita }>) => {
    setSelectedDayActivities({ date: day, items });
    setDayActivitiesModalOpen(true);
  };

  // --- Handlers: API calls ---
  const preparePayload = () => ({
    titulo: nuevaTarea.titulo,
    descripcion: nuevaTarea.descripcion,
    fecha: nuevaTarea.fecha,
    hora_inicio: nuevaTarea.horaInicio,
    hora_fin: nuevaTarea.horaFin,
    tipo: nuevaTarea.tipo,
    completada: nuevaTarea.completada,
  });

  const saveTarea = async () => {
    if (!nuevaTarea.titulo || !nuevaTarea.fecha || !token) return;
    const payload = preparePayload();
    try {
      if (selectedTarea) {
        const res = await api.put(
          `/tareas/${selectedTarea.id}`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
        setTareas((prev) =>
          prev.map((t) =>
            t.id === selectedTarea.id ? normalizeTarea(res.data.data) : t
          )
        );
      } else {
        const res = await api.post(
          "/tareas",
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
        setTareas((prev) => [...prev, normalizeTarea(res.data.data)]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTarea = async (id: string) => {
    if (!token) return;
    try {
      await api.delete(`/tareas/${id}`, {
        withCredentials: true,
      });
      setTareas((prev) => prev.filter((t) => t.id !== id));
      setDetailsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComplete = async (id: string) => {
    const t = tareas.find((x) => x.id === id);
    if (!t || !token) return;
    try {
      const res = await api.put(
        `/tareas/${id}`,
        { completada: !t.completada },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      setTareas((prev) =>
        prev.map((x) => (x.id === id ? normalizeTarea(res.data.data) : x))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCita = async (id: string) => {
    if (!token) return;
    try {
      await api.delete(`/citas/${id}`);
      setCitas((prev) => prev.filter((x) => x.id !== id));
      setCitaModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-[#1e3a8a] text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">
                Calendario de Tareas y Citas
              </CardTitle>
              <CardDescription className="text-gray-200">
                Gestiona tus tareas y citas en un solo calendario
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Alerta de eventos próximos */}
              {upcomingAlerts.length > 0 && (
                <Popover open={showAlerts} onOpenChange={setShowAlerts}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-yellow-500/20 text-white border-yellow-300/40 hover:bg-yellow-500/30 relative"
                    >
                      <Bell className="h-4 w-4" />
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {upcomingAlerts.length}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-3 border-b bg-yellow-50">
                      <h4 className="font-semibold text-sm">🔔 Eventos próximos (24h)</h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {upcomingAlerts.map((alert) => (
                        <div key={alert.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                          <p className="font-medium text-sm">{alert.titulo}</p>
                          <p className="text-xs text-gray-500">{alert.horaInicio} • {alert.tipo}</p>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={prevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Selectores de mes y año */}
          <div className="mt-4 flex items-center gap-3">
            <Select 
              value={currentDate.getMonth().toString()} 
              onValueChange={(v) => setCurrentDate(setMonthFn(currentDate, parseInt(v)))}
            >
              <SelectTrigger className="w-[140px] bg-white/10 text-white border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {calendarMonths.map((month, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={currentDate.getFullYear().toString()} 
              onValueChange={(v) => setCurrentDate(setYear(currentDate, parseInt(v)))}
            >
              <SelectTrigger className="w-[100px] bg-white/10 text-white border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {calendarYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {/* Mes Vista */}
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
              <div key={d} className="text-center font-medium py-2">
                {d}
              </div>
            ))}
          </div>
          {(loadingTareas || loadingCitas) ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-32 p-2 rounded-md border bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                    <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={i} className="h-32 p-1 bg-gray-50 rounded-md" />
            ))}
            {monthDays.map((day) => {
              const dayT = getTareasForDate(day);
              const dayC = getCitasForDate(day);
              const items = [
                ...dayT.map((t) => ({ kind: "tarea" as const, item: t })),
                ...dayC.map((c) => ({ kind: "cita" as const, item: c })),
              ];
              const toShow = items.slice(0, 3);
              const isCurr = isSameMonth(day, currentDate);
              const isTod = isToday(day);

              return (
                <div
                  key={day.toString()}
                  className={`h-32 p-1 rounded-md border transition-colors ${
                    isCurr ? "bg-white hover:bg-gray-50" : "bg-gray-50 text-gray-400"
                  } ${isTod ? "bg-blue-50" : ""} ${
                    items.length > 0 ? "cursor-pointer" : ""
                  }`}
                  onClick={(e) => {
                    // Solo abrir si se hace click en el fondo del día y hay items
                    if (items.length > 0 && e.target === e.currentTarget) {
                      openDayActivities(day, items);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`inline-block w-6 h-6 text-center rounded-full ${
                        isTod ? "bg-[#1e3a8a] text-white" : ""
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNewTareaModal(day);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                    {toShow.map(({ kind, item }) =>
                      kind === "tarea" ? (
                        <div
                          key={item.id}
                          className={`px-2 py-1 text-xs rounded-md cursor-pointer truncate ${
                            colorTipoTarea[item.tipo]
                          } ${item.completada ? "opacity-60 line-through" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTareaDetails(item);
                          }}
                        >
                          {item.horaInicio} - {item.titulo}
                        </div>
                      ) : (
                        <div
                          key={item.id}
                          className="px-2 py-1 text-xs rounded-md cursor-pointer truncate bg-green-100 text-green-800 border-green-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCitaDetails(item);
                          }}
                        >
                          {format(parseISO(item.datecita), "HH:mm")} -{" "}
                          {item.descricita}
                        </div>
                      )
                    )}
                    {items.length > 3 && (
                      <div 
                        className="text-xs text-center text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDayActivities(day, items);
                        }}
                      >
                        +{items.length - 3} más • Ver todas
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
              <div key={i} className="h-32 p-1 bg-gray-50 rounded-md" />
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nueva / Editar Tarea */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTarea ? "Editar tarea" : "Nueva tarea"}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && !selectedTarea && (
                <span>
                  Agregar tarea para el{" "}
                  {format(selectedDate, "dd/MM/yyyy")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={nuevaTarea.titulo || ""}
                onChange={(e) =>
                  setNuevaTarea({ ...nuevaTarea, titulo: e.target.value })
                }
                placeholder="Título de la tarea"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={nuevaTarea.descripcion || ""}
                onChange={(e) =>
                  setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })
                }
                placeholder="Descripción"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={nuevaTarea.fecha ? format(parseISO(nuevaTarea.fecha), "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      const date = new Date(e.target.value + "T00:00:00");
                      setNuevaTarea({ ...nuevaTarea, fecha: date.toISOString() });
                    }
                  }}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={nuevaTarea.tipo}
                  onValueChange={(v) =>
                    setNuevaTarea({ ...nuevaTarea, tipo: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tarea">Tarea</SelectItem>
                    <SelectItem value="reunion">Reunión</SelectItem>
                    <SelectItem value="llamada">Llamada</SelectItem>
                    <SelectItem value="recordatorio">
                      Recordatorio
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horaInicio">Hora inicio</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="horaInicio"
                    type="time"
                    value={nuevaTarea.horaInicio || ""}
                    onChange={(e) =>
                      setNuevaTarea({ ...nuevaTarea, horaInicio: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="horaFin">Hora fin</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="horaFin"
                    type="time"
                    value={nuevaTarea.horaFin || ""}
                    onChange={(e) =>
                      setNuevaTarea({ ...nuevaTarea, horaFin: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            {selectedTarea && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="completada"
                  checked={nuevaTarea.completada}
                  onChange={(e) =>
                    setNuevaTarea({
                      ...nuevaTarea,
                      completada: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="completada">Marcar como completada</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveTarea} className="bg-[#1e3a8a] hover:bg-[#152b67]">
              {selectedTarea ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalles Tarea */}
      <Dialog open={detailsModalOpen} onOpenChange={() => setDetailsModalOpen(false)}>
        {selectedTarea && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                {selectedTarea.titulo}
                <Badge variant="outline" className={colorTipoTarea[selectedTarea.tipo]}>
                  {selectedTarea.tipo === "reunion"
                    ? "Reunión"
                    : selectedTarea.tipo === "llamada"
                    ? "Llamada"
                    : selectedTarea.tipo === "recordatorio"
                    ? "Recordatorio"
                    : "Tarea"}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {format(parseISO(selectedTarea.fecha), "EEEE, dd MMMM yyyy", { locale: es })} •{" "}
                {selectedTarea.horaInicio} - {selectedTarea.horaFin}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700">
                  {selectedTarea.descripcion || "Sin descripción"}
                </p>
              </div>
              <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTarea.completada}
                    onChange={() => toggleComplete(selectedTarea.id)}
                    className="rounded border-gray-300"
                  />
                  <Label>
                    {selectedTarea.completada ? "Completada" : "Marcar como completada"}
                  </Label>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDetailsModalOpen(false);
                      openEditTareaModal(selectedTarea);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTarea(selectedTarea.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal Detalles Cita */}
      <Dialog open={citaModalOpen} onOpenChange={() => setCitaModalOpen(false)}>
        {selectedCita && (
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Detalles de Cita</DialogTitle>
              <DialogDescription>
                {format(parseISO(selectedCita.datecita), "EEEE, dd MMMM yyyy HH:mm", { locale: es })}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              {selectedCita.nombre_prospecto && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    📋 {selectedCita.nombre_prospecto}
                  </p>
                  {selectedCita.email_prospecto && (
                    <p className="text-xs text-blue-600 mt-1">✉️ {selectedCita.email_prospecto}</p>
                  )}
                  {selectedCita.telefono_prospecto && (
                    <p className="text-xs text-blue-600 mt-1">📞 {selectedCita.telefono_prospecto}</p>
                  )}
                </div>
              )}
              <p className="text-gray-700">{selectedCita.descricita}</p>
            </div>
            <DialogFooter className="justify-end space-x-2">
              <Button variant="outline" onClick={() => setCitaModalOpen(false)}>
                Cerrar
              </Button>
              <Button variant="destructive" onClick={() => deleteCita(selectedCita.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Cita
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal Actividades del Día */}
      <Dialog open={dayActivitiesModalOpen} onOpenChange={setDayActivitiesModalOpen}>
        {selectedDayActivities && (
          <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Actividades del día
              </DialogTitle>
              <DialogDescription>
                {format(selectedDayActivities.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 overflow-y-auto max-h-[60vh]">
              {selectedDayActivities.items.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay actividades para este día</p>
              ) : (
                selectedDayActivities.items.map(({ kind, item }) => {
                  if (kind === "tarea") {
                    const tarea = item as Tarea;
                    return (
                      <div
                        key={tarea.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow ${
                          colorTipoTarea[tarea.tipo]
                        } ${tarea.completada ? "opacity-60" : ""}`}
                        onClick={() => {
                          setDayActivitiesModalOpen(false);
                          openTareaDetails(tarea);
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {tarea.tipo === "reunion"
                                  ? "Reunión"
                                  : tarea.tipo === "llamada"
                                  ? "Llamada"
                                  : tarea.tipo === "recordatorio"
                                  ? "Recordatorio"
                                  : "Tarea"}
                              </Badge>
                              {tarea.completada && (
                                <Badge variant="outline" className="text-xs bg-green-50">
                                  ✓ Completada
                                </Badge>
                              )}
                            </div>
                            <h4 className={`font-semibold ${tarea.completada ? "line-through" : ""}`}>
                              {tarea.titulo}
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center text-sm gap-2 mt-2">
                          <Clock className="h-4 w-4" />
                          <span>{tarea.horaInicio} - {tarea.horaFin}</span>
                        </div>
                        {tarea.descripcion && (
                          <p className="text-sm mt-2 text-gray-700 line-clamp-2">
                            {tarea.descripcion}
                          </p>
                        )}
                      </div>
                    );
                  } else {
                    const cita = item as Cita;
                    return (
                      <div
                        key={cita.id}
                        className="p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow bg-green-50 border-green-200"
                        onClick={() => {
                          setDayActivitiesModalOpen(false);
                          openCitaDetails(cita);
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <Badge variant="outline" className="text-xs bg-green-100 mb-2">
                              📅 Cita
                            </Badge>
                            <h4 className="font-semibold text-green-900">
                              {cita.descricita}
                            </h4>
                            {cita.nombre_prospecto && (
                              <p className="text-xs text-blue-700 mt-1">
                                📋 {cita.nombre_prospecto}
                                {cita.email_prospecto && ` • ${cita.email_prospecto}`}
                                {cita.telefono_prospecto && ` • ${cita.telefono_prospecto}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-sm gap-2 mt-2 text-green-800">
                          <Clock className="h-4 w-4" />
                          <span>{format(parseISO(cita.datecita), "HH:mm")}</span>
                        </div>
                      </div>
                    );
                  }
                })
              )}
            </div>
            <DialogFooter>
              <div className="flex justify-between items-center w-full">
                <p className="text-sm text-gray-500">
                  {selectedDayActivities.items.length} {selectedDayActivities.items.length === 1 ? 'actividad' : 'actividades'} en total
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setDayActivitiesModalOpen(false)}
                  >
                    Cerrar
                  </Button>
                  <Button
                    className="bg-[#1e3a8a] hover:bg-[#152b67]"
                    onClick={() => {
                      setDayActivitiesModalOpen(false);
                      openNewTareaModal(selectedDayActivities.date);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Tarea
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
