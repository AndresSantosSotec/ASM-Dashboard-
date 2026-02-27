"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit2, X } from "lucide-react";
import SwalOriginal from "sweetalert2";

// 🔧 Configurar Swal para que siempre aparezca sobre modales
const Swal = SwalOriginal.mixin({
  didOpen: (popup) => {
    const swalContainer = popup.parentElement;
    if (swalContainer) {
      swalContainer.style.zIndex = "99999";
    }
  }
});

// 💀 Componente Skeleton para estados de carga
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded ${className}`} />
);

const InteractionsSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded p-3 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    ))}
  </div>
);

const CitasSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex justify-between items-center border-b py-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

interface Actividad {
  id: number;
  nombre: string;
}

interface ProspectoParams {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  estado: string;
  notasGenerales?: string;
  observaciones?: string;
}

interface SeguimientoModalPanelProps {
  prospecto: ProspectoParams;
  onClose: () => void;
}

export default function SeguimientoModalPanel({ prospecto, onClose }: SeguimientoModalPanelProps) {
  // 💀 Estados de carga granulares
  const [loadingInteracciones, setLoadingInteracciones] = useState<boolean>(false);
  const [loadingCitas, setLoadingCitas] = useState<boolean>(false);

  // Estados para interacciones
  const [editingInteractionId, setEditingInteractionId] = useState<number | null>(null);
  const [interacciones, setInteracciones] = useState<any[]>([]);
  const [interactionType, setInteractionType] = useState<string>("");
  const [interactionDate, setInteractionDate] = useState<string>("");
  const [interactionDuration, setInteractionDuration] = useState<string>("");
  const [interactionNotes, setInteractionNotes] = useState<string>("");

  // Estados para citas
  const toLocalInputValue = (date: Date) => {
    const off = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - off).toISOString().slice(0, 16);
  };
  const getDefaultAppointmentDate = () => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return toLocalInputValue(d);
  };
  const [citas, setCitas] = useState<any[]>([]);
  const [appointmentDate, setAppointmentDate] = useState<string>(getDefaultAppointmentDate());
  const [appointmentDescription, setAppointmentDescription] = useState<string>("");

  // Estado para almacenar actividades
  const [actividades, setActividades] = useState<Actividad[]>([]);

  // Token desde contexto
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    const fetchActividades = async () => {
      try {
        const res = await api.get("/actividades");
        setActividades(res.data);
      } catch (err) {
        console.error("Error loading actividades", err);
      }
    };
    fetchActividades();
  }, [token]);

  // ⚡ LAZY LOADING: Cargar interacciones y citas
  useEffect(() => {
    if (!token || !prospecto) return;

    const fetchModalData = async () => {
      setLoadingInteracciones(true);
      setLoadingCitas(true);
      try {
        // ⚡ Cargar interacciones y citas en paralelo (filtradas por prospecto)
        const [interaccionesRes, citasRes] = await Promise.all([
          api.get(`/interacciones?id_lead=${prospecto.id}`),
          api.get(`/citas?prospecto_id=${prospecto.id}`)
        ]);

        console.log("✅ Interacciones y citas cargadas en paralelo");

        // Procesar interacciones
        if (Array.isArray(interaccionesRes.data.data)) {
          setInteracciones(interaccionesRes.data.data);
        } else {
          setInteracciones([]);
        }

        // Procesar citas
        const citasArray = Array.isArray(citasRes.data)
          ? citasRes.data
          : citasRes.data.data || [];
        setCitas(citasArray);
      } catch (err: any) {
        console.error("❌ Error al cargar datos del modal:", err);
      } finally {
        setLoadingInteracciones(false);
        setLoadingCitas(false);
      }
    };
    fetchModalData();
  }, [token, prospecto]);

  const handleAddInteraction = async () => {
    if (!prospecto) return;
    if (!interactionType || !interactionDate) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Por favor, complete el tipo de interacción y la fecha.",
      });
      return;
    }
    const currentToken = token;
    if (!currentToken) {
      Swal.fire({
        icon: "error",
        title: "Error de autenticación",
        text: "Falta el token del usuario autenticado.",
      });
      return;
    }
    const formattedDate = interactionDate.split("T")[0];
    const leadId = parseInt(prospecto.id, 10);

    const actividadId = actividades.length > 0
      ? actividades.find((act) => act.id.toString() === interactionType)?.id
      : parseInt(interactionType, 10);

    if (!actividadId) {
      Swal.fire({
        icon: "warning",
        title: "Actividad no seleccionada",
        text: "Por favor selecciona un tipo de interacción válido.",
      });
      return;
    }

    const newInteraction = {
      id_lead: leadId,
      id_actividades: actividadId,
      fecha: formattedDate,
      duracion: interactionDuration,
      notas: interactionNotes,
    };

    try {
      if (editingInteractionId) {
        const response = await api.put(`/interacciones/${editingInteractionId}`, newInteraction);
        const savedInteraction = response.data?.data || response.data;

        setInteracciones((prev) => prev.map((item) => item.id === editingInteractionId ? savedInteraction : item));

        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });

        Toast.fire({
          icon: 'success',
          title: 'Interacción actualizada'
        });
      } else {
        const response = await api.post("/interacciones", newInteraction);
        const savedInteraction = response.data?.data || response.data;

        setInteracciones((prev) => Array.isArray(prev) ? [...prev, savedInteraction] : [savedInteraction]);

        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });

        Toast.fire({
          icon: 'success',
          title: 'Interacción guardada'
        });
      }

      setEditingInteractionId(null);
      setInteractionType("");
      setInteractionDate("");
      setInteractionDuration("");
      setInteractionNotes("");

      // 🔄 Recargar silenciosamente las interacciones para obtener cualquier campo calculado del backend (ej: asesor, relaciones)
      api.get(`/interacciones?id_lead=${prospecto.id}`).then((res) => {
        if (Array.isArray(res.data?.data)) {
          setInteracciones(res.data.data);
        }
      }).catch(console.error);

    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al guardar la interacción",
      });
    }
  };

  const handleEditInteraction = (actividad: any) => {
    setEditingInteractionId(actividad.id);
    setInteractionType(actividad.id_actividades?.toString() || "");

    // 🔥 CORRECCIÓN: Ajustamos para extraer el fragmento "YYYY-MM-DD" incluso si viene con un formato largo UTC de Laravel. 
    // y solo le anclamos T12:00:00 al Date picker.
    let dateForPicker = "";
    if (actividad.fecha) {
      const justDate = actividad.fecha.split(" ")[0].split("T")[0]; // Separa '2026-02-20 00:00:00' -> '2026-02-20'
      dateForPicker = `${justDate}T12:00:00`;
    }
    setInteractionDate(dateForPicker);

    setInteractionDuration(actividad.duracion?.toString() || "");
    setInteractionNotes(actividad.notas || "");
  };

  const handleDeleteInteraction = async (id: number | string) => {
    // 🔥 CORRECCIÓN: Usamos el window.confirm() nativo del navegador que nunca sufre por `z-index` en vez de Swal.
    const isConfirmed = window.confirm("¿Estás seguro? No podrás revertir esta acción");
    if (!isConfirmed) return;

    try {
      await api.delete(`/interacciones/${id}`);
      setInteracciones((prev) => prev.filter((inter) => inter.id !== id));

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      Toast.fire({
        icon: 'success',
        title: 'Interacción eliminada'
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al eliminar la interacción",
      });
    }
  };

  const handleAddCita = async () => {
    if (!appointmentDate) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Selecciona la fecha para la cita.",
      });
      return;
    }
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Error de autenticación",
        text: "Falta el token del usuario autenticado",
      });
      return;
    }

    const formattedDate = appointmentDate.includes("T")
      ? appointmentDate + (appointmentDate.includes(":00", appointmentDate.length - 3) ? "" : ":00")
      : appointmentDate + "T09:00:00";

    let descripcionFinal = appointmentDescription.trim();
    if (prospecto) {
      const partes = [prospecto.nombre];
      if (prospecto.email) partes.push(prospecto.email);
      if (prospecto.telefono) partes.push(prospecto.telefono);
      const datosProspecto = partes.join(" • ");
      descripcionFinal = descripcionFinal
        ? `${descripcionFinal} | ${datosProspecto}`
        : datosProspecto;
    }

    const newCita = {
      datecita: formattedDate,
      descricita: descripcionFinal || "Cita agendada",
      prospecto_id: parseInt(prospecto.id, 10),
      nombre_prospecto: prospecto.nombre,
      email_prospecto: prospecto.email,
      telefono_prospecto: prospecto.telefono,
    };

    try {
      const response = await api.post("/citas", newCita);
      const saved = response.data?.data ?? response.data;
      setCitas((prev) => [...prev, saved]);
      setAppointmentDescription("");
      setAppointmentDate(getDefaultAppointmentDate());

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      Toast.fire({
        icon: 'success',
        title: 'Cita agendada correctamente'
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al guardar la cita",
      });
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Contactado":
        return "bg-yellow-100 text-yellow-800";
      case "Interesado":
        return "bg-green-100 text-green-800";
      case "En proceso":
        return "bg-primary/15 text-primary";
      default:
        return "bg-muted text-foreground";
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString();
  };

  return (
    <Dialog open={!!prospecto} onOpenChange={(open) => !open && onClose()} modal={false}>
      <DialogContent aria-describedby={undefined} className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Detalles del prospecto</DialogTitle>
        <div className="max-h-[80vh] overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold flex justify-between items-center">
                  Información del Prospecto
                  <Badge className={getEstadoColor(prospecto.estado)}>
                    {prospecto.estado}
                  </Badge>
                </h2>
                <div className="mt-4 space-y-2">
                  <p className="text-lg font-medium">{prospecto.nombre}</p>
                  <p className="text-muted-foreground">{prospecto.email}</p>
                  <p className="text-muted-foreground">{prospecto.telefono}</p>
                </div>
              </div>
              <div>
                {(prospecto.notasGenerales || prospecto.observaciones) && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                    <h3 className="text-md font-semibold text-primary flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      Notas del Prospecto
                    </h3>
                    {prospecto.notasGenerales && (
                      <div>
                        <p className="text-xs font-semibold text-primary/80 mb-1">Notas Generales:</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{prospecto.notasGenerales}</p>
                      </div>
                    )}
                    {prospecto.observaciones && (
                      <div>
                        <p className="text-xs font-semibold text-primary/80 mb-1">Observaciones:</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{prospecto.observaciones}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-md font-semibold mb-2">Historial de Actividades</h3>
                <div className="max-h-72 overflow-y-auto space-y-4">
                  {loadingInteracciones ? (
                    <InteractionsSkeleton />
                  ) : Array.isArray(interacciones) && interacciones.length > 0 ? (
                    interacciones.map((actividad, index) => (
                      <div key={index} className={`border rounded p-3 relative group transition-colors ${editingInteractionId === actividad.id ? 'border-primary bg-primary/5' : ''}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={editingInteractionId === actividad.id}
                          className="absolute top-2 right-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary/80 hover:bg-primary/10"
                          onClick={() => handleEditInteraction(actividad)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={editingInteractionId === actividad.id}
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteInteraction(actividad.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex justify-between text-sm pr-16">
                          <span className="font-medium">
                            {actividades.find((act) => act.id === actividad.id_actividades)?.nombre ||
                              actividad.id_actividades}
                          </span>
                          <span className="text-muted-foreground">{actividad.fecha}</span>
                        </div>
                        <p className="text-sm mt-1">{actividad.notas}</p>
                        <div className="flex justify-between text-sm mt-2 text-muted-foreground">
                          <span>Duración: {actividad.duracion} min</span>
                          <span>{actividad.asesor || "Tú"}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay interacciones registradas.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-semibold mb-4">Agregar Interacción</h3>
                <div className="space-y-4">
                  <Select value={interactionType} onValueChange={(value) => setInteractionType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de interacción" />
                    </SelectTrigger>
                    <SelectContent>
                      {actividades.length > 0 ? (
                        actividades.map((act) => (
                          <SelectItem key={act.id} value={act.id.toString()}>
                            {act.nombre}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="1">Llamada</SelectItem>
                          <SelectItem value="2">Correo</SelectItem>
                          <SelectItem value="3">Reunión</SelectItem>
                          <SelectItem value="4">WhatsApp</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha de interacción</label>
                    <SimpleDatePicker
                      value={interactionDate}
                      onChange={(v) => setInteractionDate(v)}
                      placeholder="Seleccionar fecha de interacción"
                    />
                  </div>
                  <Input
                    placeholder="Duración (minutos)"
                    value={interactionDuration}
                    onChange={(e) => setInteractionDuration(e.target.value)}
                  />
                  <Textarea
                    placeholder="Notas"
                    className="min-h-[100px]"
                    value={interactionNotes}
                    onChange={(e) => setInteractionNotes(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button className="w-full" onClick={handleAddInteraction}>
                      {editingInteractionId ? "Actualizar Interacción" : "Agregar Interacción"}
                    </Button>
                    {editingInteractionId && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Cancelar edición"
                        onClick={() => {
                          setEditingInteractionId(null);
                          setInteractionType("");
                          setInteractionDate("");
                          setInteractionDuration("");
                          setInteractionNotes("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-md font-semibold mb-4">Fecha y Cita</h3>
                <div className="p-2 bg-primary/5 border border-primary/20 rounded-lg mb-3">
                  <p className="text-xs text-primary/80">
                    📋 Cita para: <strong>{prospecto.nombre}</strong>
                    {prospecto.email && ` • ${prospecto.email}`}
                    {prospecto.telefono && ` • ${prospecto.telefono}`}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha de la cita</label>
                  <SimpleDatePicker
                    value={appointmentDate.split("T")[0]}
                    onChange={(v) => {
                      const currentTime = appointmentDate.includes("T") ? appointmentDate.split("T")[1] : "09:00";
                      setAppointmentDate(v + "T" + currentTime);
                    }}
                    placeholder="Seleccionar fecha de la cita"
                  />
                </div>
                <div className="mt-3 space-y-2">
                  <label className="text-sm font-medium">Hora de la cita</label>
                  <Input
                    type="time"
                    value={appointmentDate.includes("T") ? appointmentDate.split("T")[1].substring(0, 5) : "09:00"}
                    onChange={(e) => {
                      const currentDate = appointmentDate.split("T")[0];
                      setAppointmentDate(currentDate + "T" + e.target.value);
                    }}
                  />
                </div>
                <div className="mt-4 space-y-4">
                  <Input
                    placeholder="Descripción de la cita"
                    value={appointmentDescription}
                    onChange={(e) => setAppointmentDescription(e.target.value)}
                  />
                  <Button className="w-full" onClick={handleAddCita}>
                    Agendar Nueva Cita
                  </Button>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Citas agendadas:</h4>
                  <div className="max-h-56 overflow-y-auto space-y-2">
                    {loadingCitas ? (
                      <CitasSkeleton />
                    ) : citas.length > 0 ? (
                      citas.map((cita, index) => (
                        <div
                          key={cita.id ?? `${cita.datecita}-${index}`}
                          className="border rounded-lg p-3 space-y-1"
                        >
                          {cita.nombre_prospecto && (
                            <p className="text-xs text-primary/80 bg-primary/10 rounded px-2 py-1">
                              📋 {cita.nombre_prospecto}
                              {cita.email_prospecto && ` • ${cita.email_prospecto}`}
                              {cita.telefono_prospecto && ` • ${cita.telefono_prospecto}`}
                            </p>
                          )}
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">{formatDate(cita.datecita)}</span>
                            <span className="text-muted-foreground">{cita.descricita}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No hay citas agendadas.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
