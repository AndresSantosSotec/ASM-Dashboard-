"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday,} from "date-fns";
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
import { ChevronLeft, ChevronRight, Clock, Plus, Trash2, Edit, CalendarIcon,} from "lucide-react";

import {api} from "@/services/api"; 

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
}

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [citaModalOpen, setCitaModalOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

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

  // --- Fetch tareas ---
  useEffect(() => {
    if (!token) return;
    api
      .get("/tareas", {
        withCredentials: true,
      })
      .then((res) => setTareas(res.data.data))
      .catch(console.error);
  }, [token]);

  // --- Fetch citas ---
  useEffect(() => {
    if (!token) return;
    api
      .get("/citas")
      .then((res) => {
        const arr = Array.isArray(res.data) ? res.data : res.data.data || [];
        setCitas(arr);
      })
      .catch(console.error);
  }, [token]);

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
            t.id === selectedTarea.id ? res.data.data : t
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
        setTareas((prev) => [...prev, res.data.data]);
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
        prev.map((x) => (x.id === id ? res.data.data : x))
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
          <div className="mt-4">
            <h2 className="text-xl font-medium">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </h2>
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
                    isCurr ? "bg-white" : "bg-gray-50 text-gray-400"
                  } ${isTod ? "bg-blue-50" : ""}`}
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
                      onClick={() => openNewTareaModal(day)}
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
                          onClick={() => openTareaDetails(item)}
                        >
                          {item.horaInicio} - {item.titulo}
                        </div>
                      ) : (
                        <div
                          key={item.id}
                          className="px-2 py-1 text-xs rounded-md cursor-pointer truncate bg-green-100 text-green-800 border-green-200"
                          onClick={() => openCitaDetails(item)}
                        >
                          {format(parseISO(item.datecita), "HH:mm")} -{" "}
                          {item.descricita}
                        </div>
                      )
                    )}
                    {items.length > 3 && (
                      <div className="text-xs text-center text-gray-500">
                        +{items.length - 3} más
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nuevaTarea.fecha
                        ? format(parseISO(nuevaTarea.fecha), "dd/MM/yyyy")
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-4">
                      <p className="text-sm text-gray-500">
                        Selector en desarrollo
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
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
            <div className="py-4">
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
    </div>
  );
}
