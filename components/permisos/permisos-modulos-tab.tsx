"use client";

import React from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/apiConfig";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Save,
  X,
  Plus,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
  BarChart2,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  Mail,
  Settings,
  Shield,
  Users,
  DollarSign,
  BookOpen,
  ClipboardList,
  Activity,
  Copy,
  UserCheck,
  FileSignature,
  BarChart,
  LayoutDashboard,
  GraduationCapIcon,
  CreditCard,
  Bell,
  Award,
  Medal,
  PieChart,
  RefreshCw,
  Phone,
  FileCheck as FileCheckIcon,
  Send,
  Key,
  LogIn,
  Database,
  Clock,
  LogOut,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// ----------------------------------------------------------------------
// Mapeo de iconos: relaciona el nombre del icono con el componente
// ----------------------------------------------------------------------
const iconMap: { [key: string]: React.ElementType } = {
  BarChart2,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  Mail,
  Settings,
  Shield,
  Users,
  DollarSign,
  BookOpen,
  ClipboardList,
  Activity,
  Copy,
  UserCheck,
  Plus,
  FileSignature,
  BarChart,
  LayoutDashboard,
  GraduationCapIcon,
  CreditCard,
  Bell,
  Award,
  Medal,
  PieChart,
  RefreshCw,
  Phone,
  FileCheck: FileCheckIcon,
  Send,
  Key,
  LogIn,
  Database,
  Clock,
  LogOut,
};

// ===============================
// INTERFACES Y ESQUEMAS
// ===============================

// Interfaz para Módulo (en español)
interface Modulo {
  id: number;
  nombre: string;
  descripcion: string;
  vistas: number;
  activo: boolean;
  icono?: string;
}

// Esquema para validación de Módulos
const moduloSchema = z.object({
  nombre: z.string().min(2, "El nombre es requerido"),
  descripcion: z.string().min(2, "La descripción es requerida"),
  activo: z.boolean().default(true),
  icono: z.string().optional(),
});

// Interfaz para Vista del Módulo
export interface Vista {
  id: number;
  module_id: number;
  menu: string;
  submenu?: string;
  view_path: string;
  status: boolean;
  order_num: number;
  icono?: string;
}

// Esquema para validación de Vistas
const vistaSchema = z.object({
  module_id: z.number({ required_error: "El módulo es requerido" }),
  menu: z.string().min(1, "El menú es requerido"),
  submenu: z.string().optional().nullable(),
  view_path: z.string().min(1, "La ruta de la vista es requerida"),
  status: z.boolean().default(true),
  order_num: z.preprocess(
    (a) => Number(a),
    z.number({ invalid_type_error: "El orden debe ser un número" })
  ),
  icono: z.string().optional(),
});

// ===============================
// COMPONENTE: PermisosModulosTab
// ===============================
export default function PermisosModulosTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentModulo, setCurrentModulo] = useState<Modulo | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  // Estado para mostrar el modal de creación de vistas
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const form = useForm<z.infer<typeof moduloSchema>>({
    resolver: zodResolver(moduloSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      activo: true,
      icono: "",
    },
  });

  // Al cargar el componente, traemos los módulos desde la API
  useEffect(() => {
    fetchModulos();
  }, []);

  // Transforma los datos de la API al formato de la interfaz en español
  const transformModule = (moduleData: any): Modulo => ({
    id: moduleData.id,
    nombre: moduleData.name,
    descripcion: moduleData.description,
    vistas: moduleData.view_count,
    activo: moduleData.status,
    icono: moduleData.icono || "",
  });

  const fetchModulos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/modules`);
      const modulosTransformados = response.data.map((m: any) =>
        transformModule(m)
      );
      setModulos(modulosTransformados);
    } catch (error) {
      console.error("Error al obtener los módulos:", error);
    }
  };

  // Filtrado usando las propiedades en español
  const filteredModulos = modulos.filter(
    (modulo) =>
      modulo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      modulo.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialogModule = (modulo: Modulo | null = null, editing = false) => {
    setCurrentModulo(modulo);
    setIsEditing(editing);
    if (editing && modulo) {
      form.reset({
        nombre: modulo.nombre,
        descripcion: modulo.descripcion,
        activo: modulo.activo,
        icono: modulo.icono || "",
      });
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        activo: true,
        icono: "",
      });
    }
    setIsDialogOpen(true);
  };

  // Envío del formulario para módulos
  const onSubmit = async (data: z.infer<typeof moduloSchema>) => {
    try {
      const payload = {
        name: data.nombre,
        description: data.descripcion,
        status: data.activo,
        icono: data.icono,
      };
      if (isEditing && currentModulo) {
          const response = await axios.put(
            `${API_BASE_URL}/api/modules/${currentModulo.id}`,
            payload
          );
        const moduloActualizado = transformModule(response.data);
        setModulos(
          modulos.map((m) =>
            m.id === currentModulo.id ? moduloActualizado : m
          )
        );
      } else {
          const response = await axios.post(
            `${API_BASE_URL}/api/modules`,
            payload
          );
        const nuevoModulo = transformModule(response.data);
        setModulos([...modulos, nuevoModulo]);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error al enviar datos del módulo:", error);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const modulo = modulos.find((m) => m.id === id);
      if (!modulo) return;
      const payload = { status: !modulo.activo };
        const response = await axios.put(
          `${API_BASE_URL}/api/modules/${id}`,
          payload
        );
      const moduloActualizado = transformModule(response.data);
      setModulos(
        modulos.map((m) => (m.id === id ? moduloActualizado : m))
      );
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
    }
  };

  const handleDeleteModulo = async (id: number) => {
    try {
      // Verificar si el módulo tiene vistas
      const modulo = modulos.find((m) => m.id === id);
      if (modulo && modulo.vistas > 0) {
        // Mostrar una advertencia al usuario
        const result = await Swal.fire({
          title: "Advertencia",
          text: "Este módulo contiene vistas asociadas. Al eliminarlo, también se eliminarán todas sus vistas. ¿Desea continuar?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, eliminar",
          cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) {
          return;
        }
      }
        await axios.delete(`${API_BASE_URL}/api/modules/${id}`);
      setModulos(modulos.filter((m) => m.id !== id));
      // Mostrar mensaje de éxito
      Swal.fire({
        title: "Éxito",
        text: "Módulo eliminado correctamente",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error al eliminar el módulo:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo eliminar el módulo. Es posible que tenga vistas asociadas.",
        icon: "error",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y botones */}
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => handleOpenDialogModule(null, false)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Módulo
          </Button>
          <Button onClick={() => setIsViewModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Vista
          </Button>
        </div>
      </div>

      {/* Tabla de módulos */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px] text-center">Acciones</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-center">Vistas</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredModulos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No se encontraron módulos
                </TableCell>
              </TableRow>
            ) : (
              filteredModulos.map((modulo) => (
                <TableRow key={modulo.id}>
                  <TableCell className="p-2 text-center">
                    <div className="flex justify-center space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenDialogModule(modulo, true)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="icon"
                        className={`h-7 w-7 ${
                          modulo.activo ? "" : "bg-green-600 hover:bg-green-700"
                        }`}
                        onClick={() => handleToggleStatus(modulo.id)}
                      >
                        {modulo.activo ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteModulo(modulo.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{modulo.id}</TableCell>
                  <TableCell className="font-medium flex items-center">
                    {modulo.icono &&
                      iconMap[modulo.icono] &&
                      React.createElement(iconMap[modulo.icono], {
                        className: "h-4 w-4 mr-1",
                      })}
                    {modulo.nombre}
                  </TableCell>
                  <TableCell>{modulo.descripcion}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-blue-50">
                      {modulo.vistas}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {modulo.activo ? (
                      <Badge
                        variant="success"
                        className="bg-green-100 text-green-800 hover:bg-green-100"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" /> Activo
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="bg-red-100 text-red-800 hover:bg-red-100"
                      >
                        <XCircle className="mr-1 h-3 w-3" /> Inactivo
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal para crear/editar módulos */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Módulo" : "Nuevo Módulo"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica los datos del módulo existente."
                : "Completa el formulario para crear un nuevo módulo."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del módulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input placeholder="Descripción del módulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icono</FormLabel>
                    <FormControl>
                      <select {...field} className="input">
                        <option value="">Selecciona un icono</option>
                        <option value="BarChart2">BarChart2</option>
                        <option value="Calendar">Calendar</option>
                        <option value="ChevronDown">ChevronDown</option>
                        <option value="ChevronRight">ChevronRight</option>
                        <option value="FileText">FileText</option>
                        <option value="Home">Home</option>
                        <option value="Mail">Mail</option>
                        <option value="Settings">Settings</option>
                        <option value="Shield">Shield</option>
                        <option value="Users">Users</option>
                        <option value="DollarSign">DollarSign</option>
                        <option value="BookOpen">BookOpen</option>
                        <option value="ClipboardList">ClipboardList</option>
                        <option value="Activity">Activity</option>
                        <option value="Copy">Copy</option>
                        <option value="UserCheck">UserCheck</option>
                        <option value="Plus">Plus</option>
                        <option value="FileSignature">FileSignature</option>
                        <option value="BarChart">BarChart</option>
                        <option value="LayoutDashboard">LayoutDashboard</option>
                        <option value="GraduationCapIcon">GraduationCapIcon</option>
                        <option value="CreditCard">CreditCard</option>
                        <option value="Bell">Bell</option>
                        <option value="Award">Award</option>
                        <option value="Medal">Medal</option>
                        <option value="PieChart">PieChart</option>
                        <option value="RefreshCw">RefreshCw</option>
                        <option value="Phone">Phone</option>
                        <option value="FileCheck">FileCheck</option>
                        <option value="Send">Send</option>
                        <option value="Key">Key</option>
                        <option value="LogIn">LogIn</option>
                        <option value="Database">Database</option>
                        <option value="Clock">Clock</option>
                        <option value="LogOut">LogOut</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Módulo Activo</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        El módulo estará disponible en el sistema
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Guardar Cambios" : "Crear Módulo"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal para crear vistas */}
      <ModuleViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        modules={modulos}
        onViewCreated={(nuevaVista: Vista) => {
          // Actualizamos el contador de vistas en el módulo seleccionado
          setModulos(
            modulos.map((m) =>
              m.id === nuevaVista.module_id ? { ...m, vistas: m.vistas + 1 } : m
            )
          );
        }}
      />
    </div>
  );
}

// ===============================
// COMPONENTE: ModuleViewModal (para creación de vistas)
// ===============================
interface ModuleViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: Modulo[];
  onViewCreated: (nuevaVista: Vista) => void;
}

function ModuleViewModal({
  isOpen,
  onClose,
  modules,
  onViewCreated,
}: ModuleViewModalProps) {
  // Extendemos el esquema de vista para incluir module_id y el campo icono
  const extendedVistaSchema = vistaSchema.extend({
    module_id: z.number({ required_error: "El módulo es requerido" }),
  });

  const form = useForm<z.infer<typeof extendedVistaSchema>>({
    resolver: zodResolver(extendedVistaSchema),
    defaultValues: {
      module_id: 0,
      menu: "",
      submenu: "",
      view_path: "",
      status: true,
      order_num: 1,
      icono: "",
    },
  });

  // Actualizamos el valor de module_id cuando la lista de módulos cambie
  useEffect(() => {
    if (modules.length > 0) {
      form.setValue("module_id", modules[0].id);
    }
  }, [modules, form]);

  const onSubmit = async (data: z.infer<typeof extendedVistaSchema>) => {
    try {
      const { module_id, ...payload } = data;
      // Validación extra: asegurar que module_id sea un valor válido (diferente de 0)
      if (!module_id || module_id === 0) {
        Swal.fire({
          title: "Error",
          text: "Por favor, selecciona un módulo válido.",
          icon: "error",
        });
        return;
      }
      console.log("Enviando solicitud para crear vista en el módulo:", module_id);
      // Se incluye el campo icono en el payload
        const response = await axios.post(
          `${API_BASE_URL}/api/modules/${module_id}/views`,
          { ...payload, icono: data.icono }
        );
      console.log("Respuesta del servidor:", response.data);
      const nuevaVista: Vista = response.data.data;
      onViewCreated(nuevaVista);
      onClose();
      form.reset();
    } catch (error: any) {
      console.error("Error al crear la vista:", error.response?.data || error);
      Swal.fire({
        title: "Error",
        text:
          error.response?.data?.message ||
          "Ocurrió un error al crear la vista.",
        icon: "error",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Vista</DialogTitle>
          <DialogDescription>
            Completa el formulario para asignar una nueva vista al módulo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Select para elegir el módulo */}
            <FormField
              control={form.control}
              name="module_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Módulo</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="input"
                      onChange={(e) =>
                        field.onChange(Number(e.target.value))
                      }
                    >
                      {modules && modules.length > 0 ? (
                        modules.map((modulo) => (
                          <option key={modulo.id} value={modulo.id}>
                            {modulo.nombre}
                          </option>
                        ))
                      ) : (
                        <option value={0}>No hay módulos</option>
                      )}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="menu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menú</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del menú" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="submenu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submenú</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre del submenú (opcional)"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="view_path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ruta de la Vista</FormLabel>
                  <FormControl>
                    <Input placeholder="/ruta/de/la/vista" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icono</FormLabel>
                  <FormControl>
                    <select {...field} className="input">
                      <option value="">Selecciona un icono</option>
                      <option value="BarChart2">BarChart2</option>
                      <option value="Calendar">Calendar</option>
                      <option value="ChevronDown">ChevronDown</option>
                      <option value="ChevronRight">ChevronRight</option>
                      <option value="FileText">FileText</option>
                      <option value="Home">Home</option>
                      <option value="Mail">Mail</option>
                      <option value="Settings">Settings</option>
                      <option value="Shield">Shield</option>
                      <option value="Users">Users</option>
                      <option value="DollarSign">DollarSign</option>
                      <option value="BookOpen">BookOpen</option>
                      <option value="ClipboardList">ClipboardList</option>
                      <option value="Activity">Activity</option>
                      <option value="Copy">Copy</option>
                      <option value="UserCheck">UserCheck</option>
                      <option value="Plus">Plus</option>
                      <option value="FileSignature">FileSignature</option>
                      <option value="BarChart">BarChart</option>
                      <option value="LayoutDashboard">LayoutDashboard</option>
                      <option value="GraduationCapIcon">GraduationCapIcon</option>
                      <option value="CreditCard">CreditCard</option>
                      <option value="Bell">Bell</option>
                      <option value="Award">Award</option>
                      <option value="Medal">Medal</option>
                      <option value="PieChart">PieChart</option>
                      <option value="RefreshCw">RefreshCw</option>
                      <option value="Phone">Phone</option>
                      <option value="FileCheck">FileCheck</option>
                      <option value="Send">Send</option>
                      <option value="Key">Key</option>
                      <option value="LogIn">LogIn</option>
                      <option value="Database">Database</option>
                      <option value="Clock">Clock</option>
                      <option value="LogOut">LogOut</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order_num"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orden</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Orden" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel>Vista Activa</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Vista</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
