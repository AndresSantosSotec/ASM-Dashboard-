"use client";

import axios from "axios";
import { API_BASE_URL } from "@/utils/apiConfig";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow,} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {Search,Save,X,Plus,Edit,Trash,CheckCircle,XCircle,} from "lucide-react";
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle,} from "@/components/ui/dialog";
import {Form,FormControl,FormField,FormItem,FormLabel,FormMessage,} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// ===============================
// INTERFACES Y ESQUEMA
// ===============================

// Interfaz para el usuario
interface Usuario {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  first_name?: string;
  last_name?: string;
  last_login?: string;
  created_at?: string;
  rol?: string; // Campo "Tipo" para rol
}

// Esquema de validación con zod
const usuarioSchema = z.object({
  username: z.string().min(1, "El username es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  is_active: z.boolean().default(true),
  password: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

// ===============================
// COMPONENTE: PermisosUsuariosTab
// ===============================
export default function PermisosUsuariosTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  const form = useForm<z.infer<typeof usuarioSchema>>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      is_active: true,
      first_name: "",
      last_name: "",
    },
  });

  // Al montar el componente, obtenemos usuarios
  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Función para mapear datos de la API al interface Usuario
  const transformUser = (userData: any): Usuario => ({
    id: userData.id,
    username: userData.username,
    email: userData.email,
    is_active: userData.is_active,
    first_name: userData.first_name,
    last_name: userData.last_name,
    last_login: userData.last_login,
    created_at: userData.created_at,

    // Toma el rol que te envía el backend:
    // "rol": "Administrador"
    rol: userData.rol ?? "N/A",
    // Si quisieras extraerlo del campo user_role, podrías hacer:
    // rol: userData.user_role?.role?.name ?? "N/A"
  });

  // Trae la lista de usuarios desde la API
  const fetchUsuarios = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/users`);
      const usuariosTransformados = response.data.map((u: any) => transformUser(u));
      setUsuarios(usuariosTransformados);
    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
    }
  };

  // Filtrar por searchTerm
  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      usuario.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usuario.first_name &&
        usuario.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (usuario.last_name &&
        usuario.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Abrir el modal para crear o editar usuario
  const handleOpenDialogUser = (
    usuario: Usuario | null = null,
    editing = false
  ) => {
    setCurrentUser(usuario);
    setIsEditing(editing);

    if (editing && usuario) {
      // Llenar el formulario con datos actuales
      form.reset({
        username: usuario.username,
        email: usuario.email,
        password: "",
        is_active: usuario.is_active,
        first_name: usuario.first_name ?? "",
        last_name: usuario.last_name ?? "",
      });
    } else {
      // Crear un nuevo usuario
      form.reset({
        username: "",
        email: "",
        password: "",
        is_active: true,
        first_name: "",
        last_name: "",
      });
    }
    setIsDialogOpen(true);
  };

  // Envía el formulario para crear/editar usuario
  const onSubmit = async (data: z.infer<typeof usuarioSchema>) => {
    try {
      if (isEditing && currentUser) {
        // EDITAR
          const response = await axios.put(
            `${API_BASE_URL}/api/users/${currentUser.id}`,
            data
          );
        const usuarioActualizado = transformUser(response.data);
        setUsuarios((prev) =>
          prev.map((u) => (u.id === currentUser.id ? usuarioActualizado : u))
        );
        Swal.fire({
          title: "Usuario actualizado",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // CREAR
          const response = await axios.post(`${API_BASE_URL}/api/users`, data);
        const nuevoUsuario = transformUser(response.data);
        setUsuarios((prev) => [...prev, nuevoUsuario]);
        Swal.fire({
          title: "Usuario creado",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error al guardar el usuario:", error);
      let msg = "No se pudo guardar el usuario.";
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      Swal.fire({
        title: "Error",
        text: msg,
        icon: "error",
      });
    }
  };

  // Cambiar estado activo/inactivo de un usuario
  const handleToggleActive = async (usuario: Usuario) => {
    const accion = usuario.is_active ? "inactivar" : "reactivar";
    const result = await Swal.fire({
      icon: usuario.is_active ? "warning" : "question",
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
      text: `¿Estás seguro de que deseas ${accion} este usuario?`,
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
        const response = await axios.put(
          `${API_BASE_URL}/api/users/${usuario.id}`,
          { is_active: !usuario.is_active }
        );
      const actualizado = transformUser(response.data);
      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? actualizado : u)));
      Swal.fire({
        title: `Usuario ${usuario.is_active ? "inactivado" : "reactivado"}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error("Error al cambiar estado del usuario:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo cambiar el estado del usuario.",
        icon: "error",
      });
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (usuario: Usuario) => {
    const result = await Swal.fire({
      title: "¿Eliminar usuario?",
      text: `¿Estás seguro de que deseas eliminar a ${usuario.username}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/users/${usuario.id}`);
      setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id));
      Swal.fire({
        title: "Usuario eliminado",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error al eliminar el usuario:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo eliminar el usuario.",
        icon: "error",
      });
    }
  };

  // Función opcional para formatear fechas (creación/última conexión)
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Intl.DateTimeFormat("es", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  // (Removed duplicate declaration of filteredUsuarios)

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y botón de nuevo usuario */}
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => handleOpenDialogUser(null, false)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Tabla de usuarios */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-[150px]">Acciones</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              {/* Columna para el "Tipo" (rol) */}
              <TableHead>Tipo</TableHead>
              {/* Columna para el "Estado" (Activo/Inactivo) */}
              <TableHead>Estado</TableHead>
              {/* Columna para la "Fecha Creación" */}
              <TableHead>Fecha Creación</TableHead>
              {/* Columna para la "Última Conexión" */}
              <TableHead>Última Conexión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="p-2 text-center">
                    <div className="flex justify-center space-x-1">
                      {/* Botón para editar */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenDialogUser(usuario, true)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {/* Botón para (in)activar */}
                      <Button
                        variant="default"
                        size="icon"
                        className={`h-7 w-7 ${
                          usuario.is_active
                            ? ""
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                        onClick={() => handleToggleActive(usuario)}
                      >
                        {usuario.is_active ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      {/* Botón para eliminar */}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteUser(usuario)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{usuario.id}</TableCell>
                  <TableCell className="font-medium">{usuario.username}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  {/* Mostrar el "Tipo" (rol) */}
                  <TableCell>{usuario.rol || "N/A"}</TableCell>
                  {/* Estado en forma de Badge */}
                  <TableCell>
                    {usuario.is_active ? (
                      <Badge
                        variant="success"
                        className="bg-green-100 text-green-800 hover:bg-green-100"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="bg-red-100 text-red-800 hover:bg-red-100"
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  {/* Fecha de creación */}
                  <TableCell>{formatDate(usuario.created_at)}</TableCell>
                  {/* Última conexión */}
                  <TableCell>{formatDate(usuario.last_login)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal para crear/editar usuario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica los datos del usuario seleccionado."
                : "Completa el formulario para crear un nuevo usuario."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Correo electrónico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Password opcional para edición */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Contraseña {isEditing && <span>(Opcional)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Contraseña" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu apellido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Usuario Activo</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        El usuario podrá iniciar sesión en el sistema
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
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Guardar Cambios" : "Crear Usuario"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
