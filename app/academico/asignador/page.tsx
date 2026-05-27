'use client'

import { useState } from 'react'
import {
  BookOpen, Users, Calendar, BarChart3, FileText, Settings2,
  ChevronRight, Loader2, Download, RefreshCw, CheckCircle2,
  AlertTriangle, Info,
} from 'lucide-react'
import { Button }         from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge }          from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input }          from '@/components/ui/input'
import { Label }          from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  fetchAsignadorPreview, ejecutarAsignacion, descargarCsvDia,
  type AsignadorPreview, type AsignadorResultado,
} from '@/services/asignador'

// ── Constantes de UI ──────────────────────────────────────────────────────────

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DIAS_ORDEN = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const DIA_STYLE: Record<string, string> = {
  'Lunes':      'bg-blue-500 hover:bg-blue-600',
  'Martes':     'bg-violet-500 hover:bg-violet-600',
  'Miércoles':  'bg-emerald-500 hover:bg-emerald-600',
  'Jueves':     'bg-amber-500 hover:bg-amber-600',
  'Viernes':    'bg-pink-500 hover:bg-pink-600',
  'Sábado':     'bg-cyan-500 hover:bg-cyan-600',
}

const DIA_DOT: Record<string, string> = {
  'Lunes':      'bg-blue-500',
  'Martes':     'bg-violet-500',
  'Miércoles':  'bg-emerald-500',
  'Jueves':     'bg-amber-500',
  'Viernes':    'bg-pink-500',
  'Sábado':     'bg-cyan-500',
}

type Step = 1 | 2 | 3 | 4
type FilterTipo = 'todos' | 'ASIGNACION_AUTOMATICA' | 'SIN_ASIGNACION'

// ── Componente principal ──────────────────────────────────────────────────────

export default function AsignadorPage() {
  const hoy       = new Date()
  const nextMonth = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)

  // Config
  const [mes,          setMes]          = useState<string>(MESES[nextMonth.getMonth()])
  const [anio,         setAnio]         = useState<number>(nextMonth.getFullYear())
  const [maxCupo,      setMaxCupo]      = useState(35)
  const [umbral,       setUmbral]       = useState(65)
  const [showAvanzado, setShowAvanzado] = useState(false)

  // Estado del flujo
  const [step,       setStep]       = useState<Step>(1)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [preview,    setPreview]    = useState<AsignadorPreview | null>(null)
  const [resultado,  setResultado]  = useState<AsignadorResultado | null>(null)
  const [filterTipo, setFilterTipo] = useState<FilterTipo>('todos')
  const [downloading, setDownloading] = useState<string | null>(null)

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handlePreview() {
    if (!mes) return setError('Selecciona un mes')
    setError(null)
    setLoading(true)
    try {
      const data = await fetchAsignadorPreview(mes, anio)
      setPreview(data)
      setStep(2)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'No se pudo conectar con Moodle. Verifica la conexión.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEjecutar() {
    if (!mes || !preview) return
    setError(null)
    setLoading(true)
    setStep(3)
    try {
      const data = await ejecutarAsignacion(mes, anio, maxCupo, umbral)
      setResultado(data)
      setStep(4)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Error durante la asignación. Revisa los logs del servidor.')
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(dia: string) {
    setDownloading(dia)
    try {
      await descargarCsvDia(dia, mes, anio)
    } catch {
      setError(`Error al descargar el CSV de ${dia}`)
    } finally {
      setDownloading(null)
    }
  }

  function reset() {
    setStep(1)
    setPreview(null)
    setResultado(null)
    setError(null)
    setFilterTipo('todos')
  }

  const filteredResultados = resultado?.resultados.filter(r =>
    filterTipo === 'todos' ? true : r.tipo === filterTipo
  ) ?? []

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">

      {/* ── Cabecera ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-blue-600 shrink-0" />
            Asignador Mensual de Cursos Moodle
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Genera archivos CSV por día de semana para importar asignaciones masivas en Moodle.
            Basado en historial académico y reglas de planes.
          </p>
        </div>
        {step > 1 && (
          <Button variant="outline" size="sm" onClick={reset} className="shrink-0">
            <RefreshCw className="h-4 w-4 mr-2" /> Nueva asignación
          </Button>
        )}
      </div>

      {/* ── Stepper ── */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        {[
          { n: 1 as Step, label: 'Configurar' },
          { n: 2 as Step, label: 'Vista previa' },
          { n: 3 as Step, label: 'Procesando' },
          { n: 4 as Step, label: 'Resultados' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-1">
            <div className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
              ${step === s.n
                ? 'bg-blue-600 text-white shadow-sm'
                : step > s.n
                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  : 'bg-muted text-muted-foreground'}
            `}>
              {step > s.n
                ? <CheckCircle2 className="h-3.5 w-3.5" />
                : <span className="w-4 text-center">{s.n}</span>}
              {s.label}
            </div>
            {i < 3 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-0.5" />}
          </div>
        ))}
      </div>

      {/* ── Alerta de error ── */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 1 — CONFIGURAR
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
              Parámetros de asignación
            </CardTitle>
            <CardDescription>
              Selecciona el mes y año destino. Los cursos de Moodle deben tener
              el formato: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Junio Lunes 2026 BBA Materia</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Selector de mes */}
            <div>
              <Label className="mb-3 block font-medium">Mes destino</Label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {MESES.map(m => (
                  <button
                    key={m}
                    onClick={() => setMes(m)}
                    className={`
                      py-2.5 px-2 rounded-lg text-sm font-medium border transition-all
                      ${mes === m
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-105'
                        : 'border-border hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'}
                    `}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de año + badge resumen */}
            <div className="flex items-end gap-4">
              <div>
                <Label htmlFor="anio" className="mb-2 block font-medium">Año</Label>
                <Select value={String(anio)} onValueChange={v => setAnio(Number(v))}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {mes && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">{mes} {anio}</span>
                </div>
              )}
            </div>

            {/* Opciones avanzadas */}
            <div>
              <button
                onClick={() => setShowAvanzado(!showAvanzado)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings2 className="h-4 w-4" />
                {showAvanzado ? 'Ocultar' : 'Ver'} opciones avanzadas
              </button>
              {showAvanzado && (
                <div className="mt-4 p-4 bg-muted/40 rounded-lg grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cupo" className="mb-1.5 block text-sm">
                      Cupo máximo por curso
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="cupo" type="number" min={1} max={200}
                        value={maxCupo}
                        onChange={e => setMaxCupo(Number(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-xs text-muted-foreground">alumnos</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="umbral" className="mb-1.5 block text-sm">
                      Umbral de similitud historial
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="umbral" type="number" min={10} max={100}
                        value={umbral}
                        onChange={e => setUmbral(Number(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-xs text-muted-foreground">
                        % para considerar curso repetido
                      </span>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Alert className="py-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Si la similitud normalizada entre el curso destino y un curso aprobado del historial
                        supera el umbral, el alumno <strong>no</strong> será asignado a ese curso (ya lo aprobó).
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handlePreview} disabled={!mes || loading} size="lg">
              {loading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Consultando Moodle...</>
                : <>Vista previa de datos <ChevronRight className="h-4 w-4 ml-1" /></>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 2 — VISTA PREVIA
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 2 && preview && (
        <div className="space-y-4">

          {/* Stats rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<BookOpen className="h-5 w-5 text-blue-600" />}
              label="Cursos destino" value={preview.cursos_destino} accent="blue"
            />
            <StatCard
              icon={<Users className="h-5 w-5 text-green-600" />}
              label="Alumnos a asignar" value={preview.estudiantes_origen} accent="green"
            />
            <StatCard
              icon={<BarChart3 className="h-5 w-5 text-violet-600" />}
              label="Usuarios en historial" value={preview.total_historial_users.toLocaleString()} accent="violet"
            />
            <StatCard
              icon={<FileText className="h-5 w-5 text-amber-600" />}
              label="Calificaciones" value={preview.total_calificaciones.toLocaleString()} accent="amber"
            />
          </div>

          {/* Distribución por día */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Cursos detectados por día de semana
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {Object.keys(preview.cursos_por_dia).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Sin cursos detectados para este mes.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {DIAS_ORDEN.map(dia => {
                    const count = preview.cursos_por_dia[dia]
                    if (!count) return null
                    return (
                      <div
                        key={dia}
                        className={`flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full text-white text-sm ${DIA_STYLE[dia] ?? 'bg-gray-500'}`}
                      >
                        <span className="font-medium">{dia}</span>
                        <span className="bg-black/20 rounded-full px-2 text-xs font-bold">{count}</span>
                      </div>
                    )
                  })}
                  {/* Días no reconocidos */}
                  {Object.entries(preview.cursos_por_dia)
                    .filter(([k]) => !DIAS_ORDEN.includes(k))
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full bg-gray-400 text-white text-sm">
                        <span>{k}</span>
                        <span className="bg-black/20 rounded-full px-2 text-xs font-bold">{v}</span>
                      </div>
                    ))}
                </div>
              )}

              {!preview.listo && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No se encontraron cursos o alumnos para <strong>{preview.mes} {preview.anio}</strong>.
                    Verifica que los cursos en Moodle usen el formato correcto y que haya matriculados.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Resumen configuración */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground pl-1">
            <span>Cupo máx por curso: <strong className="text-foreground">{maxCupo}</strong></span>
            <span>Umbral historial: <strong className="text-foreground">{umbral}%</strong></span>
            <span>Mes a asignar: <strong className="text-foreground">{preview.mes} {preview.anio}</strong></span>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => setStep(1)}>
              ← Cambiar configuración
            </Button>
            <Button onClick={handleEjecutar} disabled={!preview.listo || loading} size="lg">
              {loading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparando...</>
                : <>Ejecutar asignación <ChevronRight className="h-4 w-4 ml-1" /></>}
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 3 — PROCESANDO
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <Card>
          <CardContent className="py-20 flex flex-col items-center gap-6 text-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-blue-100 dark:border-blue-900 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
            </div>
            <div className="space-y-2 max-w-md">
              <p className="text-xl font-semibold">Procesando {mes} {anio}</p>
              <p className="text-muted-foreground text-sm">
                Cargando historial académico, ejecutando reglas de asignación
                y generando archivos CSV por día de semana...
              </p>
              <p className="text-xs text-muted-foreground bg-muted inline-block px-3 py-1.5 rounded-full mt-2">
                Este proceso puede tardar entre 30 segundos y 3 minutos según el volumen de datos
              </p>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Consultando Moodle DB</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.3s' }} /> Aplicando algoritmo</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '0.6s' }} /> Generando CSVs</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 4 — RESULTADOS
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 4 && resultado && (
        <div className="space-y-5">

          {/* Stats principales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
              label="Asignados" value={resultado.stats.asignados} accent="green"
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
              label="Sin asignación" value={resultado.stats.sin_asignacion} accent="red"
            />
            <StatCard
              icon={<RefreshCw className="h-5 w-5 text-blue-500" />}
              label="Cambio de día" value={resultado.stats.cambio_dia} accent="blue"
            />
            <StatCard
              icon={<Users className="h-5 w-5 text-violet-600" />}
              label="Total procesados" value={resultado.stats.total_usuarios} accent="violet"
            />
          </div>

          {/* Badges de detalle */}
          {(resultado.stats.sin_cupo > 0 || resultado.stats.sin_regla > 0 || resultado.stats.bloqueado_aprobado > 0 || resultado.stats.sin_oferta > 0) && (
            <div className="flex flex-wrap gap-2">
              {resultado.stats.sin_cupo > 0 && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40">
                  Sin cupo: {resultado.stats.sin_cupo}
                </Badge>
              )}
              {resultado.stats.bloqueado_aprobado > 0 && (
                <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/40">
                  Ya aprobados: {resultado.stats.bloqueado_aprobado}
                </Badge>
              )}
              {resultado.stats.sin_regla > 0 && (
                <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 dark:bg-red-950/40">
                  Sin regla de plan: {resultado.stats.sin_regla}
                </Badge>
              )}
              {resultado.stats.sin_oferta > 0 && (
                <Badge variant="outline" className="text-gray-600 border-gray-300">
                  Sin oferta de cursos: {resultado.stats.sin_oferta}
                </Badge>
              )}
            </div>
          )}

          {/* Descarga de CSVs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                Archivos para importar en Moodle
              </CardTitle>
              <CardDescription>
                Ve a Moodle → Administración del curso → Matricular usuarios → Subir CSV.
                Cada archivo corresponde a un día de semana.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(resultado.archivos_csv).length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No se generaron CSVs. Revisa el detalle de asignaciones abajo para entender los motivos.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {DIAS_ORDEN.map(dia => {
                    const info = resultado.archivos_csv[dia]
                    if (!info) return null
                    const isDownloading = downloading === dia
                    return (
                      <button
                        key={dia}
                        onClick={() => handleDownload(dia)}
                        disabled={isDownloading}
                        className={`
                          flex flex-col items-center gap-1.5 px-5 py-4 rounded-xl text-white
                          shadow-sm transition-transform hover:scale-105 active:scale-95
                          disabled:opacity-70 disabled:cursor-not-allowed
                          ${DIA_STYLE[dia] ?? 'bg-gray-500'}
                        `}
                      >
                        {isDownloading
                          ? <Loader2 className="h-5 w-5 animate-spin" />
                          : <Download className="h-5 w-5" />}
                        <span className="font-semibold text-sm">{dia}</span>
                        <span className="text-xs bg-black/20 rounded-full px-2 py-0.5">
                          {info.count} alumnos
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabla de detalle */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base">Detalle de asignaciones</CardTitle>
                <div className="flex gap-1.5 bg-muted rounded-lg p-1">
                  {([ 'todos', 'ASIGNACION_AUTOMATICA', 'SIN_ASIGNACION'] as FilterTipo[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setFilterTipo(t)}
                      className={`
                        px-3 py-1 rounded-md text-xs font-medium transition-colors
                        ${filterTipo === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}
                      `}
                    >
                      {t === 'todos' ? `Todos (${resultado.resultados.length})`
                        : t === 'ASIGNACION_AUTOMATICA' ? `✓ Asignados (${resultado.stats.asignados})`
                        : `✗ Sin asignación (${resultado.stats.sin_asignacion})`}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[480px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Username</TableHead>
                      <TableHead className="text-xs">Nombre</TableHead>
                      <TableHead className="text-xs">Plan</TableHead>
                      <TableHead className="text-xs">Curso origen</TableHead>
                      <TableHead className="text-xs">Curso destino</TableHead>
                      <TableHead className="text-xs">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResultados.slice(0, 300).map((r, i) => (
                      <TableRow
                        key={i}
                        className={r.tipo === 'SIN_ASIGNACION' ? 'bg-red-50/40 dark:bg-red-950/10' : ''}
                      >
                        <TableCell className="font-mono text-xs py-2">{r.username}</TableCell>
                        <TableCell className="text-xs py-2">{r.nombre}</TableCell>
                        <TableCell className="py-2">
                          {r.plan
                            ? <span className="inline-flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${DIA_DOT[r.dia_origen] ?? 'bg-gray-400'}`} />
                                <span className="text-xs">{r.plan}</span>
                              </span>
                            : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell className="text-xs py-2 max-w-[180px]">
                          <span className="block truncate" title={r.curso_origen}>{r.curso_origen}</span>
                        </TableCell>
                        <TableCell className="text-xs py-2 max-w-[180px]">
                          {r.curso_destino
                            ? <span className="block truncate text-green-700 dark:text-green-400 font-medium" title={r.curso_destino}>
                                {r.curso_destino}
                              </span>
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="py-2">
                          {r.tipo === 'ASIGNACION_AUTOMATICA'
                            ? <Badge className={`text-xs ${r.cambio_dia ? 'bg-blue-500' : 'bg-green-600'}`}>
                                {r.cambio_dia ? '↔ Cambio día' : '✓ OK'}
                              </Badge>
                            : <Badge variant="destructive" className="text-xs max-w-[120px] block truncate" title={r.estado}>
                                {r.estado}
                              </Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredResultados.length > 300 && (
                  <div className="text-center py-3 text-sm text-muted-foreground border-t">
                    Mostrando 300 de {filteredResultados.length} registros.
                    Descarga el CSV para el listado completo.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ── Sub-componente: tarjeta de estadística ────────────────────────────────────

function StatCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  accent: 'blue' | 'green' | 'violet' | 'amber' | 'red'
}) {
  const accentMap: Record<string, string> = {
    blue:   'border-blue-100   dark:border-blue-900   bg-blue-50/60   dark:bg-blue-950/30',
    green:  'border-green-100  dark:border-green-900  bg-green-50/60  dark:bg-green-950/30',
    violet: 'border-violet-100 dark:border-violet-900 bg-violet-50/60 dark:bg-violet-950/30',
    amber:  'border-amber-100  dark:border-amber-900  bg-amber-50/60  dark:bg-amber-950/30',
    red:    'border-red-100    dark:border-red-900    bg-red-50/60    dark:bg-red-950/30',
  }
  return (
    <Card className={`border ${accentMap[accent]}`}>
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-tight">{label}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
          </div>
          <div className="shrink-0 ml-2">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
