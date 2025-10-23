"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Loader2, AlertCircle } from "lucide-react";
import { getCuotasDashboard } from '@/services/mantenimientos';
import { EstudianteCuotas, CuotaDashboardSummary } from '@/types/cuotas';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SeguimientoEstudiantes: React.FC = () => {
  const [estudiantes, setEstudiantes] = useState<EstudianteCuotas[]>([]);
  const [summary, setSummary] = useState<CuotaDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Modal de detalle
  const [selectedStudent, setSelectedStudent] = useState<EstudianteCuotas | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Load data on component mount and when search changes
  useEffect(() => {
    loadData();
  }, [debouncedSearch]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getCuotasDashboard({
        limit: 200,
        search: debouncedSearch || undefined,
      });

      setEstudiantes(data.estudiantes);
      setSummary(data.summary);
    } catch (err: any) {
      console.error('Error al cargar dashboard:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format currency to Guatemalan Quetzales
   */
  const formatCurrency = (amount: number): string => {
    return `Q${amount.toLocaleString('es-GT', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  /**
   * Format date to readable format
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Get badge variant for cuota status
   */
  const getStatusBadge = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pagado':
        return <Badge className="bg-green-500 hover:bg-green-600">Pagado</Badge>;
      case 'vencido':
        return <Badge variant="destructive">Vencido</Badge>;
      case 'pendiente':
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  /**
   * Show student detail modal
   */
  const verDetalle = (estudiante: EstudianteCuotas) => {
    setSelectedStudent(estudiante);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando datos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Estudiantes Activos</CardDescription>
              <CardTitle className="text-3xl">{summary.estudiantes_activos.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Saldo Pendiente Total</CardDescription>
              <CardTitle className="text-3xl">{formatCurrency(summary.saldo_estimado)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cuotas en Mora</CardDescription>
              <CardTitle className="text-3xl text-red-500">{summary.en_mora}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Planes Reestructurados</CardDescription>
              <CardTitle className="text-3xl">{summary.planes_reestructurados}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Seguimiento de Estudiantes</CardTitle>
          <CardDescription>Lista de estudiantes activos con información de sus cuotas y pagos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por carnet o nombre..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={loadData} variant="outline">
              Actualizar
            </Button>
          </div>

          {/* Tabla de Estudiantes */}
          <div className="rounded-md border">
            {estudiantes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No se encontraron estudiantes con los filtros aplicados
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carnet</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead className="text-center">Cuotas Pagadas</TableHead>
                    <TableHead className="text-center">Cuotas Pendientes</TableHead>
                    <TableHead className="text-right">Saldo Pendiente</TableHead>
                    <TableHead>Próxima Cuota</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantes.map((est) => (
                    <TableRow key={est.estudiante_programa_id}>
                      <TableCell className="font-medium">{est.prospecto.carnet}</TableCell>
                      <TableCell>{est.prospecto.nombre}</TableCell>
                      <TableCell>{est.programa.nombre}</TableCell>
                      <TableCell className="text-center">{est.cuotas_pagadas}</TableCell>
                      <TableCell className="text-center">{est.cuotas_pendientes}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(est.saldo_pendiente)}
                      </TableCell>
                      <TableCell>
                        {est.proxima_cuota ? (
                          <div className="text-sm">
                            <div className="font-medium">Cuota #{est.proxima_cuota.numero_cuota}</div>
                            <div className="text-muted-foreground">{formatDate(est.proxima_cuota.fecha_vencimiento)}</div>
                            <div className="font-semibold">{formatCurrency(est.proxima_cuota.monto)}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin cuotas pendientes</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => verDetalle(est)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> Ver Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalle */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Cuotas - {selectedStudent?.prospecto.nombre}</DialogTitle>
            <DialogDescription>
              {selectedStudent?.prospecto.carnet} - {selectedStudent?.programa.nombre}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              {/* Información del Estudiante */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <h4 className="text-sm font-medium mb-2">Información del Estudiante</h4>
                  <p className="text-sm"><strong>Nombre:</strong> {selectedStudent.prospecto.nombre}</p>
                  <p className="text-sm"><strong>Carnet:</strong> {selectedStudent.prospecto.carnet}</p>
                  <p className="text-sm"><strong>Correo:</strong> {selectedStudent.prospecto.correo}</p>
                  <p className="text-sm"><strong>Teléfono:</strong> {selectedStudent.prospecto.telefono}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Resumen Financiero</h4>
                  <p className="text-sm"><strong>Programa:</strong> {selectedStudent.programa.nombre}</p>
                  <p className="text-sm">
                    <strong>Saldo Pendiente:</strong>{' '}
                    <span className={selectedStudent.saldo_pendiente > 0 ? "text-red-500 font-semibold" : "text-green-500 font-semibold"}>
                      {formatCurrency(selectedStudent.saldo_pendiente)}
                    </span>
                  </p>
                  <p className="text-sm"><strong>Cuotas Pagadas:</strong> {selectedStudent.cuotas_pagadas}</p>
                  <p className="text-sm"><strong>Cuotas Pendientes:</strong> {selectedStudent.cuotas_pendientes}</p>
                </div>
              </div>

              {/* Detalle de Cuotas */}
              <div>
                <h4 className="text-sm font-medium mb-2">Historial de Cuotas</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cuota #</TableHead>
                        <TableHead>Fecha Vencimiento</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha de Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStudent.cuotas.length > 0 ? (
                        selectedStudent.cuotas.map((cuota) => (
                          <TableRow key={cuota.id}>
                            <TableCell className="font-medium">{cuota.numero_cuota}</TableCell>
                            <TableCell>{formatDate(cuota.fecha_vencimiento)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(cuota.monto)}</TableCell>
                            <TableCell>{getStatusBadge(cuota.estado)}</TableCell>
                            <TableCell>
                              {cuota.paid_at ? (
                                formatDate(cuota.paid_at)
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No hay cuotas registradas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Próxima Cuota */}
              {selectedStudent.proxima_cuota && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Próxima Cuota</AlertTitle>
                  <AlertDescription>
                    Cuota #{selectedStudent.proxima_cuota.numero_cuota} - Vence el{' '}
                    {formatDate(selectedStudent.proxima_cuota.fecha_vencimiento)} - Monto:{' '}
                    {formatCurrency(selectedStudent.proxima_cuota.monto)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeguimientoEstudiantes;
