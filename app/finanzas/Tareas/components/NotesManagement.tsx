"use client"

import React, { useState } from 'react';
import { fuzzyMatch } from "@/lib/search";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  StickyNote,
  Search,
  Plus
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface NoteImport {
  studentId: string;
  studentName: string;
  note: string;
  type: 'general' | 'financial' | 'academic';
  status: 'pending' | 'success' | 'error';
  message?: string;
}

const NotesManagement = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<NoteImport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulación de lectura de archivo (CSV/Excel)
    setIsImporting(true);
    toast({
      title: "Procesando archivo",
      description: "Leyendo datos de notas masivas...",
    });

    // Simulación de datos previsualizados
    setTimeout(() => {
      setPreviewData([
        { studentId: "2023001", studentName: "Juan Pérez", note: "Convenio de pago activo hasta Junio", type: 'financial', status: 'pending' },
        { studentId: "2023045", studentName: "María López", note: "Estudiante solicita prórroga por viaje", type: 'general', status: 'pending' },
        { studentId: "2024102", studentName: "Carlos Ruiz", note: "Error en cargo de mora - Ajustado", type: 'financial', status: 'pending' },
      ]);
      setIsImporting(false);
    }, 1500);
  };

  const handleProcessImport = () => {
    setIsImporting(true);
    // Simulación de guardado en base de datos
    setTimeout(() => {
      setPreviewData(prev => prev.map(item => ({
        ...item,
        status: 'success',
        message: 'Nota guardada exitosamente'
      })));
      setIsImporting(false);
      toast({
        title: "Carga completada",
        description: "Se han procesado las notas exitosamente.",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Gestión Masiva de Notas</h3>
          <p className="text-sm text-muted-foreground">Carga notas o comentarios para múltiples estudiantes simultáneamente.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Cargar CSV
              <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
            </label>
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nota Individual
          </Button>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar en la previsualización..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {previewData.length > 0 && (
              <Button onClick={handleProcessImport} disabled={isImporting}>
                {isImporting ? "Procesando..." : "Confirmar Carga"}
              </Button>
            )}
          </div>

          {previewData.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData
                    .filter(n => fuzzyMatch([n.studentName, n.studentId], searchQuery))
                    .map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="font-medium">{item.studentName}</div>
                        <div className="text-xs text-muted-foreground">{item.studentId}</div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{item.note}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{item.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.status === 'pending' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                          {item.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          <span className="text-sm capitalize">{item.message || item.status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="font-medium">No hay datos para mostrar</h4>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Sube un archivo CSV con las columnas correspondientes para empezar la carga masiva.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div className="text-sm">
          <strong>Formato sugerido:</strong> Asegúrate de que tu archivo CSV tenga las columnas: 
          <code className="mx-1 bg-white/50 px-1 rounded">student_id</code>, 
          <code className="mx-1 bg-white/50 px-1 rounded">full_name</code>, 
          <code className="mx-1 bg-white/50 px-1 rounded">note_content</code>.
        </div>
      </div>
    </div>
  );
};

export default NotesManagement;