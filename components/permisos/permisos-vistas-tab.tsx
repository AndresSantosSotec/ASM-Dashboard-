"use client";

import { useState, useEffect } from "react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Save, X, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Interfaces actualizadas para incluir más datos del usuario
interface Usuario {
  id: string;
  nombre: string;
  email: string;
  first_name: string;
  last_name: string;
  cargo: string;
}

interface Module {
  id: number;
  name: string;
  description?: string;
  status: boolean;
  view_count: number;
  icon?: string;
  order_num?: number;
  views?: ModuleView[];
}

interface ModuleView {
  id: number;
  module_id: number;
  menu: string;
  submenu?: string;
  view_path: string;
  status: boolean;
  order_num: number;
}

export default function PermisosVistasTab() {
  // Estados para usuarios y permisos
  const [selectedUsuario, setSelectedUsuario] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("todos");
  const [selectedPermisos, setSelectedPermisos] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Cargar usuarios desde la API
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users`);
        console.log("Respuesta de usuarios:", response.data);
        // Si la respuesta viene en response.data.data, ajusta aquí
        const usuariosTransformados = response.data.map((user: any) => ({
          id: String(user.id),
          nombre: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          cargo: user.rol || "Sin cargo",
        }));
        setUsuarios(usuariosTransformados);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
      }
    };
    fetchUsuarios();
  }, []);

  // Cargar módulos y sus vistas
  useEffect(() => {
    const fetchModulesWithViews = async () => {
      try {
          const modulesRes = await axios.get(`${API_BASE_URL}/api/modules`);
        const modulesData: Module[] = modulesRes.data;
        const modulesWithViews = await Promise.all(
          modulesData.map(async (module) => {
            try {
                const viewsRes = await axios.get(
                  `${API_BASE_URL}/api/modules/${module.id}/views`
                );
              const views: ModuleView[] = viewsRes.data.data;
              return { ...module, views };
            } catch (error) {
              console.error(`Error al obtener vistas del módulo ${module.id}:`, error);
              return { ...module, views: [] };
            }
          })
        );
        setModules(modulesWithViews);
      } catch (error) {
        console.error("Error al obtener módulos:", error);
      }
    };
    fetchModulesWithViews();
  }, []);

  // Opciones para el selector de módulos
  const moduleOptions = ["todos", ...modules.map((m) => m.name)];
  const filteredModules =
    selectedModule === "todos" ? modules : modules.filter((m) => m.name === selectedModule);

  // Cuando se selecciona un usuario, cargar sus permisos asignados
  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!selectedUsuario) return;
      setIsLoading(true);
      try {
          const response = await axios.get(
            `${API_BASE_URL}/api/userpermissions?user_id=${selectedUsuario}`
          );
        if (response.data.success) {
          const permisosIds = response.data.data.map((perm: any) => perm.permission_id);
          setSelectedPermisos(permisosIds);
        } else {
          setSelectedPermisos([]);
        }
      } catch (error) {
        console.error("Error al cargar permisos del usuario:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserPermissions();
  }, [selectedUsuario]);

  // Manejo de selección/deselección de vistas
  const handleTogglePermiso = (id: number) => {
    setSelectedPermisos((prev) =>
      prev.includes(id) ? prev.filter((permId) => permId !== id) : [...prev, id]
    );
  };

  const handleSelectAllModule = (moduleId: number, views: ModuleView[], checked: boolean) => {
    const viewsIds = views.map((v) => v.id);
    if (checked) {
      setSelectedPermisos((prev) => [...new Set([...prev, ...viewsIds])]);
    } else {
      setSelectedPermisos((prev) => prev.filter((id) => !viewsIds.includes(id)));
    }
  };

  const handleToggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  // Guardar permisos y mostrar feedback con SweetAlert
  const handleSavePermisos = async () => {
    if (!selectedUsuario) {
      Swal.fire("Error", "No hay usuario seleccionado para guardar permisos", "error");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        user_id: selectedUsuario,
        permissions: selectedPermisos,
      };
      const response = await axios.post(
        `${API_BASE_URL}/api/userpermissions`,
        payload
      );
      if (response.data.success) {
        Swal.fire("Éxito", "Permisos actualizados correctamente", "success");
      } else {
        Swal.fire("Error", response.data.message || "Error desconocido", "error");
      }
    } catch (error: any) {
      console.error("Error al guardar permisos:", error);
      Swal.fire("Error", "Ocurrió un error al guardar los permisos", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Renderizado de vistas para cada módulo
  const renderModuleViews = (module: Module) => {
    if (!module.views || module.views.length === 0) return null;
    const filteredViews = module.views.filter((view) =>
      view.menu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (view.submenu && view.submenu.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return (
      <>
        <div
          className="bg-blue-600 text-white p-3 cursor-pointer flex justify-between items-center"
          onClick={() => handleToggleModule(module.id)}
        >
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`module-${module.id}-select-all`}
              className="border-white data-[state=checked]:bg-white data-[state=checked]:text-blue-600"
              checked={module.views.every((v) => selectedPermisos.includes(v.id))}
              onCheckedChange={(checked) => handleSelectAllModule(module.id, module.views!, !!checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="font-medium">Módulo: {module.name}</span>
          </div>
          <div className="text-white">
            {expandedModules.includes(module.id) ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
          </div>
        </div>
        {expandedModules.includes(module.id) && (
          <div className="p-0">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="w-[50px]">{/* Columna de selección */}</TableHead>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Menú</TableHead>
                  <TableHead>Submenú</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredViews.map((view) => (
                  <TableRow key={view.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPermisos.includes(view.id)}
                        onCheckedChange={() => handleTogglePermiso(view.id)}
                      />
                    </TableCell>
                    <TableCell>{view.id}</TableCell>
                    <TableCell>{view.menu}</TableCell>
                    <TableCell>{view.submenu}</TableCell>
                    <TableCell className="text-center">
                      {view.status ? (
                        <Badge className="bg-green-600 hover:bg-green-600">Activo</Badge>
                      ) : (
                        <Badge variant="destructive">Inactivo</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Información de usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Información de usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Nombre de usuario</label>
              <Select value={selectedUsuario || ""} onValueChange={setSelectedUsuario}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.nombre} - {usuario.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedUsuario && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Detalles del usuario</p>
                <p className="text-sm">
                  <strong>Nombre completo:</strong>{" "}
                  {usuarios.find((u) => u.id === selectedUsuario)?.first_name}{" "}
                  {usuarios.find((u) => u.id === selectedUsuario)?.last_name}
                </p>
                <p className="text-sm">
                  <strong>Correo:</strong>{" "}
                  {usuarios.find((u) => u.id === selectedUsuario)?.email}
                </p>
              </div>
            )}
          </div>
          {selectedUsuario && (
            <div className="mt-2">
              <label className="text-sm text-muted-foreground">Tipo de usuario</label>
              <Input value="Usuario del sistema" readOnly className="mt-1 bg-muted" />
            </div>
          )}
          {isLoading && <p className="text-sm text-gray-600">Cargando permisos...</p>}
        </CardContent>
      </Card>

      {/* Permisos (módulos y vistas) */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos disponibles</CardTitle>
          <CardDescription>Asigna vistas (permisos) al usuario seleccionado</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vistas..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por módulo" />
                </SelectTrigger>
                <SelectContent>
                  {moduleOptions.map((modulo) => (
                    <SelectItem key={modulo} value={modulo}>
                      {modulo === "todos" ? "Todos los módulos" : modulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border-t">
            {filteredModules.map((module) => (
              <div key={module.id} className="border-b">
                {renderModuleViews(module)}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t p-4 flex justify-end space-x-2">
          <Button variant="outline">
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSavePermisos} disabled={!selectedUsuario || isSaving}>
            {isSaving ? "Guardando..." : (
              <>
                <Save className="mr-2 h-4 w-4" /> Guardar Permisos
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
