"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/apiConfig";
import Swal from "sweetalert2";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, UserCog, Plus, Save, X, Trash } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

// ===============================
// INTERFACES Y ESQUEMA
// ===============================
interface Rol {
  id: number;
  name: string;
  description?: string;
  is_system: boolean; // supondremos que true = Inactivo, false = Activo
  user_count?: number;
  type?: string;
  created_at?: string;
  // Ajusta si tu tabla roles tiene otros campos.
}

// Para crear/editar un rol
const rolSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  description: z.string().optional(),
  is_system: z.boolean().default(false),
  type: z.string().optional(),
});

export default function PermisosRolesTab() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("todos");
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);

  // Para crear/editar rol
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Modal para "Asignar Permisos"
  const [isPermisosModalOpen, setIsPermisosModalOpen] = useState(false);

  // react-hook-form para crear/editar
  const form = useForm<z.infer<typeof rolSchema>>({
    resolver: zodResolver(rolSchema),
    defaultValues: {
      name: "",
      description: "",
      is_system: false,
      type: "",
    },
  });

  // ===============================
  // useEffect: cargar roles de la API
  // ===============================
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/roles`);
      // Asumimos que response.data es un array de roles
      setRoles(response.data);
    } catch (error) {
      console.error("Error al obtener roles:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo obtener la lista de roles.",
        icon: "error",
      });
    }
  };

  // ===============================
  // Funciones de CRUD
  // ===============================
  // Crear o editar un rol
  const onSubmitRol = async (data: z.infer<typeof rolSchema>) => {
    try {
      if (isEditing && selectedRol) {
        // EDITAR
        const response = await axios.put(
          `${API_BASE_URL}/api/roles/${selectedRol.id}`,
          data
        );
        // Actualizamos en el estado
        setRoles((prev) =>
          prev.map((r) => (r.id === selectedRol.id ? response.data : r))
        );
        Swal.fire({
          title: "Rol actualizado",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // CREAR
        const response = await axios.post(`${API_BASE_URL}/api/roles`, data);
        setRoles((prev) => [...prev, response.data]);
        Swal.fire({
          title: "Rol creado",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error al guardar rol:", error);
      let msg = "Ocurrió un error al guardar el rol.";
      if (error.response?.data?.error) {
        msg = error.response.data.error;
      }
      Swal.fire({
        title: "Error",
        text: msg,
        icon: "error",
      });
    }
  };

  // Eliminar un rol
  const handleDeleteRol = async (rol: Rol) => {
    const result = await Swal.fire({
      title: "¿Eliminar Rol?",
      text: `¿Estás seguro de que deseas eliminar el rol "${rol.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/roles/${rol.id}`);
      setRoles((prev) => prev.filter((r) => r.id !== rol.id));
      Swal.fire({
        title: "Rol eliminado",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      // Si el rol borrado está seleccionado, lo deseleccionamos
      if (selectedRol?.id === rol.id) {
        setSelectedRol(null);
      }
    } catch (error) {
      console.error("Error al eliminar el rol:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo eliminar el rol.",
        icon: "error",
      });
    }
  };

  // ===============================
  // Abrir modales y helpers
  // ===============================
  const handleOpenCreateRol = () => {
    setIsEditing(false);
    setSelectedRol(null);
    form.reset({
      name: "",
      description: "",
      is_system: false,
      type: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditRol = (rol: Rol) => {
    setIsEditing(true);
    setSelectedRol(rol);
    form.reset({
      name: rol.name || "",
      description: rol.description || "",
      is_system: rol.is_system || false,
      type: rol.type || "",
    });
    setIsDialogOpen(true);
  };

  // "Activo" se interpretará como !is_system
  // Si is_system = false => Activo
  // Si is_system = true => Inactivo
  const isActivo = (rol: Rol) => !rol.is_system;

  // Formatear fecha
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Intl.DateTimeFormat("es", {
        dateStyle: "short",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  // ===============================
  // Filtrado
  // ===============================
  const estados = ["todos", "activo", "inactivo"];

  const filteredRoles = roles.filter((rol) => {
    const matchesSearch =
      rol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rol.description &&
        rol.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEstado =
      selectedEstado === "todos" ||
      (selectedEstado === "activo" && isActivo(rol)) ||
      (selectedEstado === "inactivo" && !isActivo(rol));

    return matchesSearch && matchesEstado;
  });

  // ===============================
  // Render
  // ===============================
  return (
    <div className="space-y-4">
      {/* Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          {/* Búsqueda */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar roles..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por Estado */}
          <Select value={selectedEstado} onValueChange={setSelectedEstado}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {estados.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado === "todos" ? "Todos los estados" : estado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botón de Nuevo Rol */}
        <Button onClick={handleOpenCreateRol}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Rol
        </Button>
      </div>

      {/* Tabla de Roles */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px] text-center">Acciones</TableHead>
              <TableHead>Nombre del Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Fecha Creación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No se encontraron roles
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((rol) => (
                <TableRow
                  key={rol.id}
                  className={selectedRol?.id === rol.id ? "bg-blue-50" : ""}
                >
                  <TableCell className="p-2 text-center">
                    <div className="flex justify-center space-x-1">
                      {/* Ver detalles */}
                      <Button
                        variant="default"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setSelectedRol(rol)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {/* Editar */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenEditRol(rol)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      {/* Eliminar */}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteRol(rol)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{rol.name}</TableCell>
                  <TableCell>
                    {isActivo(rol) ? (
                      <Badge
                        variant="success"
                        className="bg-green-100 text-green-800 hover:bg-green-100"
                      >
                        Activo
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="bg-red-100 text-red-800 hover:bg-red-100"
                      >
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{rol.description ?? "N/A"}</TableCell>
                  <TableCell>{formatDate(rol.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detalles del Rol Seleccionado */}
      {selectedRol && (
        <Card>
          <CardHeader>
            <CardTitle>Información del Rol</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">
                  Nombre del Rol
                </label>
                <Input
                  value={selectedRol.name}
                  readOnly
                  className="mt-1 bg-muted"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Estado</label>
                <Input
                  value={isActivo(selectedRol) ? "Activo" : "Inactivo"}
                  readOnly
                  className="mt-1 bg-muted"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Descripción</label>
              <Input
                value={selectedRol.description ?? "N/A"}
                readOnly
                className="mt-1 bg-muted"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedRol(null)}>
                Cerrar
              </Button>
              <Button onClick={() => setIsPermisosModalOpen(true)}>
                <UserCog className="mr-2 h-4 w-4" />
                Asignar Permisos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para Crear/Editar Rol */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Rol" : "Nuevo Rol"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica los datos del rol seleccionado."
                : "Completa el formulario para crear un nuevo rol."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRol)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del rol" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Descripción del rol (opcional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* is_system => false = Activo, true = Inactivo */}
              <FormField
                control={form.control}
                name="is_system"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Rol Inactivo</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Marca esta opción si quieres que el rol esté inactivo
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Guardar Cambios" : "Crear Rol"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal para Asignar Permisos */}
      <Dialog open={isPermisosModalOpen} onOpenChange={setIsPermisosModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Asignar Permisos</DialogTitle>
            <DialogDescription>
              Aquí podrás asignar o modificar permisos para el rol seleccionado.
              (Pendiente de implementar)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tu lógica de permisos irá aquí más adelante */}
            <p className="text-sm text-muted-foreground">
              (En construcción)
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermisosModalOpen(false)}>
              Cerrar
            </Button>
            {/* Podrías poner un botón para Guardar cambios si fuera necesario */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
