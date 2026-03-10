"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday, setYear, setMonth as setMonthFn, } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, Plus, Trash2, Edit, CalendarIcon, Bell, CheckCircle2, ImageIcon, Megaphone, Download } from "lucide-react";

import { api } from "@/services/api";
import { API_BASE_URL } from "@/utils/apiConfig";
import Swal from "sweetalert2";

/** Evento público creado por administrador, visible para todos (diplomados, webinars, etc.) */
interface EventoPublico {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  tipo: string;
  imagen_url: string | null;
  created_by: number | null;
}

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
  estado: "pendiente" | "completada" | "cancelada";
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
    items: Array<{ kind: 'tarea' | 'cita' | 'evento_publico'; item: Tarea | Cita | EventoPublico }>;
  } | null>(null);

  const [eventosPublicos, setEventosPublicos] = useState<EventoPublico[]>([]);
  const [loadingEventosPublicos, setLoadingEventosPublicos] = useState(false);
  const [isAdminCalendario, setIsAdminCalendario] = useState(false);
  const [eventoPublicoModalOpen, setEventoPublicoModalOpen] = useState(false);
  const [eventoPublicoDetailsOpen, setEventoPublicoDetailsOpen] = useState(false);
  const [selectedEventoPublico, setSelectedEventoPublico] = useState<EventoPublico | null>(null);
  const [nuevoEventoPublico, setNuevoEventoPublico] = useState<Partial<EventoPublico> & { imagen?: File | null }>({
    titulo: "",
    descripcion: "",
    fecha: "",
    hora_inicio: "09:00",
    hora_fin: "10:00",
    tipo: "evento",
  });

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
  const [upcomingAlerts, setUpcomingAlerts] = useState<Array<{ id: string; titulo: string; fecha: string; horaInicio: string; tipo: string }>>([]);
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

  // --- Fetch eventos públicos del calendario (visibles para todos; is_admin para mostrar botón crear) ---
  useEffect(() => {
    if (!token) return;
    setLoadingEventosPublicos(true);
    api
      .get("/eventos-calendario-publicos")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setEventosPublicos(Array.isArray(data) ? data : []);
        setIsAdminCalendario(!!res.data?.is_admin);
      })
      .catch(console.error)
      .finally(() => setLoadingEventosPublicos(false));
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
      if (c.estado === "completada") return; // No alertar citas ya completadas
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
  const getEventosPublicosForDate = (d: Date) =>
    eventosPublicos.filter((e) => isSameDay(parseISO(e.fecha), d));

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

  const openDayActivities = (day: Date, items: Array<{ kind: 'tarea' | 'cita' | 'evento_publico'; item: Tarea | Cita | EventoPublico }>) => {
    setSelectedDayActivities({ date: day, items });
    setDayActivitiesModalOpen(true);
  };

  const openEventoPublicoDetails = (e: EventoPublico) => {
    setSelectedEventoPublico(e);
    setEventoPublicoDetailsOpen(true);
  };

  const downloadEventoImage = async (imagenUrl: string, titulo: string) => {
    try {
      const url = `${API_BASE_URL}${imagenUrl}`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error("No se pudo obtener la imagen");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = titulo.replace(/[^a-z0-9.-]/gi, "_") + (imagenUrl.match(/\.[a-z]+$/i)?.[0] || ".jpg");
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(`${API_BASE_URL}${imagenUrl}`, "_blank");
    }
  };
  const openNewEventoPublicoModal = (d?: Date) => {
    setSelectedEventoPublico(null);
    setNuevoEventoPublico({
      titulo: "",
      descripcion: "",
      fecha: d ? format(d, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      hora_inicio: "09:00",
      hora_fin: "10:00",
      tipo: "evento",
      imagen: null,
    });
    setEventoPublicoModalOpen(true);
  };
  const openEditEventoPublicoModal = (e: EventoPublico) => {
    setSelectedEventoPublico(e);
    setNuevoEventoPublico({
      ...e,
      imagen: null,
    });
    setEventoPublicoModalOpen(true);
  };

  const saveEventoPublico = async () => {
    if (!nuevoEventoPublico.titulo || !nuevoEventoPublico.fecha || !token) return;
    const formData = new FormData();
    formData.append("titulo", nuevoEventoPublico.titulo);
    formData.append("descripcion", nuevoEventoPublico.descripcion ?? "");
    formData.append("fecha", nuevoEventoPublico.fecha);
    formData.append("hora_inicio", nuevoEventoPublico.hora_inicio ?? "09:00");
    formData.append("hora_fin", nuevoEventoPublico.hora_fin ?? "10:00");
    formData.append("tipo", nuevoEventoPublico.tipo ?? "evento");
    if (nuevoEventoPublico.imagen) formData.append("imagen", nuevoEventoPublico.imagen);
    try {
      if (selectedEventoPublico) {
        const res = await api.put(`/eventos-calendario-publicos/${selectedEventoPublico.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setEventosPublicos((prev) => prev.map((ev) => (ev.id === selectedEventoPublico.id ? (res.data?.data ?? res.data) : ev)));
      } else {
        const res = await api.post("/eventos-calendario-publicos", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setEventosPublicos((prev) => [...prev, res.data?.data ?? res.data]);
      }
      setEventoPublicoModalOpen(false);
      Swal.fire({ icon: "success", title: "Guardado", timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.error || "No se pudo guardar" });
    }
  };

  const deleteEventoPublico = async (id: number) => {
    if (!token) return;
    const { isConfirmed } = await Swal.fire({
      title: "¿Eliminar evento?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/eventos-calendario-publicos/${id}`);
      setEventosPublicos((prev) => prev.filter((e) => e.id !== id));
      setEventoPublicoDetailsOpen(false);
      setSelectedEventoPublico(null);
      Swal.fire({ icon: "success", title: "Eliminado", timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.error || "No se pudo eliminar" });
    }
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

    // Preparar payload completo para evitar errores de validación en PUT
    const payload = {
      titulo: t.titulo,
      descripcion: t.descripcion,
      fecha: t.fecha,
      hora_inicio: t.horaInicio,
      hora_fin: t.horaFin,
      tipo: t.tipo,
      completada: !t.completada,
    };

    try {
      const res = await api.put(
        `/tareas/${id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      // Intentar obtener la tarea actualizada de la respuesta
      let updatedTask: Tarea;
      if (res.data && res.data.data) {
        updatedTask = normalizeTarea(res.data.data);
      } else if (res.data && res.data.id) {
        // Si la respuesta es el objeto directo
        updatedTask = normalizeTarea(res.data);
      } else {
        // Si no se devuelve la tarea, usar la local con el estado invertido
        updatedTask = { ...t, completada: !t.completada };
      }

      // Update global list
      setTareas((prev) =>
        prev.map((x) => (x.id === id ? updatedTask : x))
      );

      // Update selectedTarea if it's the one being modified
      if (selectedTarea && selectedTarea.id === id) {
        setSelectedTarea(updatedTask);
      }

      // Update selectedDayActivities if open
      if (selectedDayActivities) {
        setSelectedDayActivities((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((item) => {
              if (item.kind === 'tarea' && (item.item as Tarea).id === id) {
                return { ...item, item: updatedTask };
              }
              return item;
            })
          };
        });
      }

      // Feedback visual opcional
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });

      Toast.fire({
        icon: 'success',
        title: updatedTask.completada ? 'Tarea completada' : 'Tarea pendiente'
      });

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado de la tarea',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
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

  const toggleCitaComplete = async (id: string) => {
    const c = citas.find((x) => x.id === id);
    if (!c || !token) return;

    const nuevoEstado = c.estado === "completada" ? "pendiente" : "completada";

    // Optimistic update — UI reacts instantly
    const optimisticCita: Cita = { ...c, estado: nuevoEstado };
    setCitas((prev) => prev.map((x) => (x.id === id ? optimisticCita : x)));
    if (selectedCita && selectedCita.id === id) setSelectedCita(optimisticCita);
    if (selectedDayActivities) {
      setSelectedDayActivities((prev) => {
        if (!prev) return null;
        return { ...prev, items: prev.items.map((it) => it.kind === "cita" && (it.item as Cita).id === id ? { ...it, item: optimisticCita } : it) };
      });
    }

    try {
      const res = await api.put(`/citas/${id}`, { estado: nuevoEstado });

      const updated = res.data?.data ?? res.data;
      const updatedCita: Cita = {
        ...c,
        estado: updated?.estado ?? nuevoEstado,
      };

      setCitas((prev) => prev.map((x) => (x.id === id ? updatedCita : x)));

      if (selectedCita && selectedCita.id === id) {
        setSelectedCita(updatedCita);
      }

      // Actualizar modal de actividades del día si está abierto
      if (selectedDayActivities) {
        setSelectedDayActivities((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((item) => {
              if (item.kind === "cita" && (item.item as Cita).id === id) {
                return { ...item, item: updatedCita };
              }
              return item;
            }),
          };
        });
      }

      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });

      Toast.fire({
        icon: "success",
        title: nuevoEstado === "completada" ? "Cita completada" : "Cita marcada como pendiente",
      });
    } catch (err) {
      console.error(err);
      // Rollback optimistic update
      setCitas((prev) => prev.map((x) => (x.id === id ? c : x)));
      if (selectedCita && selectedCita.id === id) setSelectedCita(c);
      if (selectedDayActivities) {
        setSelectedDayActivities((prev) => {
          if (!prev) return null;
          return { ...prev, items: prev.items.map((it) => it.kind === "cita" && (it.item as Cita).id === id ? { ...it, item: c } : it) };
        });
      }
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el estado de la cita",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
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
              {isAdminCalendario && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-amber-500/20 text-white border-amber-300/40 hover:bg-amber-500/30"
                  onClick={() => openNewEventoPublicoModal()}
                >
                  <Megaphone className="h-4 w-4 mr-1" />
                  Evento para todos
                </Button>
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
          {(loadingTareas || loadingCitas || loadingEventosPublicos) ? (
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
                const dayE = getEventosPublicosForDate(day);
                const items: Array<{ kind: "tarea" | "cita" | "evento_publico"; item: Tarea | Cita | EventoPublico }> = [
                  ...dayT.map((t) => ({ kind: "tarea" as const, item: t })),
                  ...dayC.map((c) => ({ kind: "cita" as const, item: c })),
                  ...dayE.map((e) => ({ kind: "evento_publico" as const, item: e })),
                ];
                const toShow = items.slice(0, 3);
                const isCurr = isSameMonth(day, currentDate);
                const isTod = isToday(day);

                return (
                  <div
                    key={day.toString()}
                    className={`h-32 p-1 rounded-md border transition-colors ${isCurr ? "bg-white hover:bg-gray-50" : "bg-gray-50 text-gray-400"
                      } ${isTod ? "bg-blue-50" : ""} ${items.length > 0 ? "cursor-pointer" : ""
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
                        className={`inline-block w-6 h-6 text-center rounded-full ${isTod ? "bg-[#1e3a8a] text-white" : ""
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
                            key={`t-${item.id}`}
                            className={`px-2 py-1 text-xs rounded-md cursor-pointer truncate ${colorTipoTarea[(item as Tarea).tipo]
                              } ${(item as Tarea).completada ? "opacity-60 line-through" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openTareaDetails(item as Tarea);
                            }}
                          >
                            {(item as Tarea).horaInicio} - {(item as Tarea).titulo}
                          </div>
                        ) : kind === "cita" ? (
                          <div
                            key={`c-${item.id}`}
                            className={`px-2 py-1 text-xs rounded-md cursor-pointer truncate bg-green-100 text-green-800 border-green-200 ${(item as Cita).estado === "completada" ? "opacity-60 line-through" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openCitaDetails(item as Cita);
                            }}
                          >
                            {(item as Cita).estado === "completada" && "✓ "}
                            {format(parseISO((item as Cita).datecita), "HH:mm")} -{" "}
                            {(item as Cita).descricita}
                          </div>
                        ) : (
                          <div
                            key={`e-${item.id}`}
                            className="px-2 py-1 text-xs rounded-md cursor-pointer truncate bg-amber-100 text-amber-900 border-amber-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEventoPublicoDetails(item as EventoPublico);
                            }}
                          >
                            <Megaphone className="inline h-3 w-3 mr-0.5" />
                            {(item as EventoPublico).hora_inicio && `${(item as EventoPublico).hora_inicio} - `}
                            {(item as EventoPublico).titulo}
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
                <Switch
                  id="completada"
                  checked={nuevaTarea.completada}
                  onCheckedChange={(checked) =>
                    setNuevaTarea({
                      ...nuevaTarea,
                      completada: checked,
                    })
                  }
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
                  <Switch
                    checked={selectedTarea.completada}
                    onCheckedChange={() => toggleComplete(selectedTarea.id)}
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
          <DialogContent className="sm:max-w-[480px] max-w-[95vw]">
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
              {selectedCita.estado && (
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className={selectedCita.estado === "completada" ? "bg-green-100 text-green-800 border-green-300" : selectedCita.estado === "cancelada" ? "bg-red-100 text-red-800 border-red-300" : "bg-yellow-100 text-yellow-800 border-yellow-300"}
                  >
                    {selectedCita.estado === "completada" ? "✓ Completada" : selectedCita.estado === "cancelada" ? "✕ Cancelada" : "⏳ Pendiente"}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-end pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setCitaModalOpen(false)}>
                Cerrar
              </Button>
              <Button
                size="sm"
                variant={selectedCita.estado === "completada" ? "outline" : "default"}
                className={selectedCita.estado === "completada" ? "text-green-600 border-green-600 hover:bg-green-50" : "bg-green-600 hover:bg-green-700 text-white"}
                onClick={() => toggleCitaComplete(selectedCita.id)}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {selectedCita.estado === "completada" ? "Pendiente" : "Completada"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteCita(selectedCita.id)}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Eliminar
              </Button>
            </div>
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
                        className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow ${colorTipoTarea[tarea.tipo]
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
                        {/* Botón para marcar como completada directamente */}
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant={tarea.completada ? "outline" : "default"}
                            size="sm"
                            className={tarea.completada ? "text-green-600 border-green-600 hover:bg-green-50" : "bg-blue-600 hover:bg-blue-700 text-white"}
                            onClick={(e) => {
                              e.stopPropagation(); // Evitar que se abra el modal de detalles
                              toggleComplete(tarea.id);
                            }}
                          >
                            {tarea.completada ? "Marcar como pendiente" : "Marcar como completada"}
                          </Button>
                        </div>
                      </div>
                    );
                  } else if (kind === "cita") {
                    const cita = item as Cita;
                    return (
                      <div
                        key={`c-${cita.id}`}
                        className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow bg-green-50 border-green-200 ${cita.estado === "completada" ? "opacity-60" : ""}`}
                        onClick={() => {
                          setDayActivitiesModalOpen(false);
                          openCitaDetails(cita);
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs bg-green-100">
                                📅 Cita
                              </Badge>
                              {cita.estado === "completada" && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  ✓ Completada
                                </Badge>
                              )}
                            </div>
                            <h4 className={`font-semibold text-green-900 ${cita.estado === "completada" ? "line-through" : ""}`}>
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
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant={cita.estado === "completada" ? "outline" : "default"}
                            size="sm"
                            className={cita.estado === "completada" ? "text-green-600 border-green-600 hover:bg-green-50" : "bg-green-600 hover:bg-green-700 text-white"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCitaComplete(cita.id);
                            }}
                          >
                            {cita.estado === "completada" ? "Marcar como pendiente" : "Marcar como completada"}
                          </Button>
                        </div>
                      </div>
                    );
                  } else {
                    const ev = item as EventoPublico;
                    return (
                      <div
                        key={`e-${ev.id}`}
                        className="p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow bg-amber-50 border-amber-200"
                        onClick={() => {
                          setDayActivitiesModalOpen(false);
                          openEventoPublicoDetails(ev);
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800">
                            <Megaphone className="h-3 w-3 mr-0.5 inline" /> {ev.tipo === "diplomado" ? "Diplomado" : ev.tipo === "webinar" ? "Webinar" : ev.tipo}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-amber-900">{ev.titulo}</h4>
                        {ev.hora_inicio && (
                          <div className="flex items-center text-sm gap-2 mt-2 text-amber-800">
                            <Clock className="h-4 w-4" />
                            <span>{ev.hora_inicio}{ev.hora_fin ? ` - ${ev.hora_fin}` : ""}</span>
                          </div>
                        )}
                        {ev.descripcion && (
                          <p className="text-sm mt-2 text-gray-700 line-clamp-2">{ev.descripcion}</p>
                        )}
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

      {/* Modal detalle evento público */}
      <Dialog open={eventoPublicoDetailsOpen} onOpenChange={setEventoPublicoDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-amber-600" />
              {selectedEventoPublico?.titulo}
            </DialogTitle>
          </DialogHeader>
          {selectedEventoPublico && (
            <div className="space-y-4">
              {selectedEventoPublico.imagen_url && (
                <div className="space-y-2">
                  <div className="rounded-lg border bg-muted/50 overflow-auto max-h-[min(70vh,420px)] flex items-center justify-center p-1">
                    <img
                      src={`${API_BASE_URL}${selectedEventoPublico.imagen_url}`}
                      alt={selectedEventoPublico.titulo}
                      className="max-w-full max-h-[min(68vh,400px)] w-auto h-auto object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="inline-flex items-center gap-2 text-primary hover:underline -ml-2"
                    onClick={() => selectedEventoPublico.imagen_url && downloadEventoImage(selectedEventoPublico.imagen_url, selectedEventoPublico.titulo)}
                  >
                    <Download className="h-4 w-4" />
                    Descargar imagen
                  </Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground capitalize">{selectedEventoPublico.tipo}</p>
              <p className="text-sm">{selectedEventoPublico.descripcion || "Sin descripción."}</p>
              <p className="text-xs text-muted-foreground">
                {selectedEventoPublico.fecha.includes("T") ? selectedEventoPublico.fecha.slice(0, 10) : selectedEventoPublico.fecha} · {selectedEventoPublico.hora_inicio} - {selectedEventoPublico.hora_fin}
              </p>
              {isAdminCalendario && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => { openEditEventoPublicoModal(selectedEventoPublico); setEventoPublicoDetailsOpen(false); }}>
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => selectedEventoPublico && deleteEventoPublico(selectedEventoPublico.id)}>
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal crear/editar evento público (admin) */}
      <Dialog open={eventoPublicoModalOpen} onOpenChange={(open) => { setEventoPublicoModalOpen(open); if (!open) { setSelectedEventoPublico(null); setNuevoEventoPublico({ titulo: "", descripcion: "", fecha: "", hora_inicio: "09:00", hora_fin: "10:00", tipo: "evento", imagen: null }); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEventoPublico ? "Editar evento" : "Nuevo evento para todos"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={nuevoEventoPublico.titulo} onChange={(e) => setNuevoEventoPublico((p) => ({ ...p, titulo: e.target.value }))} placeholder="Ej. Webinar ventas" />
            </div>
            <div>
              <Label>Descripción</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={nuevoEventoPublico.descripcion} onChange={(e) => setNuevoEventoPublico((p) => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción opcional" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={nuevoEventoPublico.fecha} onChange={(e) => setNuevoEventoPublico((p) => ({ ...p, fecha: e.target.value }))} />
              </div>
              <div>
                <Label>Tipo</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={nuevoEventoPublico.tipo} onChange={(e) => setNuevoEventoPublico((p) => ({ ...p, tipo: e.target.value }))}>
                  <option value="diplomado">Diplomado</option>
                  <option value="webinar">Webinar</option>
                  <option value="taller">Taller</option>
                  <option value="evento">Evento</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Hora inicio</Label>
                <Input type="time" value={nuevoEventoPublico.hora_inicio} onChange={(e) => setNuevoEventoPublico((p) => ({ ...p, hora_inicio: e.target.value }))} />
              </div>
              <div>
                <Label>Hora fin</Label>
                <Input type="time" value={nuevoEventoPublico.hora_fin} onChange={(e) => setNuevoEventoPublico((p) => ({ ...p, hora_fin: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Imagen (opcional)</Label>
              {(nuevoEventoPublico.imagen_url && !nuevoEventoPublico.imagen) ? (
                <div className="mt-2 flex items-center gap-2">
                  <img src={`${API_BASE_URL}${nuevoEventoPublico.imagen_url}`} alt="Actual" className="h-20 w-20 object-cover rounded border" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setNuevoEventoPublico((p) => ({ ...p, imagen_url: undefined, imagen: null }))}>Quitar / reemplazar</Button>
                </div>
              ) : (
                <Input type="file" accept="image/*" className="mt-1" onChange={(e) => setNuevoEventoPublico((p) => ({ ...p, imagen: e.target.files?.[0] ?? null }))} />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventoPublicoModalOpen(false)}>Cancelar</Button>
            <Button onClick={saveEventoPublico}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
