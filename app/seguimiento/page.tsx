"use client";

import { useState, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
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

export default function SeguimientoPage() {
  // Estados para prospectos provenientes de la API
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Estado para el prospecto seleccionado (para ver detalles y agregar interacciones)
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null);

  // Estados para las interacciones almacenadas en localStorage
  const [interacciones, setInteracciones] = useState<any[]>([]);
  const [interactionType, setInteractionType] = useState<string>("");
  const [interactionDate, setInteractionDate] = useState<string>("");
  const [interactionDuration, setInteractionDuration] = useState<string>("");
  const [interactionNotes, setInteractionNotes] = useState<string>("");

  // Estados para las citas (appointments) almacenadas en localStorage
  const [citas, setCitas] = useState<any[]>([]);
  // Se utiliza el calendario para seleccionar la fecha de la cita
  const [date, setDate] = useState<Date | undefined>(new Date());
  // Estado para el detalle o descripción de la cita
  const [appointmentDescription, setAppointmentDescription] = useState<string>("");

  // Estados para paginación del data table de prospectos
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  // Función que asigna colores al estado del prospecto
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

  // useEffect para obtener prospectos desde la API
  useEffect(() => {
    const fetchProspectos = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const url = "http://127.0.0.1:8000/api/prospectos";
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          throw new Error(`Error al obtener prospectos: status ${res.status}`);
        }
        const json = await res.json();
        // Se transforma la respuesta para adecuarla al modelo de Prospecto.
        const prospectosTransformados: Prospecto[] = json.data.map((item: any) => ({
          id: String(item.id),
          nombre: item.nombre_completo,
          email: item.correo_electronico,
          telefono: item.telefono,
          estado: item.status, // Se asume que el API envía "Contactado", "Interesado" o "En proceso"
          asesor: item.asesor || "Sin asignar",
        }));
        setProspectos(prospectosTransformados);
      } catch (err: any) {
        setError(err.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    };
    fetchProspectos();
  }, []);

  // useEffect para cargar las interacciones guardadas en localStorage
  useEffect(() => {
    const storedInteractions = localStorage.getItem("interacciones");
    if (storedInteractions) {
      setInteracciones(JSON.parse(storedInteractions));
    }
  }, []);

  // useEffect para cargar las citas guardadas en localStorage
  useEffect(() => {
    const storedCitas = localStorage.getItem("citas");
    if (storedCitas) {
      setCitas(JSON.parse(storedCitas));
    }
  }, []);

  // Función para agregar una interacción y guardarla en localStorage
  const handleAddInteraction = () => {
    if (!selectedProspecto) return;

    // Validación simple para campos esenciales
    if (!interactionType || !interactionDate) {
      alert("Por favor, complete el tipo de interacción y la fecha.");
      return;
    }

    const newInteraction = {
      leadId: selectedProspecto.id,
      tipo: interactionType,
      fecha: interactionDate,
      duracion: interactionDuration,
      notas: interactionNotes,
      asesor: selectedProspecto.asesor,
    };

    const updatedInteractions = [...interacciones, newInteraction];
    setInteracciones(updatedInteractions);
    localStorage.setItem("interacciones", JSON.stringify(updatedInteractions));

    // Se limpian los campos del formulario
    setInteractionType("");
    setInteractionDate("");
    setInteractionDuration("");
    setInteractionNotes("");
  };

  // Filtrar las interacciones del prospecto seleccionado
  const prospectoInteractions = selectedProspecto
    ? interacciones.filter((inter: any) => inter.leadId === selectedProspecto.id)
    : [];

  // Cálculo de paginación para prospectos
  const totalPages = Math.ceil(prospectos.length / pageSize);
  const paginatedProspectos = prospectos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Función para agregar una cita y guardarla en localStorage
  const handleAddCita = () => {
    if (!date || !appointmentDescription.trim()) {
      alert("Completa la fecha y la descripción para la cita.");
      return;
    }

    const newCita = {
      id: new Date().getTime(), // Uso de timestamp como ID único
      fecha: date.toISOString(),
      descripcion: appointmentDescription,
    };

    const updatedCitas = [...citas, newCita];
    setCitas(updatedCitas);
    localStorage.setItem("citas", JSON.stringify(updatedCitas));
    setAppointmentDescription("");
  };

  // Función para formatear la fecha (desde ISO string) a un formato local
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString();
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Panel de Seguimiento del Asesor
          </h1>
          <p className="text-sm text-gray-500">
            Gestione el seguimiento de sus prospectos asignados
          </p>
        </div>
      </div>

      {/* Mostrar mensajes de carga o error */}
      {loading && <p>Cargando prospectos...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Data Table de prospectos con paginación */}
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
                  <TableHead>Asesor</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
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
                    <TableCell>{prospecto.asesor}</TableCell>
                    <TableCell>
                      <Button
                        variant="default"
                        onClick={() => setSelectedProspecto(prospecto)}
                      >
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Controles de paginación */}
          <div className="flex justify-end space-x-4 mt-4">
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.max(prev - 1, 1))
              }
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="self-center">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              onClick={() =>
                setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))
              }
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modal para detalles del prospecto, interacciones y citas */}
      <Dialog open={!!selectedProspecto} onOpenChange={() => setSelectedProspecto(null)}>
        <DialogContent className="max-w-4xl">
          <div className="grid grid-cols-2 gap-6">
            {/* Información y actividad del prospecto */}
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
                <h3 className="text-md font-semibold mb-2">
                  Asesor asignado: {selectedProspecto?.asesor}
                </h3>
                <Select defaultValue={selectedProspecto?.estado.toLowerCase()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contactado">Contactado</SelectItem>
                    <SelectItem value="interesado">Interesado</SelectItem>
                    <SelectItem value="en_proceso">En proceso</SelectItem>
                    <SelectItem value="matriculado">Matriculado</SelectItem>
                    <SelectItem value="no_interesado">No volver a contactar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="text-md font-semibold mb-2">Historial de Actividades</h3>
                <div className="space-y-4">
                  {prospectoInteractions.length > 0 ? (
                    prospectoInteractions.map((actividad, index) => (
                      <div key={index} className="border rounded p-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{actividad.tipo}</span>
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

            {/* Sección para agregar interacción y administrar citas */}
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-semibold mb-4">Agregar Interacción</h3>
                <div className="space-y-4">
                  <Select value={interactionType} onValueChange={(value) => setInteractionType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de interacción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llamada">Llamada</SelectItem>
                      <SelectItem value="correo">Correo</SelectItem>
                      <SelectItem value="reunion">Reunión</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="datetime-local"
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
                <h3 className="text-md font-semibold mb-4">Calendario y Citas</h3>
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
                <div className="mt-4 space-y-4">
                  {/* Formulario para agregar una nueva cita */}
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
                  <div className="space-y-2">
                    {citas.length > 0 ? (
                      citas.map((cita) => (
                        <div key={cita.id} className="flex justify-between items-center text-sm border-b py-2">
                          <span>{formatDate(cita.fecha)}</span>
                          <span>{cita.descripcion}</span>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
