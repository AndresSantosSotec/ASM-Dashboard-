"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import Swal from "sweetalert2";

// 🔧 Configurar Swal con z-index muy alto para que aparezca sobre el modal
Swal.mixin({
  didOpen: (instance: any) => {
    const swalContainer = instance.getHtmlContainer?.()?.parentElement as HTMLElement;
    if (swalContainer) {
      swalContainer.style.zIndex = "9999";
    }
  },
});
import { Button } from "@/components/ui/button";
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

// 💀 Componente Skeleton para estados de carga
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const TableSkeleton = () => (
  <TableBody>
    {[1, 2, 3, 4, 5].map((i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
      </TableRow>
    ))}
  </TableBody>
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

interface Prospecto {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  ultimoCambio: string;
  estado: "Contactado" | "Interesado" | "En proceso";
  asesor: string;
  notasGenerales?: string;
  observaciones?: string;
}

interface Actividad {
  id: number;
  nombre: string;
}

export default function SeguimientoPage() {
  // Estados para prospectos con caché
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Start loading true to fetch/cache check
  const [error, setError] = useState<string>("");

  // 💀 Estados de carga granulares
  const [loadingInteracciones, setLoadingInteracciones] = useState<boolean>(false);
  const [loadingCitas, setLoadingCitas] = useState<boolean>(false);

  // Estado para el prospecto seleccionado con persistencia
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null);

  // Estados para interacciones
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

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  // Token desde contexto y estado para user_id
  const { token } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);

  // Load from localStorage on mount (Client-side only)
  useEffect(() => {
    const loadFromCache = () => {
      // Prospectos
      const cachedProspectos = localStorage.getItem("seguimiento_prospectos_cache");
      const cacheTime = localStorage.getItem("seguimiento_prospectos_cache_time");
      if (cachedProspectos && cacheTime) {
        const now = Date.now();
        const elapsed = now - parseInt(cacheTime);
        if (elapsed < 300000) {
          setProspectos(JSON.parse(cachedProspectos));
          setLoading(false); // Data loaded from cache
        }
      }

      // Selected Prospecto
      const cachedSelected = localStorage.getItem("seguimiento_prospecto_seleccionado");
      if (cachedSelected) setSelectedProspecto(JSON.parse(cachedSelected));

      // Interacciones
      const cachedInteracciones = localStorage.getItem("seguimiento_interacciones");
      if (cachedInteracciones) setInteracciones(JSON.parse(cachedInteracciones));

      // Form state
      setInteractionType(localStorage.getItem("seguimiento_interaction_type") || "");
      setInteractionDate(localStorage.getItem("seguimiento_interaction_date") || "");
      setInteractionDuration(localStorage.getItem("seguimiento_interaction_duration") || "");
      setInteractionNotes(localStorage.getItem("seguimiento_interaction_notes") || "");

      // Citas
      const cachedCitas = localStorage.getItem("seguimiento_citas");
      if (cachedCitas) setCitas(JSON.parse(cachedCitas));

      setAppointmentDate(localStorage.getItem("seguimiento_appointment_date") || getDefaultAppointmentDate());
      setAppointmentDescription(localStorage.getItem("seguimiento_appointment_description") || "");
    };

    loadFromCache();
  }, []);

  // 🔄 Estado para controlar cierre automático del modal
  const [shouldCloseModal, setShouldCloseModal] = useState<boolean>(false);

  // Agrega estos estados nuevos cerca de los demás useState existentes:
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [emailFilter, setEmailFilter] = useState<string>("");
  const [phoneFilter, setPhoneFilter] = useState<string>("");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");

  //filters
  const [filters, setFilters] = useState({
    nombre: "",
    email: "",
    telefono: "",
    estado: "",
  });

  // Optimización: memorizar prospectos filtrados para evitar recalcular en cada render
  const filteredProspectos = useMemo(() => {
    return prospectos.filter((p) => {
      const matchesNombre = (p.nombre || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEmail = (p.email || "").toLowerCase().includes(emailFilter.toLowerCase());
      const matchesTelefono = (p.telefono || "").includes(phoneFilter);
      const matchesEstado = estadoFilter === "all" ? true : p.estado === estadoFilter;
      return matchesNombre && matchesEmail && matchesTelefono && matchesEstado;
    });
  }, [prospectos, searchTerm, emailFilter, phoneFilter, estadoFilter]);

  // Optimización: memorizar prospectos paginados
  const paginatedProspectos = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = currentPage * pageSize;
    return filteredProspectos.slice(startIndex, endIndex);
  }, [filteredProspectos, currentPage, pageSize]);

  // Optimización: memorizar total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(filteredProspectos.length / pageSize);
  }, [filteredProspectos.length, pageSize]);

  // Obtener user_id del localStorage solo en el cliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const _userId = localStorage.getItem("user_id");
      setUserId(_userId);
    }
  }, []);

  // 💾 Persistir interacciones en localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && interacciones.length > 0) {
      localStorage.setItem("seguimiento_interacciones", JSON.stringify(interacciones));
    }
  }, [interacciones]);

  // 💾 Persistir citas en localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && citas.length > 0) {
      localStorage.setItem("seguimiento_citas", JSON.stringify(citas));
    }
  }, [citas]);

  // 💾 Persistir prospecto seleccionado en localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedProspecto) {
        localStorage.setItem("seguimiento_prospecto_seleccionado", JSON.stringify(selectedProspecto));
      } else {
        localStorage.removeItem("seguimiento_prospecto_seleccionado");
      }
    }
  }, [selectedProspecto]);

  // 💾 Persistir campos del formulario de interacciones
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("seguimiento_interaction_type", interactionType);
      localStorage.setItem("seguimiento_interaction_date", interactionDate);
      localStorage.setItem("seguimiento_interaction_duration", interactionDuration);
      localStorage.setItem("seguimiento_interaction_notes", interactionNotes);
    }
  }, [interactionType, interactionDate, interactionDuration, interactionNotes]);

  // 💾 Persistir campos del formulario de citas
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("seguimiento_appointment_date", appointmentDate);
      localStorage.setItem("seguimiento_appointment_description", appointmentDescription);
    }
  }, [appointmentDate, appointmentDescription]);

  // Función para asignar colores según el estado del prospecto
  const getEstadoColor = (estado: Prospecto["estado"]) => {
    switch (estado) {
      case "Contactado":
        return "bg-yellow-100 text-yellow-800";
      case "Interesado":
        return "bg-green-100 text-green-800";
      case "En proceso":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-secondary/30 text-secondary-foreground";
    }
  };

  // Función para formatear la fecha para mostrar en la UI
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString();
  };

  // ⚡ Cargar prospectos y actividades en paralelo con caché optimizado
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      // Verificar si hay caché válido
      const cached = localStorage.getItem("seguimiento_prospectos_cache");
      const cacheTime = localStorage.getItem("seguimiento_prospectos_cache_time");
      if (cached && cacheTime) {
        const now = Date.now();
        const elapsed = now - parseInt(cacheTime);
        if (elapsed < 300000) {
          console.log("✅ Usando caché de prospectos");
          return; // Ya están cargados desde el estado inicial
        }
      }

      setLoading(true);
      setError("");
      try {
        // ⚡ Cargar prospectos y actividades en paralelo
        const [prospectosRes, actividadesRes] = await Promise.all([
          api.get("/prospectos"),
          api.get("/actividades")
        ]);

        console.log("✅ Datos cargados en paralelo");

        const prospectosTransformados: Prospecto[] = prospectosRes.data.data
          .map((item: any) => ({
            id: String(item.id),
            nombre: item.nombre_completo,
            email: item.correo_electronico,
            telefono: item.telefono,
            estado: item.status,
            asesor: item.asesor || "Sin asignar",
            ultimoCambio: item.updated_at ?? "N/A",
            notasGenerales: item.notas_generales ?? "",
            observaciones: item.observaciones ?? "",
          }))
          .sort((a, b) => {
            const getTime = (d: string) => {
              const t = new Date(d).getTime();
              return isNaN(t) ? 0 : t;
            };
            return getTime(b.ultimoCambio) - getTime(a.ultimoCambio);
          });

        setProspectos(prospectosTransformados);
        setActividades(actividadesRes.data);

        // 💾 Guardar en caché
        if (typeof window !== "undefined") {
          localStorage.setItem("seguimiento_prospectos_cache", JSON.stringify(prospectosTransformados));
          localStorage.setItem("seguimiento_prospectos_cache_time", Date.now().toString());
        }
      } catch (err: any) {
        console.error("❌ Error en fetchData:", JSON.stringify(err, null, 2));
        setError(err.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // ⚡ LAZY LOADING: Cargar interacciones y citas solo cuando se abre el modal
  useEffect(() => {
    if (!token || !selectedProspecto) return;

    const fetchModalData = async () => {
      setLoadingInteracciones(true);
      setLoadingCitas(true);
      try {
        // ⚡ Cargar interacciones y citas en paralelo (filtradas por prospecto)
        const [interaccionesRes, citasRes] = await Promise.all([
          api.get(`/interacciones?id_lead=${selectedProspecto.id}`),
          api.get(`/citas?prospecto_id=${selectedProspecto.id}`)
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
        console.error("❌ Error al cargar datos del modal:", JSON.stringify(err.response || err, null, 2));
      } finally {
        setLoadingInteracciones(false);
        setLoadingCitas(false);
      }
    };
    fetchModalData();
  }, [token, selectedProspecto]);

  // Manejo para agregar interacción
  const handleAddInteraction = async () => {
    if (!selectedProspecto) return;
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
    const leadId = parseInt(selectedProspecto.id, 10);

    // Buscar el id_actividades o usar el interactionType directamente si no hay actividades cargadas
    const actividadId = actividades.length > 0
      ? actividades.find((act) => act.id.toString() === interactionType)?.id
      : parseInt(interactionType, 10);

    // Validar que se haya seleccionado una actividad válida
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

    console.log("Enviando interacción:", JSON.stringify(newInteraction, null, 2));

    try {
      const response = await api.post(
        "/interacciones",
        newInteraction
      );
      console.log("✅ Interacción guardada:", response.data);

      // ⚡ OPTIMIZACIÓN: Solo actualizar estado sin recargar todo
      setInteracciones((prev) => Array.isArray(prev) ? [...prev, response.data] : [response.data]);
      setInteractionType("");
      setInteractionDate("");
      setInteractionDuration("");
      setInteractionNotes("");

      // 🧹 Limpiar localStorage de campos del formulario
      if (typeof window !== "undefined") {
        localStorage.removeItem("seguimiento_interaction_type");
        localStorage.removeItem("seguimiento_interaction_date");
        localStorage.removeItem("seguimiento_interaction_duration");
        localStorage.removeItem("seguimiento_interaction_notes");
      }

      // ✅ Toast ligero para mejor UX
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
    } catch (err: any) {
      console.error("❌ Error al guardar interacción:", JSON.stringify(err.response || err, null, 2));
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al guardar la interacción",
      });
    }
  };

  // Manejo para agregar cita
  const handleAddCita = async () => {
    if (!appointmentDate) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Selecciona la fecha para la cita.",
      });
      return;
    }
    const currentToken = token;
    if (!currentToken) {
      Swal.fire({
        icon: "error",
        title: "Error de autenticación",
        text: "Falta el token del usuario autenticado",
      });
      return;
    }

    // 🕒 Construir fecha con la hora seleccionada
    const formattedDate = appointmentDate.includes("T")
      ? appointmentDate + (appointmentDate.includes(":00", appointmentDate.length - 3) ? "" : ":00")
      : appointmentDate + "T09:00:00";

    // Auto-incluir datos del prospecto en la descripción SIEMPRE
    let descripcionFinal = appointmentDescription.trim();
    if (selectedProspecto) {
      const partes = [selectedProspecto.nombre];
      if (selectedProspecto.email) partes.push(selectedProspecto.email);
      if (selectedProspecto.telefono) partes.push(selectedProspecto.telefono);
      const datosProspecto = partes.join(" • ");
      descripcionFinal = descripcionFinal
        ? `${descripcionFinal} | ${datosProspecto}`
        : datosProspecto;
    }

    const newCita = {
      datecita: formattedDate,
      descricita: descripcionFinal || "Cita agendada",
      prospecto_id: selectedProspecto ? parseInt(selectedProspecto.id, 10) : null,
      nombre_prospecto: selectedProspecto?.nombre || null,
      email_prospecto: selectedProspecto?.email || null,
      telefono_prospecto: selectedProspecto?.telefono || null,
    };

    console.log("Enviando cita (hora local):", JSON.stringify(newCita, null, 2));

    try {
      const response = await api.post("/citas", newCita);
      const saved = response.data?.data ?? response.data;
      console.log("✅ Cita guardada:", response.data);

      // ⚡ OPTIMIZACIÓN: Actualizar solo el estado con la nueva cita
      setCitas((prev) => [...prev, saved]);
      setAppointmentDescription("");
      setAppointmentDate(getDefaultAppointmentDate());

      // 🧹 Limpiar localStorage de campos del formulario
      if (typeof window !== "undefined") {
        localStorage.removeItem("seguimiento_appointment_description");
        // No removemos appointment_date porque se resetea a valor por defecto
        localStorage.setItem("seguimiento_appointment_date", getDefaultAppointmentDate());
      }

      // ✅ Toast ligero en lugar de Swal
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
      console.error("❌ Error al guardar cita:", JSON.stringify(err.response || err, null, 2));
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al guardar la cita",
      });
    }
  };

  return (
    <>
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Panel de Seguimiento del Asesor</h1>
            <p className="text-sm text-gray-500">Gestione el seguimiento de sus prospectos asignados</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <Input
            placeholder="Buscar por nombre"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:max-w-xs"
          />
          <Input
            placeholder="Buscar por correo"
            value={emailFilter}
            onChange={(e) => {
              setEmailFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:max-w-xs"
          />
          <Input
            placeholder="Buscar por teléfono"
            value={phoneFilter}
            onChange={(e) => {
              setPhoneFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:max-w-xs"
          />
          <Select
            value={estadoFilter}
            onValueChange={(value) => {
              setEstadoFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:max-w-xs">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="No contactado">No contactado</SelectItem>
              <SelectItem value="En seguimiento">En seguimiento</SelectItem>
              <SelectItem value="Le interesa a futuro">Le interesa a futuro</SelectItem>
              <SelectItem value="Perdido">Perdido</SelectItem>
              <SelectItem value="Inscrito">Inscrito</SelectItem>
              <SelectItem value="Promesa de pago">Promesa de pago</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2 className="text-lg font-semibold mb-4">Lista de Prospectos</h2>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              {loading ? (
                <TableSkeleton />
              ) : (
                <TableBody>
                  {paginatedProspectos.map((prospecto) => (
                    <TableRow key={prospecto.id}>
                      <TableCell>{prospecto.nombre}</TableCell>
                      <TableCell>{prospecto.email}</TableCell>
                      <TableCell>{prospecto.telefono}</TableCell>
                      <TableCell>
                        <Badge className={getEstadoColor(prospecto.estado)}>
                          {prospecto.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="default" onClick={() => setSelectedProspecto(prospecto)}>
                          Ver detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </div>
          <div className="flex justify-end space-x-4 mt-4">
            <Button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              Anterior
            </Button>
            <span className="self-center">
              Página {currentPage} de {totalPages}
            </span>
            <Button onClick={() => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))} disabled={currentPage === totalPages}>
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedProspecto} onOpenChange={() => setSelectedProspecto(null)}>
        {/* Ajuste general del modal para que no exceda el 80% del alto de la ventana */}
        {/* z-index en el DialogContent ya es z-[1001] en dialog.tsx */}
        <DialogContent aria-describedby={undefined} className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Detalles del prospecto</DialogTitle>
          <div className="max-h-[80vh] overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold flex justify-between items-center">
                    Información del Prospecto
                    <Badge className={selectedProspecto ? getEstadoColor(selectedProspecto.estado) : ""}>
                      {selectedProspecto?.estado}
                    </Badge>
                  </h2>
                  <div className="mt-4 space-y-2">
                    <p className="text-lg font-medium">{selectedProspecto?.nombre}</p>
                    <p className="text-muted-foreground">{selectedProspecto?.email}</p>
                    <p className="text-muted-foreground">{selectedProspecto?.telefono}</p>
                  </div>
                </div>
                <div>
                  {(selectedProspecto?.notasGenerales || selectedProspecto?.observaciones) && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                      <h3 className="text-md font-semibold text-primary flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        Notas del Prospecto
                      </h3>
                      {selectedProspecto?.notasGenerales && (
                        <div>
                          <p className="text-xs font-semibold text-primary/80 mb-1">Notas Generales:</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedProspecto.notasGenerales}</p>
                        </div>
                      )}
                      {selectedProspecto?.observaciones && (
                        <div>
                          <p className="text-xs font-semibold text-primary/80 mb-1">Observaciones:</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedProspecto.observaciones}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-md font-semibold mb-2">Historial de Actividades</h3>
                  {/* Contenedor con scroll para interacciones */}
                  <div className="max-h-72 overflow-y-auto space-y-4">
                    {loadingInteracciones ? (
                      <InteractionsSkeleton />
                    ) : selectedProspecto &&
                      Array.isArray(interacciones) &&
                      interacciones.filter((inter) => inter.id_lead === parseInt(selectedProspecto.id, 10)).length > 0 ? (
                      interacciones
                        .filter((inter: any) => inter.id_lead === parseInt(selectedProspecto.id, 10))
                        .map((actividad, index) => (
                          <div key={index} className="border rounded p-3">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">
                                {actividades.find((act) => act.id === actividad.id_actividades)?.nombre ||
                                  actividad.id_actividades}
                              </span>
                              <span className="text-gray-500">{actividad.fecha}</span>
                            </div>
                            <p className="text-sm mt-1">{actividad.notas}</p>
                            <div className="flex justify-between text-sm mt-2 text-gray-500">
                              <span>Duración: {actividad.duracion}</span>
                              <span>{actividad.asesor}</span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-gray-500">No hay interacciones registradas.</p>
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
                    <Button className="w-full" onClick={handleAddInteraction}>
                      Agregar Interacción
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-semibold mb-4">Fecha y Cita</h3>
                  {/* Info del prospecto asociado */}
                  {selectedProspecto && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                      <p className="text-xs text-blue-700">
                        📋 Cita para: <strong>{selectedProspecto.nombre}</strong>
                        {selectedProspecto.email && ` • ${selectedProspecto.email}`}
                        {selectedProspecto.telefono && ` • ${selectedProspecto.telefono}`}
                      </p>
                    </div>
                  )}
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
                    {/* Contenedor con scroll para citas */}
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
                              <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1">
                                📋 {cita.nombre_prospecto}
                                {cita.email_prospecto && ` • ${cita.email_prospecto}`}
                                {cita.telefono_prospecto && ` • ${cita.telefono_prospecto}`}
                              </p>
                            )}
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium">{formatDate(cita.datecita)}</span>
                              <span className="text-gray-600">{cita.descricita}</span>
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
    </>
  );
}
