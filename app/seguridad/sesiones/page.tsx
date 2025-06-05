"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, LogOut, Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";

// Definir la interfaz para las sesiones
interface Session {
  id: number;
  usuario: string;
  email: string;
  rol: string;
  ip: string;
  inicio: string;
  duracion: string;
  dispositivo: string;
  tipo: string;
  activa: boolean;
}

import { API_BASE_URL } from "@/utils/apiConfig";

// URL base de tu servidor Laravel (CORREGIDO)
const LARAVEL_API_URL = API_BASE_URL;

export default function SesionesActivas() {
  // Tipamos el estado para que sea un arreglo de Session
  const [sessionList, setSessionList] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  // Obtén el token almacenado
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  // Función para cargar las sesiones desde el API
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${LARAVEL_API_URL}/api/sessions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      // Si la ruta no existe o Laravel devuelve un error, es posible que response no sea JSON
      const data = await response.json().catch(() => {
        throw new Error("La respuesta no es JSON");
      });

      if (response.ok) {
        setSessionList(data.sessions); // data.sessions debe coincidir con la interfaz Session[]
      } else {
        console.error("Error al obtener las sesiones", data.error);
      }
    } catch (error) {
      console.error("Error al conectar con el API", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar sesiones al montar el componente
  useEffect(() => {
    fetchSessions();
  }, []);

  // Función para cerrar una sesión individual
  const cerrarSesion = async (id: number) => {
    try {
      const response = await fetch(`${LARAVEL_API_URL}/sessions/${id}/close`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => {
        throw new Error("La respuesta no es JSON");
      });

      if (response.ok) {
        // Actualiza la lista local tras cerrar la sesión
        setSessionList(
          sessionList.map((sesion) =>
            sesion.id === id ? { ...sesion, activa: false } : sesion
          )
        );
      } else {
        console.error("Error al cerrar la sesión", data.error);
      }
    } catch (error) {
      console.error("Error al conectar con el API", error);
    }
  };

  // Función para cerrar todas las sesiones
  const cerrarTodasSesiones = async () => {
    try {
      const response = await fetch(`${LARAVEL_API_URL}/sessions/close-all`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => {
        throw new Error("La respuesta no es JSON");
      });

      if (response.ok) {
        // Marca todas las sesiones como inactivas
        setSessionList(sessionList.map((sesion) => ({ ...sesion, activa: false })));
      } else {
        console.error("Error al cerrar todas las sesiones", data.error);
      }
    } catch (error) {
      console.error("Error al conectar con el API", error);
    }
  };

  // Contar sesiones por tipo de dispositivo
  const desktopSessions = sessionList.filter((s) => s.tipo === "Desktop" && s.activa).length;
  const mobileSessions = sessionList.filter((s) => s.tipo === "Mobile" && s.activa).length;
  const tabletSessions = sessionList.filter((s) => s.tipo === "Tablet" && s.activa).length;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sesiones Activas</h1>
        <div>
          <Button variant="outline" className="mr-2" onClick={fetchSessions}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={cerrarTodasSesiones}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Todas las Sesiones
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Resumen de Sesiones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Sesiones Activas</p>
                  <p className="text-2xl font-bold">
                    {sessionList.filter((s) => s.activa).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Monitor className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Desktop</p>
                  <p className="text-2xl font-bold">{desktopSessions}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Smartphone className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="text-2xl font-bold">{mobileSessions}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Tablet className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Tablet</p>
                  <p className="text-2xl font-bold">{tabletSessions}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p>Cargando sesiones...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Inicio de Sesión</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionList.map((sesion) => (
                  <TableRow key={sesion.id} className={!sesion.activa ? "opacity-60" : ""}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sesion.usuario}</div>
                        <div className="text-sm text-gray-500">{sesion.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{sesion.rol}</TableCell>
                    <TableCell>{sesion.ip}</TableCell>
                    <TableCell>{sesion.inicio}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-500" />
                        {sesion.duracion}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {sesion.tipo === "Desktop" && (
                          <Monitor className="h-4 w-4 mr-1 text-green-600" />
                        )}
                        {sesion.tipo === "Mobile" && (
                          <Smartphone className="h-4 w-4 mr-1 text-yellow-600" />
                        )}
                        {sesion.tipo === "Tablet" && (
                          <Tablet className="h-4 w-4 mr-1 text-purple-600" />
                        )}
                        {sesion.dispositivo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sesion.activa ? "success" : "secondary"}>
                        {sesion.activa ? "Activa" : "Cerrada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {sesion.activa && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => cerrarSesion(sesion.id)}
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Cerrar Sesión
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
