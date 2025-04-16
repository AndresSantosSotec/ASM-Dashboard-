"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Clock, Plus, Trash2, Edit, CalendarIcon } from "lucide-react";

// Definir la interfaz para Tarea
interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string; // ISO string
  horaInicio: string;
  horaFin: string;
  tipo: "reunion" | "tarea" | "recordatorio" | "llamada";
  completada: boolean;
}

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [nuevaTarea, setNuevaTarea] = useState<Partial<Tarea>>({
    titulo: "",
    descripcion: "",
    fecha: "",
    horaInicio: "09:00",
    horaFin: "10:00",
    tipo: "tarea",
    completada: false,
  });
  const [viewMode, setViewMode] = useState<"mes" | "semana" | "dia">("mes");
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Colores para los tipos de tareas
  const colorTipoTarea = {
    reunion: "bg-blue-100 text-blue-800 border-blue-200",
    tarea: "bg-purple-100 text-purple-800 border-purple-200",
    recordatorio: "bg-yellow-100 text-yellow-800 border-yellow-200",
    llamada: "bg-green-100 text-green-800 border-green-200",
  };

  // Obtener token del localStorage (para autenticación)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      console.log("Token recuperado:", storedToken);
      setToken(storedToken);
    }
  }, []);

  // Cargar tareas desde la API
  useEffect(() => {
    if (!token) return;
    const fetchTareas = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/tareas", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        // Asumimos que la respuesta tiene la estructura { message, data: [...] }
        setTareas(res.data.data);
      } catch (err) {
        console.error("Error al cargar tareas:", err);
      }
    };
    fetchTareas();
  }, [token]);

  // Obtener días del mes actual
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Manejar cambio de mes
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Abrir modal para agregar tarea
  const handleAddTarea = (date: Date) => {
    setSelectedDate(date);
    setSelectedTarea(null);
    setNuevaTarea({
      titulo: "",
      descripcion: "",
      fecha: date.toISOString(),
      horaInicio: "09:00",
      horaFin: "10:00",
      tipo: "tarea",
      completada: false,
    });
    setModalOpen(true);
  };

  // Abrir modal para editar tarea
  const handleEditTarea = (tarea: Tarea) => {
    setSelectedTarea(tarea);
    setNuevaTarea({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      fecha: tarea.fecha,
      horaInicio: tarea.horaInicio,
      horaFin: tarea.horaFin,
      tipo: tarea.tipo,
      completada: tarea.completada,
    });
    setModalOpen(true);
  };

  // Función para crear el "payload" con la nomenclatura que espera la API
  const preparePayload = () => {
    return {
      titulo: nuevaTarea.titulo,
      descripcion: nuevaTarea.descripcion,
      fecha: nuevaTarea.fecha,
      hora_inicio: nuevaTarea.horaInicio, // conversión de camelCase a snake_case
      hora_fin: nuevaTarea.horaFin,         // conversión de camelCase a snake_case
      tipo: nuevaTarea.tipo,
      completada: nuevaTarea.completada,
    };
  };

  // Guardar tarea (crea nueva o actualiza existente)
  const handleSaveTarea = async () => {
    if (!nuevaTarea.titulo || !nuevaTarea.fecha || !token) return;
    const payload = preparePayload();
    try {
      if (selectedTarea) {
        // Actualizar tarea existente
        const res = await axios.put(`http://localhost:8000/api/tareas/${selectedTarea.id}`, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });
        setTareas((prev) =>
          prev.map((t) => (t.id === selectedTarea.id ? res.data.data : t))
        );
      } else {
        // Crear nueva tarea
        const res = await axios.post("http://localhost:8000/api/tareas", payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });
        setTareas((prev) => [...prev, res.data.data]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Error al guardar tarea:", err);
    }
  };

  // Eliminar tarea
  const handleDeleteTarea = async (id: string) => {
    if (!token) return;
    try {
      await axios.delete(`http://localhost:8000/api/tareas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTareas((prev) => prev.filter((t) => t.id !== id));
      setDetailsModalOpen(false);
    } catch (err) {
      console.error("Error al eliminar tarea:", err);
    }
  };

  // Marcar tarea como completada
  const handleToggleComplete = async (id: string) => {
    // Encontrar la tarea actual y actualizar su estado
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea || !token) return;
    try {
      const res = await axios.put(`http://localhost:8000/api/tareas/${id}`, {
        completada: !tarea.completada,
      }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      setTareas((prev) =>
        prev.map((t) => (t.id === id ? res.data.data : t))
      );
    } catch (err) {
      console.error("Error al actualizar tarea:", err);
    }
  };

  // Obtener tareas para una fecha específica
  const getTareasForDate = (date: Date) => {
    return tareas.filter((tarea) => isSameDay(parseISO(tarea.fecha), date));
  };

  // Ver detalles de una tarea
  const handleViewTareaDetails = (tarea: Tarea) => {
    setSelectedTarea(tarea);
    setDetailsModalOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-[#1e3a8a] text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Calendario de Tareas</CardTitle>
              <CardDescription className="text-gray-200">
                Gestione sus tareas, reuniones y recordatorios
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
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <h2 className="text-xl font-medium">{format(currentDate, "MMMM yyyy", { locale: es })}</h2>
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "mes" | "semana" | "dia")}
              className="bg-white/10 rounded-md p-1"
            >
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="mes"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] text-white"
                >
                  Mes
                </TabsTrigger>
                <TabsTrigger
                  value="semana"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] text-white"
                >
                  Semana
                </TabsTrigger>
                <TabsTrigger
                  value="dia"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] text-white"
                >
                  Día
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "mes" | "semana" | "dia")}>
            <TabsContent value="mes" className="mt-0">
              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                  <div key={day} className="text-center font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendario */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                  <div key={`empty-start-${index}`} className="h-32 p-1 bg-gray-50 rounded-md"></div>
                ))}

                {monthDays.map((day) => {
                  const dayTareas = getTareasForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelectedDay = selectedDate && isSameDay(day, selectedDate);
                  const isDayToday = isToday(day);

                  return (
                    <div
                      key={day.toString()}
                      className={`h-32 p-1 rounded-md border transition-colors relative ${
                        isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                      } ${isSelectedDay ? "ring-2 ring-[#1e3a8a] ring-offset-2" : ""} ${
                        isDayToday ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={`inline-block w-6 h-6 text-center rounded-full ${
                            isDayToday ? "bg-[#1e3a8a] text-white" : ""
                          }`}
                        >
                          {format(day, "d")}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleAddTarea(day)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                        {dayTareas.slice(0, 3).map((tarea) => (
                          <div
                            key={tarea.id}
                            className={`px-2 py-1 text-xs rounded-md cursor-pointer truncate ${colorTipoTarea[tarea.tipo]} ${
                              tarea.completada ? "opacity-60 line-through" : ""
                            }`}
                            onClick={() => handleViewTareaDetails(tarea)}
                          >
                            {tarea.horaInicio} - {tarea.titulo}
                          </div>
                        ))}
                        {dayTareas.length > 3 && (
                          <div className="text-xs text-center text-gray-500">+{dayTareas.length - 3} más</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
                  <div key={`empty-end-${index}`} className="h-32 p-1 bg-gray-50 rounded-md"></div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="semana" className="mt-0">
              <div className="flex items-center justify-center h-40 border rounded-md bg-gray-50">
                <p className="text-gray-500">Vista semanal en desarrollo</p>
              </div>
            </TabsContent>

            <TabsContent value="dia" className="mt-0">
              <div className="flex items-center justify-center h-40 border rounded-md bg-gray-50">
                <p className="text-gray-500">Vista diaria en desarrollo</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal para agregar/editar tarea */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedTarea ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
            <DialogDescription>
              {selectedDate && !selectedTarea && <span>Agregar tarea para el {format(selectedDate, "dd/MM/yyyy")}</span>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={nuevaTarea.titulo || ""}
                onChange={(e) => setNuevaTarea({ ...nuevaTarea, titulo: e.target.value })}
                placeholder="Título de la tarea"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={nuevaTarea.descripcion || ""}
                onChange={(e) => setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })}
                placeholder="Descripción de la tarea"
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <div className="relative">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {nuevaTarea.fecha ? format(parseISO(nuevaTarea.fecha), "dd/MM/yyyy") : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      {/* Aquí iría un componente de calendario para seleccionar fecha */}
                      <div className="p-4">
                        <p className="text-sm text-gray-500">Selector de fecha en desarrollo</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={nuevaTarea.tipo}
                  onValueChange={(value) => setNuevaTarea({ ...nuevaTarea, tipo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tarea">Tarea</SelectItem>
                    <SelectItem value="reunion">Reunión</SelectItem>
                    <SelectItem value="llamada">Llamada</SelectItem>
                    <SelectItem value="recordatorio">Recordatorio</SelectItem>
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
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, horaInicio: e.target.value })}
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
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, horaFin: e.target.value })}
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
                  onChange={(e) => setNuevaTarea({ ...nuevaTarea, completada: e.target.checked })}
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
            <Button onClick={handleSaveTarea} className="bg-[#1e3a8a] hover:bg-[#152b67]">
              {selectedTarea ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para ver detalles de tarea */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        {selectedTarea && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedTarea.titulo}</span>
                <Badge variant="outline" className={`${colorTipoTarea[selectedTarea.tipo]}`}>
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
                <p className="text-gray-700">{selectedTarea.descripcion || "Sin descripción"}</p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="completada-view"
                    checked={selectedTarea.completada}
                    onChange={() => handleToggleComplete(selectedTarea.id)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="completada-view">
                    {selectedTarea.completada ? "Completada" : "Marcar como completada"}
                  </Label>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDetailsModalOpen(false);
                      handleEditTarea(selectedTarea);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteTarea(selectedTarea.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
