"use client";

import React, { useState } from "react";
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
  Search,
  Upload,
  FileText,
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  X,
  CreditCard,
  FilePlus,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils"; // o tu propio helper para "classNames"

// Tipos de estado
type DocumentStatus = "pendiente" | "en_proceso" | "listo" | "rechazado";

// Tipos para el método de pago
type PaymentMethod = "tarjeta" | "boleta" | null;

// Estructura del documento
interface Document {
  id: string;
  name: string;
  description: string;
  requirements: string;
  cost: number;
  status: DocumentStatus;
  requestDate?: string;
  paymentProof?: string; // Para guardar nombre de archivo o referencia de la boleta
}

export function DocumentsView() {
  // Lista de documentos (ejemplo)
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "cert_estudio",
      name: "Certificación de Estudio",
      description: "Documento que certifica su condición de estudiante activo",
      requirements:
        "Para alumno de primer ingreso, pago de la primera mensualidad. Para alumnos existentes, solvencia y actividad (mínimo 30 días).",
      cost: 0,
      status: "pendiente",
    },
    {
      id: "cert_cursos",
      name: "Certificación de Cursos Aprobados",
      description: "Listado oficial de cursos aprobados con sus respectivas notas",
      requirements: "Estar solvente y pagar Q.75.00",
      cost: 75,
      status: "pendiente",
    },
    {
      id: "cert_pensum",
      name: "Certificado de Cierre de Pénsum",
      description: "Documento que certifica la finalización del plan de estudios",
      requirements: "Estar solvente y pagar Q.150.00",
      cost: 150,
      status: "pendiente",
    },
    {
      id: "const_capstone",
      name: "Constancia de Capstone Project",
      description: "Documento que certifica la participación en el proyecto final",
      requirements: "Estar solvente en cuotas y subir la documentación requerida",
      cost: 0,
      status: "pendiente",
    },
    {
      id: "estado_cuenta",
      name: "Estado de Cuenta",
      description: "Detalle de pagos realizados y pendientes",
      requirements: "Sin requisitos",
      cost: 0,
      status: "listo",
      requestDate: "10/02/2025",
    },
  ]);

  // Control de diálogos y estados de UI
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedTab, setSelectedTab] = useState("todos"); // "todos", "pendiente", "en_proceso", "listo", "rechazado"

  // Documento seleccionado para distintas acciones
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Diálogos
  const [showRequestDialog, setShowRequestDialog] = useState(false); // Confirmar solicitud
  const [showUploadDialog, setShowUploadDialog] = useState(false);   // Subir archivos (ej. Capstone)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false); // Pago (tarjeta o boleta)

  // Para carga de archivos (tanto boleta como doc extra)
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Método de pago seleccionado
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);

  // Maneja la selección de archivos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  // ---- LÓGICA DE SOLICITUD DE DOCUMENTOS ----
  const requestDocument = (document: Document) => {
    setSelectedDocument(document);
    // Si el costo es 0, vamos directo al diálogo de confirmación
    // Si no, también iremos al diálogo de confirmación (y luego al de pago)
    setShowRequestDialog(true);
  };

  const confirmRequest = () => {
    if (!selectedDocument) return;

    // Si tiene costo > 0, abrimos el diálogo de pago
    if (selectedDocument.cost > 0) {
      setShowPaymentDialog(true);
    } else {
      // Si no tiene costo, pasamos directamente a "en_proceso"
      moveDocumentToInProcess();
    }

    // Cerrar diálogo de confirmación
    setShowRequestDialog(false);
  };

  // Mueve el documento seleccionado a estado "en_proceso"
  const moveDocumentToInProcess = () => {
    if (!selectedDocument) return;

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === selectedDocument.id
          ? {
              ...doc,
              status: "en_proceso",
              requestDate: new Date().toLocaleDateString(),
            }
          : doc,
      ),
    );

    // Si es el de capstone, pedimos subir archivos
    if (selectedDocument.id === "const_capstone") {
      setShowUploadDialog(true);
    }
  };

  // ---- LÓGICA DE PAGO ----
  const handleConfirmPayment = () => {
    // En un caso real, aquí integrarías tu pasarela de pago o lógica de carga de boleta.
    // Al finalizar, pasamos el documento a "en_proceso".
    moveDocumentToInProcess();
    setShowPaymentDialog(false);
    setPaymentMethod(null);
    setUploadFile(null);
  };

  // ---- LÓGICA DE SUBIDA DE ARCHIVOS (CAPSTONE O BOLETA) ----
  const confirmUpload = () => {
    // Aquí subirías el archivo al servidor, etc.
    setShowUploadDialog(false);
    setUploadFile(null);
  };

  // ---- LÓGICA PARA APROBAR (O RECHAZAR) DOCUMENTOS (SIMULACIÓN) ----
  // En un entorno real, esto lo haría un admin en otro panel, por ejemplo.
  const approveDocument = (doc: Document) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === doc.id
          ? {
              ...d,
              status: "listo",
            }
          : d,
      ),
    );
  };

  const rejectDocument = (doc: Document) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === doc.id
          ? {
              ...d,
              status: "rechazado",
            }
          : d,
      ),
    );
  };

  // ---- HELPERS DE UI (INSIGNIAS, TEXTOS, FILTROS) ----
  const getBadgeVariant = (status: DocumentStatus) => {
    switch (status) {
      case "pendiente":
        return "outline";
      case "en_proceso":
        return "secondary";
      case "listo":
        return "default";
      case "rechazado":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: DocumentStatus) => {
    switch (status) {
      case "pendiente":
        return "Pendiente";
      case "en_proceso":
        return "En proceso";
      case "listo":
        return "Listo para descargar";
      case "rechazado":
        return "Rechazado";
      default:
        return "Pendiente";
    }
  };

  // Filtrar documentos según búsqueda y pestaña seleccionada
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    let matchesTab = true;
    if (selectedTab !== "todos") {
      matchesTab = doc.status === selectedTab;
    }
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* Información importante */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <div>
          <AlertTitle className="text-blue-800">
            Información importante
          </AlertTitle>
          <AlertDescription className="text-blue-700">
            Los documentos solicitados estarán disponibles en un plazo de 3 a 5
            días hábiles, dependiendo del tipo de documento. Recibirá una
            notificación cuando estén listos para descargar.
          </AlertDescription>
        </div>
      </Alert>

      {/* Barra de búsqueda, selección de vista y ejemplo de botón "Subir Documento" */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[200px] md:w-[300px]"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode("table")}
              variant={viewMode === "table" ? "default" : "outline"}
            >
              Vista Tabla
            </Button>
            <Button
              onClick={() => setViewMode("cards")}
              variant={viewMode === "cards" ? "default" : "outline"}
            >
              Vista Tarjetas
            </Button>
          </div>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Subir Documento
        </Button>
      </div>

      {/* Vista en Tabla o Tarjetas */}
      {viewMode === "table" ? (
        <Card>
          <CardHeader>
            <CardTitle>Mis Documentos</CardTitle>
            <CardDescription>Gestiona tus documentos académicos</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="todos"
              onValueChange={(value) => setSelectedTab(value)}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
                <TabsTrigger value="en_proceso">En proceso</TabsTrigger>
                <TabsTrigger value="listo">Listos</TabsTrigger>
                <TabsTrigger value="rechazado">Rechazados</TabsTrigger>
              </TabsList>

              {/* Para simplificar, en cada TabsContent usaremos la misma lista filtrada.
                  Si quieres, puedes hacer un .filter diferente para cada uno. */}
              <TabsContent value="todos">
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Nombre del Documento
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Descripción
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Fecha de Solicitud
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredDocuments.map((doc) => (
                        <tr key={doc.id}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <span className="font-medium">{doc.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {doc.description}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {doc.requestDate || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={getBadgeVariant(doc.status)}>
                              {doc.status === "pendiente" ? (
                                <Clock className="h-3.5 w-3.5 mr-1" />
                              ) : doc.status === "en_proceso" ? (
                                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                              ) : doc.status === "listo" ? (
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                              )}
                              {getStatusText(doc.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {/* Botón para ver (placeholder) */}
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Ver</span>
                              </Button>

                              {/* Lógica de acciones según el estado */}
                              {doc.status === "listo" ? (
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">Descargar</span>
                                </Button>
                              ) : doc.status === "pendiente" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => requestDocument(doc)}
                                >
                                  Solicitar
                                </Button>
                              ) : doc.status === "en_proceso" ? (
                                <div className="flex gap-2">
                                  {/* Simulación de aprobación o rechazo */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => approveDocument(doc)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Aprobar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => rejectDocument(doc)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Rechazar
                                  </Button>
                                </div>
                              ) : (
                                <Button variant="outline" size="sm">
                                  Ver Detalles
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Podrías duplicar o personalizar este mismo bloque para "pendiente", "en_proceso", etc. */}
              <TabsContent value="pendiente">
                {/* ... similar a "todos", pero filtras por doc.status === "pendiente" */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Nombre del Documento
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Descripción
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Fecha de Solicitud
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {documents
                        .filter((doc) => doc.status === "pendiente")
                        .filter((doc) =>
                          doc.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                        )
                        .map((doc) => (
                          <tr key={doc.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <span className="font-medium">{doc.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {doc.description}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {doc.requestDate || "-"}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={getBadgeVariant(doc.status)}>
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                Pendiente
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => requestDocument(doc)}
                              >
                                Solicitar
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* ... y así para "en_proceso", "listo", "rechazado" */}
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        // Vista en Tarjetas
        <div className="grid gap-6 md:grid-cols-2">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold">{doc.name}</CardTitle>
                  <Badge variant={getBadgeVariant(doc.status)}>
                    {getStatusText(doc.status)}
                  </Badge>
                </div>
                <CardDescription>{doc.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Requisitos:</span>{" "}
                    {doc.requirements}
                  </div>
                  {doc.cost > 0 && (
                    <div>
                      <span className="font-medium">Costo:</span>{" "}
                      Q{doc.cost.toFixed(2)}
                    </div>
                  )}
                  {doc.requestDate && (
                    <div>
                      <span className="font-medium">Fecha de solicitud:</span>{" "}
                      {doc.requestDate}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 pt-2">
                {/* Acciones según el estado */}
                {doc.status === "pendiente" ? (
                  <Button
                    onClick={() => requestDocument(doc)}
                    className="w-full"
                    variant={doc.cost > 0 ? "default" : "outline"}
                  >
                    {doc.cost > 0 ? "Solicitar y Pagar" : "Solicitar"}
                  </Button>
                ) : doc.status === "listo" ? (
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" /> Descargar
                  </Button>
                ) : doc.status === "en_proceso" ? (
                  <div className="flex flex-col w-full gap-2">
                    <Button disabled variant="outline" className="w-full">
                      En proceso...
                    </Button>
                    {/* Botones para simular aprobación/rechazo */}
                    <div className="flex justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => approveDocument(doc)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rejectDocument(doc)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full text-red-500">
                    <X className="mr-2 h-4 w-4" /> Ver detalles del rechazo
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo de confirmación de solicitud */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar solicitud</DialogTitle>
            <DialogDescription>
              Está a punto de solicitar: {selectedDocument?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm">
              <p className="font-medium mb-2">Requisitos:</p>
              <p>{selectedDocument?.requirements}</p>
            </div>
            {selectedDocument?.cost ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <div>
                  <AlertTitle>Costo del documento</AlertTitle>
                  <AlertDescription>
                    Este documento tiene un costo de Q
                    {selectedDocument?.cost.toFixed(2)}. Al confirmar, podrá
                    elegir su método de pago.
                  </AlertDescription>
                </div>
              </Alert>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmRequest}>Continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de pago (tarjeta o boleta) */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Método de Pago</DialogTitle>
            <DialogDescription>
              Elija su método de pago para: {selectedDocument?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Selector de método de pago */}
            <div className="flex gap-2">
              <Button
                variant={paymentMethod === "tarjeta" ? "default" : "outline"}
                onClick={() => {
                  setPaymentMethod("tarjeta");
                  setUploadFile(null); // Limpiamos boleta si existía
                }}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Tarjeta
              </Button>
              <Button
                variant={paymentMethod === "boleta" ? "default" : "outline"}
                onClick={() => {
                  setPaymentMethod("boleta");
                }}
              >
                <FilePlus className="mr-2 h-4 w-4" />
                Boleta
              </Button>
            </div>

            {/* Formulario dinámico según el método */}
            {paymentMethod === "tarjeta" && (
              <div className="space-y-3 border rounded p-4">
                <Label htmlFor="card-number">Número de tarjeta</Label>
                <Input id="card-number" placeholder="**** **** **** ****" />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="exp-date">Fecha Exp.</Label>
                    <Input id="exp-date" placeholder="MM/AA" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="3 dígitos" />
                  </div>
                </div>
                <Label htmlFor="card-name">Nombre en la tarjeta</Label>
                <Input id="card-name" placeholder="Tu nombre completo" />
              </div>
            )}

            {paymentMethod === "boleta" && (
              <div className="space-y-3 border rounded p-4">
                <Label htmlFor="payment-proof">Subir comprobante de pago</Label>
                <Input
                  id="payment-proof"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
                {uploadFile && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    <span>Archivo seleccionado: {uploadFile.name}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Formatos aceptados: PDF, JPG, PNG (máx. 5MB)
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentDialog(false);
                setPaymentMethod(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={
                !paymentMethod ||
                (paymentMethod === "boleta" && !uploadFile)
              }
            >
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para subir documentación extra (ej. Capstone) */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir documentación adicional</DialogTitle>
            <DialogDescription>
              Para completar la solicitud de {selectedDocument?.name}, sube la
              documentación requerida.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="document-upload">Documento (PDF, JPG, PNG)</Label>
              <Input
                id="document-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
              />
              <p className="text-xs text-gray-500">
                Tamaño máximo: 5MB
              </p>
            </div>
            {uploadFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>Archivo seleccionado: {uploadFile.name}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={confirmUpload} disabled={!uploadFile}>
              Subir Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
