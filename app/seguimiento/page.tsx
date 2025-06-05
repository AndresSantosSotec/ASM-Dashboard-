"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Prospecto {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  estado: "Contactado" | "Interesado" | "En proceso";
  asesor: string;
}

interface Actividad {
  id: number;
  nombre: string;
}

export default function SeguimientoPage() {
  // Estados para prospectos
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Estado para el prospecto seleccionado
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null);

  // Estados para interacciones
  const [interacciones, setInteracciones] = useState<any[]>([]);
  const [interactionType, setInteractionType] = useState<string>("");
  const [interactionDate, setInteractionDate] = useState<string>("");
  const [interactionDuration, setInteractionDuration] = useState<string>("");
  const [interactionNotes, setInteractionNotes] = useState<string>("");

  // Estados para citas
  const [citas, setCitas] = useState<any[]>([]);
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [appointmentDescription, setAppointmentDescription] = useState<string>("");

  // Estado para almacenar actividades
  const [actividades, setActividades] = useState<Actividad[]>([]);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  // Token desde contexto y estado para user_id
  const { token } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);

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

  // Crea un array derivado en base a los filtros aplicados:
  const filteredProspectos = prospectos.filter((p) => {
    const matchesNombre = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmail = p.email.toLowerCase().includes(emailFilter.toLowerCase());
    const matchesTelefono = p.telefono.includes(phoneFilter);
    const matchesEstado = estadoFilter === "all" ? true : p.estado === estadoFilter;
    return matchesNombre && matchesEmail && matchesTelefono && matchesEstado;
  });

  // Obtener user_id del localStorage solo en el cliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const _userId = localStorage.getItem("user_id");
      setUserId(_userId);
    }
  }, []);

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
        return "bg-gray-100 text-gray-800";
    }
  };

  // Función para formatear la fecha para mostrar en la UI
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString();
  };

  // Cargar prospectos desde la API
  useEffect(() => {
    if (!token) return;
    const fetchProspectos = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/prospectos");
        const json = res.data;
        console.log("Respuesta completa de prospectos:", json);
        const prospectosTransformados: Prospecto[] = json.data.map((item: any) => ({
          id: String(item.id),
          nombre: item.nombre_completo,
          email: item.correo_electronico,
          telefono: item.telefono,
          estado: item.status,
          asesor: item.asesor || "Sin asignar",
        }));
        setProspectos(prospectosTransformados);
      } catch (err: any) {
        console.error("Error en fetchProspectos:", JSON.stringify(err, null, 2));
        setError(err.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    };
    fetchProspectos();
  }, [token]);

  // Cargar interacciones filtradas por prospecto
  useEffect(() => {
    if (!token || !selectedProspecto) return;

    const fetchInteracciones = async () => {
      try {
        const response = await api.get(`/interacciones?id_lead=${selectedProspecto.id}`);
        console.log("Interacciones recibidas:", response.data);
        if (Array.isArray(response.data.data)) {
          setInteracciones(response.data.data);
        } else {
          console.warn("La respuesta de interacciones no es un arreglo:", response.data);
          setInteracciones([]);
        }
      } catch (err: any) {
        console.error("Error en fetchInteracciones:", JSON.stringify(err.response || err, null, 2));
      }
    };
    fetchInteracciones();
  }, [token, selectedProspecto]);

  // Cargar interacciones globalmente (si fuera necesario)
  useEffect(() => {
    if (!token) return;
    const fetchInteracciones = async () => {
      try {
        const response = await api.get("/interacciones");
        console.log("Interacciones globales recibidas:", response.data);
        if (Array.isArray(response.data)) {
          setInteracciones(response.data);
        } else {
          console.warn("La respuesta de interacciones no es un arreglo:", response.data);
          setInteracciones([]);
        }
      } catch (err: any) {
        console.error("Error en fetchInteracciones:", JSON.stringify(err.response || err, null, 2));
      }
    };
    fetchInteracciones();
  }, [token]);

  // Cargar citas desde la API
  useEffect(() => {
    if (!token) return;
    const fetchCitas = async () => {
      try {
        const response = await api.get("/citas");
        console.log("Citas recibidas:", response.data);
        const citasArray = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];
        setCitas(citasArray);
      } catch (err: any) {
        console.error("Error en fetchCitas:", JSON.stringify(err.response || err, null, 2));
      }
    };
    fetchCitas();
  }, [token]);

  // Cargar actividades desde la API
  useEffect(() => {
    if (!token) return;
    const fetchActividades = async () => {
      try {
        const response = await api.get("/actividades");
        console.log("Actividades recibidas:", response.data);
        setActividades(response.data);
      } catch (err: any) {
        console.error("Error en fetchActividades:", JSON.stringify(err.response || err, null, 2));
      }
    };
    fetchActividades();
  }, [token]);

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
    const newInteraction = {
      id_lead: leadId,
      id_actividades: actividades.find((act) => act.id.toString() === interactionType)?.id,
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
      setInteracciones((prev) => Array.isArray(prev) ? [...prev, response.data] : [response.data]);
      setInteractionType("");
      setInteractionDate("");
      setInteractionDuration("");
      setInteractionNotes("");
      Swal.fire({
        icon: "success",
        title: "¡Hecho!",
        text: "Interacción guardada correctamente",
        showConfirmButton: false,
        timer: 1500,
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
    if (!appointmentDate || !appointmentDescription.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Completa la fecha y la descripción para la cita.",
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
    const formattedDate = appointmentDate;
    const newCita = {
      datecita: formattedDate,
      descricita: appointmentDescription,
    };

    console.log("Enviando cita:", JSON.stringify(newCita, null, 2));

    try {
      const response = await api.post(
        "/citas",
        newCita
      );
      console.log("✅ Cita guardada:", response.data);
      setCitas((prev) => Array.isArray(prev) ? [...prev, response.data] : [response.data]);
      setAppointmentDescription("");
      setAppointmentDate("");
      Swal.fire({
        icon: "success",
        title: "¡Cita Agendada!",
        text: "Cita agendada correctamente",
        showConfirmButton: false,
        timer: 1500,
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

      {loading && <p>Cargando prospectos...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
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
              <TableBody>
                {filteredProspectos
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((prospecto) => (
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
            </Table>
          </div>
          <div className="flex justify-end space-x-4 mt-4">
            <Button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              Anterior
            </Button>
            <span className="self-center">
              Página {currentPage} de {Math.ceil(prospectos.length / pageSize)}
            </span>
            <Button onClick={() => setCurrentPage((prev) => (prev < Math.ceil(prospectos.length / pageSize) ? prev + 1 : prev))} disabled={currentPage === Math.ceil(prospectos.length / pageSize)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedProspecto} onOpenChange={() => setSelectedProspecto(null)}>
        {/* Ajuste general del modal para que no exceda el 80% del alto de la ventana */}
        <DialogContent className="max-w-4xl">
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
                    <p className="text-gray-500">{selectedProspecto?.email}</p>
                    <p className="text-gray-500">{selectedProspecto?.telefono}</p>
                  </div>
                </div>
                <div>

                </div>
                <div>
                  <h3 className="text-md font-semibold mb-2">Historial de Actividades</h3>
                  {/* Contenedor con scroll para interacciones */}
                  <div className="max-h-72 overflow-y-auto space-y-4">
                    {selectedProspecto &&
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
                    <Input
                      type="datetime-local"
                      placeholder="Fecha de interacción"
                      value={interactionDate}
                      onChange={(e) => setInteractionDate(e.target.value)}
                    />
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
                  <Input
                    type="datetime-local"
                    placeholder="Fecha de la cita"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                  />
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
                      {citas.length > 0 ? (
                        citas.map((cita, index) => (
                          <div
                            key={cita.id ?? `${cita.datecita}-${index}`}
                            className="flex justify-between items-center text-sm border-b py-2"
                          >
                            <span>{formatDate(cita.datecita)}</span>
                            <span>{cita.descricita}</span>
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
    </div>
  );
}
