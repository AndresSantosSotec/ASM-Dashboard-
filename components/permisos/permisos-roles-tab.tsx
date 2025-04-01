"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, UserCog } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Datos de ejemplo para roles
const rolesData = [
  {
    id: 1,
    name: "Administrador",
    descripcion: "Acceso total a todas las funcionalidades.",
    activo: true,
    fechaCreacion: "2023-01-15",
  },
  {
    id: 2,
    name: "Docente",
    descripcion: "Puede gestionar cursos y calificaciones.",
    activo: true,
    fechaCreacion: "2023-02-10",
  },
  {
    id: 3,
    name: "Estudiante",
    descripcion: "Acceso limitado a contenidos y evaluaciones.",
    activo: true,
    fechaCreacion: "2023-03-05",
  },
  {
    id: 4,
    name: "Administrativo",
    descripcion: "Gestión de trámites y procesos internos.",
    activo: true,
    fechaCreacion: "2023-03-20",
  },
  {
    id: 5,
    name: "Finanzas",
    descripcion: "Acceso a información financiera y reportes.",
    activo: true,
    fechaCreacion: "2023-04-01",
  },
  {
    id: 6,
    name: "Seguridad",
    descripcion: "Control de accesos y configuraciones de seguridad.",
    activo: true,
    fechaCreacion: "2023-04-15",
  },
  {
    id: 7,
    name: "Asesor",
    descripcion: "Atención y asesoría a estudiantes.",
    activo: true,
    fechaCreacion: "2023-05-01",
  },
];

export default function PermisosRolesTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("todos");
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // Estados posibles: 'todos', 'activo', 'inactivo'
  const estados = ["todos", "activo", "inactivo"];

  // Filtrado por búsqueda y estado
  const filteredRoles = rolesData.filter((rol) => {
    const matchesSearch =
      rol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rol.descripcion.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado =
      selectedEstado === "todos" ||
      (selectedEstado === "activo" && rol.activo) ||
      (selectedEstado === "inactivo" && !rol.activo);

    return matchesSearch && matchesEstado;
  });

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

        {/* Paginación: Registros a mostrar (solo decorativo) */}
        <div className="text-sm text-muted-foreground">
          Mostrar
          <Select defaultValue="5">
            <SelectTrigger className="h-8 w-[70px] mx-2 border-none">
              <SelectValue placeholder="5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          registros
        </div>
      </div>

      {/* Tabla de Roles */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] text-center">Acciones</TableHead>
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
                  className={selectedRole?.id === rol.id ? "bg-blue-50" : ""}
                >
                  <TableCell className="p-2 text-center">
                    <div className="flex justify-center space-x-1">
                      <Button
                        variant="default"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setSelectedRole(rol)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-7 w-7">
                        <UserCog className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{rol.name}</TableCell>
                  <TableCell>
                    {rol.activo ? (
                      <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{rol.descripcion}</TableCell>
                  <TableCell>{rol.fechaCreacion}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Barra de Paginación Inferior (solo ejemplo) */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredRoles.length} de {rolesData.length} registros
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Detalles del Rol Seleccionado */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>Información del Rol</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Nombre del Rol</label>
                <Input value={selectedRole.name} readOnly className="mt-1 bg-muted" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Estado</label>
                <Input
                  value={selectedRole.activo ? "Activo" : "Inactivo"}
                  readOnly
                  className="mt-1 bg-muted"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Descripción</label>
              <Input value={selectedRole.descripcion} readOnly className="mt-1 bg-muted" />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedRole(null)}>
                Cancelar
              </Button>
              <Button>
                <UserCog className="mr-2 h-4 w-4" />
                Asignar Permisos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
