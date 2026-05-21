"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getSolicitudesDocumentos,
  updateEstadoSolicitud,
  subirDocumentoListo,
  getAdminBoletaUrl,
  getAdminDocumentoListoUrl,
  downloadConAuth,
} from "@/services/solicitudes-documentos";
import type { SolicitudDocumento, EstadoSolicitud } from "@/types/solicitud-documento";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Download,
  Upload,
  Bell,
  AlertTriangle,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  certificacion_cursos: "Certificación de Cursos",
  cierre_pensum: "Cierre de Pensum",
  constancia_estudios: "Constancia de Estudios",
};

const ESTADO_CONFIG: Record<
  EstadoSolicitud,
  { label: string; className: string; icon: React.ReactNode }
> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: <Clock className="h-3 w-3" />,
  },
  en_proceso: {
    label: "En Proceso",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  listo: {
    label: "Listo",
    className: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  rechazado: {
    label: "Rechazado",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  const cfg = ESTADO_CONFIG[estado];
  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 w-fit ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

function fmtFecha(iso: string | null): string {
  if (!iso) return "—";
  // Forzar noon local para evitar que YYYY-MM-DD se parsee como UTC
  // medianoche y retroceda un día en Guatemala (UTC-6)
  const safe = iso.length === 10 ? iso + "T12:00:00" : iso;
  return new Date(safe).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function SolicitudesDocumentosAdmin() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [solicitudes, setSolicitudes] = useState<SolicitudDocumento[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Filtros
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");

  // Modal detalle / cambio de estado
  const [detalle, setDetalle] = useState<SolicitudDocumento | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoSolicitud>("pendiente");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Subir documento listo
  const [archivoDocumento, setArchivoDocumento] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  // ── Carga ────────────────────────────────────────────────────────────────

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSolicitudesDocumentos({
        estado: filtroEstado as EstadoSolicitud | "",
        tipo_documento: filtroTipo,
        search,
        page,
        per_page: perPage,
      });
      setSolicitudes(res.data);
      setTotal(res.meta.total);
    } catch {
      toast({
        variant: "destructive",
        title: "Error al cargar solicitudes",
        description: "No se pudieron obtener las solicitudes. Intente nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroTipo, search, page, toast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // ── Abrir modal ──────────────────────────────────────────────────────────

  const abrirDetalle = (sol: SolicitudDocumento) => {
    setDetalle(sol);
    setNuevoEstado(sol.estado);
    setObservaciones(sol.observaciones ?? "");
    setArchivoDocumento(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Actualizar estado ────────────────────────────────────────────────────

  const handleGuardarEstado = async () => {
    if (!detalle) return;
    setGuardando(true);
    try {
      const updated = await updateEstadoSolicitud(detalle.id, nuevoEstado, observaciones || undefined);
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
      toast({
        title: "✅ Estado actualizado",
        description: `Solicitud #${detalle.id} → "${ESTADO_CONFIG[nuevoEstado].label}". El estudiante fue notificado.`,
        className: "bg-green-50 border-green-200",
      });
      setDetalle(null);
    } catch {
      toast({ variant: "destructive", title: "Error al actualizar estado" });
    } finally {
      setGuardando(false);
    }
  };

  // ── Subir documento listo ────────────────────────────────────────────────

  const handleSubirDocumento = async () => {
    if (!detalle || !archivoDocumento) return;
    setSubiendo(true);
    try {
      const updated = await subirDocumentoListo(detalle.id, archivoDocumento, observaciones || undefined);
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
      toast({
        title: "📤 Documento enviado",
        description: `Documento subido y el estudiante fue notificado que está listo.`,
        className: "bg-green-50 border-green-200",
      });
      setDetalle(null);
    } catch {
      toast({ variant: "destructive", title: "Error al subir el documento" });
    } finally {
      setSubiendo(false);
    }
  };

  // ── Búsqueda con debounce ─────────────────────────────────────────────────

  const [inputSearch, setInputSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(inputSearch);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [inputSearch]);

  // ── Render ───────────────────────────────────────────────────────────────

  const lastPage = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Cabecera */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5" />
                Solicitudes de Documentos Estudiantiles
              </CardTitle>
              <CardDescription>
                Gestión de solicitudes de documentos académicos enviadas por los
                estudiantes
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={cargar}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
          </div>
        </CardHeader>

        {/* Filtros */}
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Buscar por nombre o carnet..."
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
              />
            </div>

            <Select
              value={filtroEstado}
              onValueChange={(v) => {
                setFiltroEstado(v === "todos" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="listo">Listo</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtroTipo}
              onValueChange={(v) => {
                setFiltroTipo(v === "todos" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="certificacion_cursos">
                  Certificación de Cursos
                </SelectItem>
                <SelectItem value="cierre_pensum">Cierre de Pensum</SelectItem>
                <SelectItem value="constancia_estudios">
                  Constancia de Estudios
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando solicitudes...
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No hay solicitudes que coincidan con los filtros.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/70">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Carnet</TableHead>
                    <TableHead>Tipo de Documento</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead>Boleta</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitudes.map((sol) => (
                    <TableRow key={sol.id} className="hover:bg-blue-50/20">
                      <TableCell className="text-gray-400 text-xs">
                        {sol.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sol.prospecto?.nombre_completo ?? `ID ${sol.estudiante_id}`}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {sol.prospecto?.carnet ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {TIPO_LABELS[sol.tipo_documento] ?? sol.tipo_documento}
                        </span>
                      </TableCell>
                      <TableCell>
                        {sol.monto > 0 ? (
                          <span className="font-medium text-gray-800">
                            Q{Number(sol.monto).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-green-600 text-sm">Gratis</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <EstadoBadge estado={sol.estado} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {fmtFecha(sol.fecha_solicitud)}
                      </TableCell>
                      <TableCell>
                        {sol.ruta_archivo_boleta ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-blue-600 hover:text-blue-800"
                            onClick={() => downloadConAuth(getAdminBoletaUrl(sol.id), `boleta_${sol.id}.pdf`)}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Ver
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">Sin boleta</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1"
                          onClick={() => abrirDetalle(sol)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Gestionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          {total > perPage && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>
                Mostrando {(page - 1) * perPage + 1}–
                {Math.min(page * perPage, total)} de {total} solicitudes
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal Detalle / Cambio de estado ── */}
      <Dialog
        open={!!detalle}
        onOpenChange={(open) => !open && setDetalle(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gestionar Solicitud #{detalle?.id}
            </DialogTitle>
            <DialogDescription>
              Revisa los detalles, actualiza el estado y sube el documento cuando esté listo.
            </DialogDescription>
          </DialogHeader>

          {detalle && (
            <div className="space-y-5 py-2">

              {/* ── Subir documento listo (PRIMERO) ── */}
              <div className="border-2 rounded-lg p-4 space-y-3 bg-amber-50 border-amber-400">
                <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {detalle.ruta_documento_listo ? "✅ Reemplazar documento" : "📤 Subir documento listo"}
                </p>
                <p className="text-xs text-amber-700">
                  Al subir, el estado cambia a "Listo" y el estudiante recibe notificación automática.
                </p>
                <label
                  htmlFor="doc-upload-input"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-amber-400 rounded-lg p-4 text-center cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  {archivoDocumento ? (
                    <div className="flex items-center gap-2 text-amber-800">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">{archivoDocumento.name}</span>
                      <span className="text-xs text-gray-500">({(archivoDocumento.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mb-1 text-amber-600 opacity-80" />
                      <span className="text-amber-700 text-sm font-medium">Haz clic para seleccionar PDF, JPG o PNG</span>
                    </>
                  )}
                </label>
                <input
                  id="doc-upload-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setArchivoDocumento(e.target.files?.[0] ?? null)}
                />
                <Button
                  className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleSubirDocumento}
                  disabled={subiendo || !archivoDocumento}
                >
                  {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                  {subiendo ? "Subiendo..." : archivoDocumento ? "Subir y notificar al estudiante" : "Selecciona un archivo primero"}
                </Button>
              </div>

              {/* Documento ya subido */}
              {detalle.ruta_documento_listo && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>Documento ya subido</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-green-700 border-green-300 hover:bg-green-50"
                    onClick={() => downloadConAuth(getAdminDocumentoListoUrl(detalle.id), `documento_listo_${detalle.id}.pdf`)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar
                  </Button>
                </div>
              )}

              {/* Info estudiante */}
              <div className="rounded-lg bg-gray-50 p-4 space-y-1 text-sm">
                <p>
                  <span className="text-gray-500 font-medium">Estudiante:</span>{" "}
                  {detalle.prospecto?.nombre_completo ?? `ID ${detalle.estudiante_id}`}
                </p>
                <p>
                  <span className="text-gray-500 font-medium">Carnet:</span>{" "}
                  {detalle.prospecto?.carnet ?? "—"}
                </p>
                <p>
                  <span className="text-gray-500 font-medium">Correo:</span>{" "}
                  {detalle.prospecto?.correo_electronico ?? "—"}
                </p>
              </div>

              {/* Info solicitud */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Tipo de documento</p>
                  <p>{TIPO_LABELS[detalle.tipo_documento] ?? detalle.tipo_documento}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-1">Monto</p>
                  <p>{detalle.monto > 0 ? `Q${Number(detalle.monto).toFixed(2)}` : "Sin costo"}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-1">Fecha solicitud</p>
                  <p>{fmtFecha(detalle.fecha_solicitud)}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-1">Fecha procesamiento</p>
                  <p>{fmtFecha(detalle.fecha_procesamiento)}</p>
                </div>
              </div>

              {/* Datos bancarios */}
              {detalle.banco && (
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm space-y-1">
                  <p className="font-medium text-blue-700 mb-1">Datos de pago</p>
                  <p><span className="text-gray-500">Banco:</span> {detalle.banco}</p>
                  <p><span className="text-gray-500">Referencia:</span> {detalle.numero_referencia}</p>
                  <p><span className="text-gray-500">Fecha recibo:</span> {fmtFecha(detalle.fecha_recibo)}</p>
                  {detalle.ruta_archivo_boleta && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 gap-1 text-blue-700 border-blue-200 hover:bg-blue-50"
                      onClick={() => downloadConAuth(getAdminBoletaUrl(detalle.id), `boleta_${detalle.id}.pdf`)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Ver boleta de pago
                    </Button>
                  )}
                </div>
              )}

              {/* Cambiar estado manualmente */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Cambiar estado manualmente
                </Label>
                <Select
                  value={nuevoEstado}
                  onValueChange={(v) => setNuevoEstado(v as EstadoSolicitud)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">⏳ Pendiente</SelectItem>
                    <SelectItem value="en_proceso">🔄 En Proceso</SelectItem>
                    <SelectItem value="listo" disabled={!detalle?.ruta_documento_listo}>✅ Listo (requiere subir archivo)</SelectItem>
                    <SelectItem value="rechazado">❌ Rechazado</SelectItem>
                  </SelectContent>
                </Select>
                {nuevoEstado === 'listo' && !detalle?.ruta_documento_listo && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    Para marcar como listo debes subir el documento usando la sección de arriba.
                  </p>
                )}
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Observaciones (visibles para el estudiante)
                </Label>
                <Textarea
                  placeholder="Escribe un mensaje o motivo para el estudiante..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetalle(null)} disabled={guardando || subiendo}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarEstado} disabled={guardando || subiendo}>
              {guardando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Bell className="h-4 w-4 mr-1" />
              Guardar y notificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
