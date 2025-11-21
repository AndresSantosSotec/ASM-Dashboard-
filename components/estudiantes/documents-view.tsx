"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "@/utils/apiConfig";

interface DocumentoTipo {
  id: string;
  nombre: string;
  descripcion: string;
  monto: number;
  requiere_pago: boolean;
}

interface SolicitudDocumento {
  id: number;
  tipo_documento: string;
  monto: number;
  estado: string;
  fecha_solicitud: string;
  banco?: string;
  numero_referencia?: string;
  fecha_recibo?: string;
}

export function DocumentsView() {
  const [tiposDocumentos, setTiposDocumentos] = useState<DocumentoTipo[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el diálogo de solicitud
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentoTipo | null>(null);
  
  // Estado para formulario de boleta
  const [banco, setBanco] = useState("");
  const [numeroReferencia, setNumeroReferencia] = useState("");
  const [fechaRecibo, setFechaRecibo] = useState("");
  const [boletaFile, setBoletaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [tiposRes, solicitudesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/estudiante/documentos/tipos`),
        axios.get(`${API_BASE_URL}/api/estudiante/documentos`),
      ]);

      if (tiposRes.data.success) {
        setTiposDocumentos(tiposRes.data.data);
      }

      if (solicitudesRes.data.success) {
        setSolicitudes(solicitudesRes.data.data);
      }
    } catch (error: any) {
      console.error("Error cargando datos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los documentos",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitar = (documento: DocumentoTipo) => {
    setSelectedDocument(documento);
    setBanco("");
    setNumeroReferencia("");
    setFechaRecibo("");
    setBoletaFile(null);
    setShowRequestDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBoletaFile(e.target.files[0]);
    }
  };

  const handleSubmitSolicitud = async () => {
    if (!selectedDocument) return;

    // Validar campos si requiere pago
    if (selectedDocument.requiere_pago) {
      if (!banco || !numeroReferencia || !fechaRecibo || !boletaFile) {
        Swal.fire({
          icon: "warning",
          title: "Campos incompletos",
          text: "Debe completar todos los campos de la boleta de banco",
        });
        return;
      }
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("tipo_documento", selectedDocument.id);
      
      if (selectedDocument.requiere_pago) {
        formData.append("banco", banco);
        formData.append("numero_referencia", numeroReferencia);
        formData.append("fecha_recibo", fechaRecibo);
        if (boletaFile) {
          formData.append("boleta_file", boletaFile);
        }
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/estudiante/documentos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Solicitud creada",
          text: "Su solicitud ha sido registrada exitosamente",
        });
        setShowRequestDialog(false);
        cargarDatos();
      }
    } catch (error: any) {
      console.error("Error creando solicitud:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "No se pudo crear la solicitud",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case "en_proceso":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            En proceso
          </Badge>
        );
      case "listo":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Listo
          </Badge>
        );
      case "rechazado":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rechazado
          </Badge>
        );
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getSolicitudEstado = (tipoDocumento: string) => {
    const solicitud = solicitudes.find((s) => s.tipo_documento === tipoDocumento);
    return solicitud?.estado || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Cargando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <div>
          <AlertTitle className="text-blue-800">Información importante</AlertTitle>
          <AlertDescription className="text-blue-700">
            Los documentos solicitados estarán disponibles en un plazo de 3 a 5 días hábiles.
            Recibirá una notificación cuando estén listos para descargar.
          </AlertDescription>
        </div>
      </Alert>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {tiposDocumentos.map((documento) => {
          const estadoSolicitud = getSolicitudEstado(documento.id);
          const tieneSolicitud = estadoSolicitud !== null;

          return (
            <Card key={documento.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold">{documento.nombre}</CardTitle>
                  {tieneSolicitud && getEstadoBadge(estadoSolicitud)}
                </div>
                <CardDescription>{documento.descripcion}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2 text-sm">
                  {documento.requiere_pago ? (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Costo: Q{documento.monto.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">Gratis</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 pt-2">
                {!tieneSolicitud ? (
                  <Button
                    onClick={() => handleSolicitar(documento)}
                    className="w-full"
                    variant={documento.requiere_pago ? "default" : "outline"}
                  >
                    {documento.requiere_pago ? "Solicitar y Pagar" : "Solicitar"}
                  </Button>
                ) : estadoSolicitud === "listo" ? (
                  <Button className="w-full" variant="default">
                    <FileText className="mr-2 h-4 w-4" /> Descargar
                  </Button>
                ) : (
                  <Button disabled variant="outline" className="w-full">
                    {estadoSolicitud === "pendiente" && "Pendiente de revisión"}
                    {estadoSolicitud === "en_proceso" && "En proceso..."}
                    {estadoSolicitud === "rechazado" && "Rechazado"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Diálogo de solicitud */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Documento</DialogTitle>
            <DialogDescription>
              {selectedDocument?.nombre}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedDocument?.requiere_pago ? (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Costo del documento</AlertTitle>
                  <AlertDescription>
                    Este documento tiene un costo fijo de Q{selectedDocument.monto.toFixed(2)}.
                    Debe subir la boleta de banco con los siguientes datos:
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="monto">Monto (Fijo)</Label>
                    <Input
                      id="monto"
                      value={`Q${selectedDocument.monto.toFixed(2)}`}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="banco">Banco *</Label>
                    <Select value={banco} onValueChange={setBanco}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el banco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Banco Industrial">Banco Industrial</SelectItem>
                        <SelectItem value="Banco G&T Continental">Banco G&T Continental</SelectItem>
                        <SelectItem value="Banco de Desarrollo Rural">Banco de Desarrollo Rural</SelectItem>
                        <SelectItem value="Banco Agromercantil">Banco Agromercantil</SelectItem>
                        <SelectItem value="Banco Promerica">Banco Promerica</SelectItem>
                        <SelectItem value="Banco de Antigua">Banco de Antigua</SelectItem>
                        <SelectItem value="Banco Ficohsa">Banco Ficohsa</SelectItem>
                        <SelectItem value="Banco Azteca">Banco Azteca</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="numero_referencia">Número de Referencia *</Label>
                    <Input
                      id="numero_referencia"
                      value={numeroReferencia}
                      onChange={(e) => setNumeroReferencia(e.target.value)}
                      placeholder="Ingrese el número de referencia"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fecha_recibo">Fecha del Recibo *</Label>
                    <Input
                      id="fecha_recibo"
                      type="date"
                      value={fechaRecibo}
                      onChange={(e) => setFechaRecibo(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="boleta_file">Boleta de Banco *</Label>
                    <Input
                      id="boleta_file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                    {boletaFile && (
                      <p className="text-xs text-green-600 mt-1">
                        Archivo seleccionado: {boletaFile.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Formatos: PDF, JPG, PNG (máx. 5MB)
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Documento gratuito</AlertTitle>
                <AlertDescription>
                  Este documento no requiere pago. Al confirmar, su solicitud será procesada.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRequestDialog(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitSolicitud}
              disabled={
                submitting ||
                (selectedDocument?.requiere_pago &&
                  (!banco || !numeroReferencia || !fechaRecibo || !boletaFile))
              }
            >
              {submitting ? "Enviando..." : "Confirmar Solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
