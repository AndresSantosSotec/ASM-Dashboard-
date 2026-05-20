"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  Download,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/utils/apiConfig";

const API_NOTAS = `${API_BASE_URL}/api/notas-pago`;

const NotesManagement = () => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [skipErrors, setSkipErrors] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(`${API_NOTAS}/template`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "plantilla_notas_pago.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Plantilla descargada", description: "Formato correcto con ejemplos incluidos." });
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo descargar la plantilla: " + err.message, variant: "destructive" });
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({ title: "Error", description: "Selecciona un archivo primero.", variant: "destructive" });
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("skip_errors", skipErrors ? "1" : "0");
      const r = await fetch(`${API_NOTAS}/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await r.json();
      setImportResult(json);
      if (json.success) {
        toast({ title: "Importación completada", description: json.message });
        setImportFile(null);
      } else {
        toast({ title: "Importación con errores", description: json.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Gestión Masiva de Notas de Pago</h3>
          <p className="text-sm text-muted-foreground">
            Importa notas para múltiples estudiantes desde un archivo Excel o CSV.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/finanzas/notas" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver módulo completo de notas
          </a>
        </Button>
      </div>

      {/* Card de importación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4 text-blue-600" />
            Importar Notas Masivamente
          </CardTitle>
          <CardDescription>
            Sube un archivo con columnas:{" "}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">carnet</code>,{" "}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">nota</code>,{" "}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">nomenclatura</code>{" "}
            (opcional).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Descargar plantilla */}
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-3">
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Plantilla de Ejemplo</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                Formato correcto con columnas predefinidas y ejemplos.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>
          </div>

          {/* Selector de archivo + botón importar */}
          {!importResult && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="import-file-tareas">Archivo (Excel .xlsx/.xls o CSV)</Label>
                <Input
                  id="import-file-tareas"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="cursor-pointer"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="skip-errors-tareas"
                  checked={skipErrors}
                  onCheckedChange={(v) => setSkipErrors(!!v)}
                />
                <label htmlFor="skip-errors-tareas" className="text-sm cursor-pointer select-none">
                  Omitir errores y continuar con los registros válidos
                </label>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleImport} disabled={importing || !importFile}>
                  {importing ? (
                    <>
                      <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Iniciar Importación
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Resultados */}
          {importResult && (
            <div className="space-y-4">
              {/* Contadores resumen */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Procesados</p>
                  <p className="text-2xl font-bold mt-1">{importResult.summary?.total_procesados ?? 0}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-700 dark:text-green-400 uppercase font-medium">Éxito</p>
                  <p className="text-2xl font-bold mt-1 text-green-700 dark:text-green-400">
                    {importResult.summary?.exitosos ?? 0}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-700 dark:text-red-400 uppercase font-medium">Errores</p>
                  <p className="text-2xl font-bold mt-1 text-red-700 dark:text-red-400">
                    {importResult.summary?.errores ?? 0}
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-700 dark:text-amber-400 uppercase font-medium">Huérfanos</p>
                  <p className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">
                    {importResult.summary?.advertencias ?? 0}
                  </p>
                </div>
              </div>

              {/* Detalle de errores */}
              {importResult.errors?.length > 0 && (
                <div className="border border-red-200 dark:border-red-900 rounded-lg overflow-hidden">
                  <div className="bg-red-50 dark:bg-red-950/20 px-4 py-2 border-b border-red-200 dark:border-red-900 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <h5 className="font-semibold text-red-900 dark:text-red-200 text-sm">Errores de Validación</h5>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto p-3 space-y-1 text-xs">
                    {importResult.errors.map((err: any, i: number) => (
                      <div key={i} className="text-red-800 dark:text-red-300">
                        <span className="font-bold">Fila {err.row}:</span>{" "}
                        {err.carnet ? `[${err.carnet}] ` : ""}{err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalle de huérfanos */}
              {importResult.warnings?.length > 0 && (
                <div className="border border-amber-200 dark:border-amber-900 rounded-lg overflow-hidden">
                  <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-2 border-b border-amber-200 dark:border-amber-900 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <h5 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">Sin Estudiante Vinculado (Huérfanos)</h5>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto p-3 space-y-1 text-xs">
                    {importResult.warnings.map((w: any, i: number) => (
                      <div key={i} className="text-amber-800 dark:text-amber-300">
                        <span className="font-bold">Fila {w.row}:</span> {w.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabla de registros procesados */}
              {importResult.data?.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                    Detalle de Registros Procesados
                  </h5>
                  <div className="border rounded-lg overflow-hidden max-h-[220px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-14">Fila</TableHead>
                          <TableHead className="w-28">Carnet Orig.</TableHead>
                          <TableHead>Estudiante</TableHead>
                          <TableHead className="w-28">Categoría</TableHead>
                          <TableHead>Nota (resumen)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.data.map((item: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{item.row}</TableCell>
                            <TableCell className="font-mono text-xs">{item.carnet_ingresado}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{item.alumno}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] py-0 px-1.5 ${
                                    item.vinculado
                                      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900"
                                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                                  }`}
                                >
                                  {item.vinculado ? "Vinculado" : "Huérfano"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.nomenclatura ? (
                                <Badge variant="secondary" className="text-[10px]">{item.nomenclatura}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                              {item.nota_preview}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => { setImportResult(null); setImportFile(null); }}
                >
                  Nueva Importación
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instrucciones del formato */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex gap-3 text-blue-800 dark:text-blue-300">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm space-y-1">
          <p className="font-semibold">Columnas del archivo:</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li>
              <code className="bg-white/60 dark:bg-white/10 px-1 rounded">carnet</code> —
              Obligatorio. Acepta: <em>ASM-000123</em>, <em>asm-000123</em> o solo el correlativo numérico <em>123</em>.
            </li>
            <li>
              <code className="bg-white/60 dark:bg-white/10 px-1 rounded">nota</code> —
              Obligatorio. Texto de la nota de pago.
            </li>
            <li>
              <code className="bg-white/60 dark:bg-white/10 px-1 rounded">nomenclatura</code> —
              Opcional. Recordatorio, Cobro especial, Excepción, Seguimiento, Urgente, etc.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotesManagement;