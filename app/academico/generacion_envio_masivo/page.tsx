"use client";

import { useState, useEffect } from "react";
import { fuzzyMatch } from "@/lib/search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Mail, 
  Key, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Download,
  RefreshCw,
  Shield,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import api from "@/services/api";
import Swal from "sweetalert2";
import { useToast } from "@/components/ui/use-toast";

interface BatchStats {
  total: number;
  success: number;
  skipped: number;
  error: number;
  errors: Array<{ email: string; message: string }>;
}

interface BatchHistory {
  batch_id: string;
  total: number;
  success_count: number;
  skipped_count: number;
  error_count: number;
  started_at: string;
  finished_at: string;
}

interface Prospecto {
  id: number;
  nombre_completo: string;
  correo: string;
  carnet: string;
  estatus: string;
}

interface Programa {
  id: number;
  nombre: string;
  codigo: string;
}

export default function GeneracionEnvioMasivoPage() {
  const { toast } = useToast();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [prospectoCount, setProspectoCount] = useState<number | null>(null);
  const [sendEmails, setSendEmails] = useState(true);
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  
  // Estados de lista y selección
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loadingProspectos, setLoadingProspectos] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(50);
  
  // Filtros avanzados
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [selectedPrograma, setSelectedPrograma] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("Inscrito");
  const [orderBy, setOrderBy] = useState<string>("created_desc"); // new, old
  
  // 🆕 NUEVO: Filtro de estudiantes activos en Moodle
  const [soloActivosMoodle, setSoloActivosMoodle] = useState(false);
  const [mesMoodle, setMesMoodle] = useState<number>(new Date().getMonth() + 1);
  const [anioMoodle, setAnioMoodle] = useState<number>(new Date().getFullYear());
  const [totalActivosMoodle, setTotalActivosMoodle] = useState<number | null>(null);
  
  // Estados de progreso
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [batchStats, setBatchStats] = useState<BatchStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Estados de historial
  const [batchHistory, setBatchHistory] = useState<BatchHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Cargar conteo inicial
  useEffect(() => {
    fetchProspectoCount();
    fetchBatchHistory();
    fetchProspectos();
    fetchProgramas();
  }, []);

  // Recargar cuando cambien los filtros (incluyendo filtro Moodle)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchProspectos(1);
    }
    // Actualizar conteo también
    fetchProspectoCount();
  }, [perPage, selectedPrograma, selectedStatus, orderBy, soloActivosMoodle, mesMoodle, anioMoodle]);

  // Monitorear progreso del batch actual
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring && currentBatchId) {
      interval = setInterval(() => {
        fetchBatchStats(currentBatchId);
      }, 3000); // Actualizar cada 3 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, currentBatchId]);

  const fetchProspectoCount = async () => {
    try {
      const params = new URLSearchParams();
      
      // 🆕 Agregar filtro Moodle si está activo
      if (soloActivosMoodle) {
        params.append('solo_activos_moodle', 'true');
        params.append('mes_moodle', mesMoodle.toString());
        params.append('anio_moodle', anioMoodle.toString());
      }
      
      const response = await api.get(`/massive-user-generation/prospectos/count?${params}`);
      setProspectoCount(response.data.count);
      
      // 🆕 Guardar total de activos en Moodle
      if (response.data.filtro_moodle) {
        setTotalActivosMoodle(response.data.filtro_moodle.total_activos_moodle);
      }
    } catch (error: any) {
      console.error('Error fetching prospecto count:', error);
      toast({
        title: "Error",
        description: "No se pudo obtener el conteo de prospectos",
        variant: "destructive",
      });
    }
  };

  const fetchProspectos = async (page = 1) => {
    try {
      setLoadingProspectos(true);
      const params = new URLSearchParams({
        per_page: perPage.toString(),
        page: page.toString(),
        status: selectedStatus,
        order_by: orderBy,
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedPrograma && selectedPrograma !== 'all') {
        params.append('programa_id', selectedPrograma);
      }
      
      // 🆕 Agregar filtro Moodle si está activo
      if (soloActivosMoodle) {
        params.append('solo_activos_moodle', 'true');
        params.append('mes_moodle', mesMoodle.toString());
        params.append('anio_moodle', anioMoodle.toString());
      }
      
      const response = await api.get(`/massive-user-generation/prospectos/list?${params}`);
      console.log('Prospectos response:', response.data.data);
      setProspectos(response.data.data);
      setCurrentPage(response.data.meta.current_page);
      setTotalPages(response.data.meta.last_page);
      
      // 🆕 Mostrar info del filtro Moodle si está activo
      if (response.data.filtro_moodle) {
        setTotalActivosMoodle(response.data.filtro_moodle.total_activos_moodle);
      }
    } catch (error: any) {
      console.error('Error fetching prospectos:', error);
      toast({
        title: "Error",
        description: "No se pudo obtener la lista de prospectos",
        variant: "destructive",
      });
    } finally {
      setLoadingProspectos(false);
    }
  };

  const fetchProgramas = async () => {
    try {
      const response = await api.get('/massive-user-generation/programas');
      setProgramas(response.data.data);
    } catch (error: any) {
      console.error('Error fetching programas:', error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProspectos.length) {
      setSelectedIds(new Set());
    } else {
      const idsToSelect = filteredProspectos.slice(0, 200).map(p => p.id);
      setSelectedIds(new Set(idsToSelect));
      
      if (filteredProspectos.length > 200) {
        toast({
          title: "⚠️ Límite de Selección",
          description: `Solo se seleccionaron los primeros 200 registros de ${filteredProspectos.length}`,
          variant: "default",
        });
      }
    }
  };

  const selectAllRecords = async () => {
    const result = await Swal.fire({
      title: '¿Seleccionar Todos los Registros?',
      html: `
        <div class="text-left space-y-2">
          <p>Esto seleccionará <strong>TODOS los prospectos</strong> que coincidan con los filtros actuales.</p>
          <br/>
          <p class="text-sm text-yellow-600">
            ⚠️ Advertencia: Si hay miles de registros, el proceso puede tomar varios minutos.
          </p>
          <br/>
          <p class="text-sm text-gray-600">
            Total estimado: <strong>${prospectoCount || 0} prospectos</strong>
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Seleccionar Todos',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingProspectos(true);
      const params = new URLSearchParams({
        per_page: '10000', // Límite alto para obtener todos
        page: '1',
        status: selectedStatus,
        order_by: orderBy,
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedPrograma && selectedPrograma !== 'all') {
        params.append('programa_id', selectedPrograma);
      }
      
      const response = await api.get(`/massive-user-generation/prospectos/list?${params}`);
      const allIds = response.data.data.map((p: Prospecto) => p.id);
      setSelectedIds(new Set(allIds));
      
      toast({
        title: "✅ Selección Completa",
        description: `${allIds.length} registros seleccionados`,
      });
    } catch (error: any) {
      console.error('Error selecting all:', error);
      toast({
        title: "Error",
        description: "No se pudo seleccionar todos los registros",
        variant: "destructive",
      });
    } finally {
      setLoadingProspectos(false);
    }
  };

  const toggleSelectProspecto = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      // Verificar límite de 200
      if (newSelected.size >= 200) {
        toast({
          title: "⚠️ Límite Alcanzado",
          description: "No puedes seleccionar más de 200 registros a la vez. Usa 'Seleccionar Todos' para procesar más.",
          variant: "destructive",
        });
        return;
      }
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const filteredProspectos = prospectos.filter(p =>
    fuzzyMatch([p.nombre_completo, p.correo, p.carnet], searchTerm)
  );

  const fetchBatchStats = async (batchId: string) => {
    try {
      const response = await api.get(`/massive-user-generation/batch/${batchId}/stats`);
      setBatchStats(response.data.stats);
      
      // Detener monitoreo si todos fueron procesados
      const stats = response.data.stats;
      if (stats.total > 0 && stats.total === (stats.success + stats.skipped + stats.error)) {
        setIsMonitoring(false);
        
        toast({
          title: "✅ Proceso Completado",
          description: `${stats.success} usuarios creados, ${stats.skipped} omitidos, ${stats.error} errores`,
        });
      }
    } catch (error: any) {
      console.error('Error fetching batch stats:', error);
    }
  };

  const fetchBatchHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.get('/massive-user-generation/batch/history?per_page=10');
      setBatchHistory(response.data.data);
    } catch (error: any) {
      console.error('Error fetching batch history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStartGeneration = async () => {
    if (selectedIds.size === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin Selección',
        text: 'Debes seleccionar al menos un prospecto para generar usuarios',
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Confirmar Generación Masiva?',
      html: `
        <div class="text-left space-y-2">
          <p>Se crearán <strong>${selectedIds.size} usuarios</strong> para los prospectos seleccionados.</p>
          <br/>
          <p>Configuración:</p>
          <ul class="list-disc list-inside">
            <li>Envío de emails: <strong>${sendEmails ? 'Activado' : 'Desactivado'}</strong></li>
            <li>Forzar cambio de contraseña: <strong>${forcePasswordChange ? 'Sí' : 'No'}</strong></li>
          </ul>
          <br/>
          <p class="text-sm text-gray-600">Este proceso se ejecutará en segundo plano y puede tomar varios minutos.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Generar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      
      const response = await api.post('/massive-user-generation/start', {
        send_emails: sendEmails,
        force_password_change: forcePasswordChange,
        prospecto_ids: Array.from(selectedIds),
      });

      if (response.data.success) {
        const batchId = response.data.batch_id;
        setCurrentBatchId(batchId);
        setIsMonitoring(true);
        setBatchStats({
          total: 0,
          success: 0,
          skipped: 0,
          error: 0,
          errors: [],
        });

        toast({
          title: "🚀 Proceso Iniciado",
          description: `${response.data.queued} trabajos encolados. Batch ID: ${batchId}`,
        });

        // Limpiar selección
        setSelectedIds(new Set());

        // Actualizar conteo después de iniciar
        setTimeout(() => {
          fetchProspectoCount();
          fetchBatchHistory();
          fetchProspectos(currentPage);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error starting generation:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al iniciar la generación masiva',
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = batchStats ? 
    Math.round(((batchStats.success + batchStats.skipped + batchStats.error) / (batchStats.total || 1)) * 100) : 
    0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-blue-600" />
          Generación Masiva de Usuarios
        </h1>
        <p className="text-gray-600 mt-2">
          Crea cuentas de usuario automáticamente para todos los prospectos inscritos sin usuario
        </p>
      </div>

      <Tabs defaultValue="generation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="generation">Generación</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="generation" className="space-y-6">
          {/* Card de Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Prospectos Sin Usuario</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  {prospectoCount !== null ? (
                    <>
                      <Users className="h-6 w-6 text-blue-600" />
                      {prospectoCount.toLocaleString()}
                    </>
                  ) : (
                    <div className="animate-pulse bg-gray-200 h-10 w-24 rounded"></div>
                  )}
                </CardTitle>
                {soloActivosMoodle && (
                  <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-800">
                    🎓 Filtro Moodle: {mesMoodle}/{anioMoodle}
                  </Badge>
                )}
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Envío de Emails</CardDescription>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                  {sendEmails ? 'Activado' : 'Desactivado'}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Cambio de Contraseña</CardDescription>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  {forcePasswordChange ? 'Obligatorio' : 'Opcional'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Configuración de Generación
              </CardTitle>
              <CardDescription>
                Ajusta las opciones antes de iniciar el proceso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="send-emails" className="text-base">Enviar Credenciales por Email</Label>
                  <p className="text-sm text-gray-600">
                    Envía un correo a cada usuario con su usuario y contraseña
                  </p>
                </div>
                <Switch
                  id="send-emails"
                  checked={sendEmails}
                  onCheckedChange={setSendEmails}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="force-password" className="text-base">Forzar Cambio de Contraseña</Label>
                  <p className="text-sm text-gray-600">
                    Obliga al usuario a cambiar su contraseña en el primer login
                  </p>
                </div>
                <Switch
                  id="force-password"
                  checked={forcePasswordChange}
                  onCheckedChange={setForcePasswordChange}
                />
              </div>

              {/* 🆕 NUEVO: Filtro de estudiantes activos en Moodle */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <Label htmlFor="solo-activos-moodle" className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      Solo Estudiantes Activos en Moodle
                    </Label>
                    <p className="text-sm text-gray-600">
                      Filtra solo estudiantes matriculados en Moodle en el mes/año seleccionado
                    </p>
                  </div>
                  <Switch
                    id="solo-activos-moodle"
                    checked={soloActivosMoodle}
                    onCheckedChange={setSoloActivosMoodle}
                  />
                </div>
                
                {soloActivosMoodle && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <Label htmlFor="mes-moodle" className="text-sm mb-2 block">Mes</Label>
                      <Select value={mesMoodle.toString()} onValueChange={(val) => setMesMoodle(parseInt(val))}>
                        <SelectTrigger id="mes-moodle">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Enero</SelectItem>
                          <SelectItem value="2">Febrero</SelectItem>
                          <SelectItem value="3">Marzo</SelectItem>
                          <SelectItem value="4">Abril</SelectItem>
                          <SelectItem value="5">Mayo</SelectItem>
                          <SelectItem value="6">Junio</SelectItem>
                          <SelectItem value="7">Julio</SelectItem>
                          <SelectItem value="8">Agosto</SelectItem>
                          <SelectItem value="9">Septiembre</SelectItem>
                          <SelectItem value="10">Octubre</SelectItem>
                          <SelectItem value="11">Noviembre</SelectItem>
                          <SelectItem value="12">Diciembre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="anio-moodle" className="text-sm mb-2 block">Año</Label>
                      <Select value={anioMoodle.toString()} onValueChange={(val) => setAnioMoodle(parseInt(val))}>
                        <SelectTrigger id="anio-moodle">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024">2024</SelectItem>
                          <SelectItem value="2025">2025</SelectItem>
                          <SelectItem value="2026">2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {totalActivosMoodle !== null && (
                      <div className="col-span-2">
                        <Alert className="bg-blue-100 border-blue-300">
                          <Users className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-800">Estudiantes Activos en Moodle</AlertTitle>
                          <AlertDescription className="text-blue-700">
                            Se encontraron <strong>{totalActivosMoodle}</strong> estudiantes activos en Moodle para {mesMoodle}/{anioMoodle}.
                            <br />
                            Mostrando solo los que coinciden con prospectos sin usuario.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Información de Seguridad</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Las contraseñas se generan con 12 caracteres (mayúsculas, minúsculas, números y símbolos)</li>
                    <li>Solo se envían por email si la opción está activada</li>
                    <li>Se almacenan encriptadas con bcrypt en la base de datos</li>
                    <li>El rol "Estudiante" se asigna automáticamente</li>
                    <li>Los permisos se configuran según el rol</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleStartGeneration}
                disabled={loading || isMonitoring || selectedIds.size === 0}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Iniciando generación...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    {sendEmails 
                      ? `Generar Usuarios y Enviar Correos a ${selectedIds.size} Prospecto${selectedIds.size !== 1 ? 's' : ''}` 
                      : `Generar ${selectedIds.size} Usuario${selectedIds.size !== 1 ? 's' : ''} (Sin Envío de Correo)`
                    }
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Prospectos con Selección */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Seleccionar Prospectos
                  </CardTitle>
                  <CardDescription>
                    {selectedIds.size} de {filteredProspectos.length} prospectos seleccionados
                  </CardDescription>
                  {(selectedPrograma !== 'all' || searchTerm || soloActivosMoodle) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedPrograma !== 'all' && (
                        <Badge variant="outline">📚 Programa</Badge>
                      )}
                      {searchTerm && (
                        <Badge variant="outline">🔍 Búsqueda</Badge>
                      )}
                      {soloActivosMoodle && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          🎓 Moodle {mesMoodle}/{anioMoodle}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(selectedPrograma !== 'all' || searchTerm || soloActivosMoodle) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedPrograma("all");
                        setSoloActivosMoodle(false);
                        setSelectedIds(new Set());
                      }}
                    >
                      Limpiar Filtros
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    disabled={loadingProspectos || filteredProspectos.length === 0}
                  >
                    {selectedIds.size === filteredProspectos.length ? 'Deseleccionar Página' : 'Seleccionar Página (máx 200)'}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={selectAllRecords}
                    disabled={loadingProspectos}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Seleccionar TODOS ({prospectoCount || 0})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchProspectos(currentPage)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros Avanzados */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Búsqueda */}
                <div className="md:col-span-2">
                  <Label htmlFor="search" className="text-sm mb-2 block">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Nombre, correo o carnet..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filtro por Programa */}
                <div>
                  <Label htmlFor="programa" className="text-sm mb-2 block">Programa/Carrera</Label>
                  <Select value={selectedPrograma} onValueChange={setSelectedPrograma}>
                    <SelectTrigger id="programa">
                      <SelectValue placeholder="Todos los programas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los programas</SelectItem>
                      {programas.map((programa) => (
                        <SelectItem key={programa.id} value={programa.id.toString()}>
                          {programa.codigo} - {programa.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Orden (Nuevos/Antiguos) */}
                <div>
                  <Label htmlFor="orderBy" className="text-sm mb-2 block">Ordenar Por</Label>
                  <Select value={orderBy} onValueChange={setOrderBy}>
                    <SelectTrigger id="orderBy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_desc">Más Recientes</SelectItem>
                      <SelectItem value="created_asc">Más Antiguos</SelectItem>
                      <SelectItem value="name_asc">Nombre A-Z</SelectItem>
                      <SelectItem value="name_desc">Nombre Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Registros por página */}
                <div>
                  <Label htmlFor="perPage" className="text-sm mb-2 block">Mostrar</Label>
                  <Select value={perPage.toString()} onValueChange={(val) => setPerPage(parseInt(val))}>
                    <SelectTrigger id="perPage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 registros</SelectItem>
                      <SelectItem value="50">50 registros</SelectItem>
                      <SelectItem value="100">100 registros</SelectItem>
                      <SelectItem value="200">200 registros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabla de Prospectos */}
              {loadingProspectos ? (
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
                  ))}
                </div>
              ) : filteredProspectos.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron prospectos</p>
                </div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="w-12 px-4 py-3 text-left">
                              <Checkbox
                                checked={selectedIds.size === filteredProspectos.length && filteredProspectos.length > 0}
                                onCheckedChange={toggleSelectAll}
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Carnet</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nombre Completo</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Correo Electrónico</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredProspectos.map((prospecto) => (
                            <tr 
                              key={prospecto.id} 
                              className={`hover:bg-gray-50 cursor-pointer ${selectedIds.has(prospecto.id) ? 'bg-blue-50' : ''}`}
                              onClick={() => toggleSelectProspecto(prospecto.id)}
                            >
                              <td className="px-4 py-3">
                                <Checkbox
                                  checked={selectedIds.has(prospecto.id)}
                                  onCheckedChange={() => toggleSelectProspecto(prospecto.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td className="px-4 py-3 text-sm font-mono">{prospecto.carnet}</td>
                              <td className="px-4 py-3 text-sm font-medium">{prospecto.nombre_completo}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{prospecto.correo}</td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                  {prospecto.estatus}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <p>Página {currentPage} de {totalPages}</p>
                        <p className="text-xs text-gray-500">
                          Mostrando {filteredProspectos.length} de {prospectoCount || 0} prospectos
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchProspectos(currentPage - 1)}
                          disabled={currentPage === 1 || loadingProspectos}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        <span className="text-sm text-gray-600 px-2">
                          {currentPage} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchProspectos(currentPage + 1)}
                          disabled={currentPage === totalPages || loadingProspectos}
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Progreso del Batch Actual */}
          {isMonitoring && batchStats && (
            <Card className="border-2 border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 animate-pulse text-blue-600" />
                  Procesando Batch: {currentBatchId}
                </CardTitle>
                <CardDescription>
                  Progreso en tiempo real de la generación masiva
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-2xl font-bold">{batchStats.success}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Exitosos</p>
                  </div>

                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-center gap-2 text-yellow-600">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-2xl font-bold">{batchStats.skipped}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Omitidos</p>
                  </div>

                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span className="text-2xl font-bold">{batchStats.error}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Errores</p>
                  </div>
                </div>

                {batchStats.error > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Se encontraron {batchStats.error} errores</AlertTitle>
                    <AlertDescription className="max-h-40 overflow-y-auto">
                      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                        {batchStats.errors.slice(0, 5).map((err, idx) => (
                          <li key={idx}>
                            <strong>{err.email}:</strong> {err.message}
                          </li>
                        ))}
                        {batchStats.errors.length > 5 && (
                          <li className="italic">... y {batchStats.errors.length - 5} más</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historial de Batches</CardTitle>
                <CardDescription>Últimas 10 ejecuciones de generación masiva</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchBatchHistory}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-20 rounded"></div>
                  ))}
                </div>
              ) : batchHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay historial de batches</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {batchHistory.map((batch) => (
                    <div key={batch.batch_id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-mono text-sm text-gray-600">{batch.batch_id}</p>
                          <p className="text-sm text-gray-500">
                            Iniciado: {new Date(batch.started_at).toLocaleString('es')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            {batch.success_count} exitosos
                          </Badge>
                          {batch.skipped_count > 0 && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                              {batch.skipped_count} omitidos
                            </Badge>
                          )}
                          {batch.error_count > 0 && (
                            <Badge variant="destructive">
                              {batch.error_count} errores
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress 
                          value={(batch.success_count / batch.total) * 100} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
