"use client"

import { useState, useCallback, useEffect } from "react"
import { api } from "@/services/api"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Pencil, RefreshCw, Search } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Usuario {
  tipo: "usuario"
  id: number
  nombre: string
  email: string
  username: string
  carnet: string
}

interface ProspectoConCarnet {
  tipo: "prospecto"
  id: number
  nombre: string
  email: string
  carnet: string
  status: string
}

type Registro = Usuario | ProspectoConCarnet

interface Paginacion {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

const PAGINACION_INICIAL: Paginacion = { current_page: 1, per_page: 50, total: 0, last_page: 1 }

function statusColor(status: string) {
  const s = status?.toLowerCase()
  if (s === "activo") return "bg-green-100 text-green-800 border-green-300"
  if (s === "inactivo") return "bg-gray-100 text-gray-600 border-gray-300"
  if (s === "interesado") return "bg-blue-100 text-blue-800 border-blue-300"
  if (s === "matriculado") return "bg-purple-100 text-purple-800 border-purple-300"
  return "bg-gray-100 text-gray-600 border-gray-200"
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface TablaProps {
  registros: Registro[]
  loading: boolean
  total: number
  tipo: "usuario" | "prospecto"
  paginacion: Paginacion
  onEditar: (r: Registro) => void
  onPaginar: (p: number) => void
  label: string
}

function TablaRegistros({ registros, loading, total, tipo, paginacion, onEditar, onPaginar, label }: TablaProps) {
  return (
    <>
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium text-gray-500">
            {loading ? "Cargando..." : `${total.toLocaleString()} ${label}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="flex justify-center py-12 text-gray-400">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : registros.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">No se encontraron resultados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  {tipo === "usuario" ? <TableHead>Username</TableHead> : <TableHead>Estado</TableHead>}
                  <TableHead>Carnet actual</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nombre}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{r.email}</TableCell>
                    {r.tipo === "usuario" ? (
                      <TableCell className="font-mono text-sm">{r.username}</TableCell>
                    ) : (
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusColor(r.status)}`}>
                          {r.status || "—"}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{r.carnet}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => onEditar(r)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && total > 0 && (
        <div className="flex items-center justify-between text-sm mt-3">
          <span className="text-gray-500">
            Página {paginacion.current_page} de {paginacion.last_page}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={paginacion.current_page <= 1}
              onClick={() => onPaginar(paginacion.current_page - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={paginacion.current_page >= paginacion.last_page}
              onClick={() => onPaginar(paginacion.current_page + 1)}>Siguiente</Button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EditarCarnetPage() {
  // ── Usuarios ──
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [pagUsuarios, setPagUsuarios] = useState<Paginacion>(PAGINACION_INICIAL)
  const [busquedaUsuarios, setBusquedaUsuarios] = useState("")
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)

  // ── Prospectos ──
  const [prospectos, setProspectos] = useState<ProspectoConCarnet[]>([])
  const [pagProspectos, setPagProspectos] = useState<Paginacion>(PAGINACION_INICIAL)
  const [busquedaProspectos, setBusquedaProspectos] = useState("")
  const [loadingProspectos, setLoadingProspectos] = useState(false)

  // ── Shared ──
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState<Registro | null>(null)
  const [nuevoCarnet, setNuevoCarnet] = useState("")
  const [motivo, setMotivo] = useState("")
  const [intercambiarCon, setIntercambiarCon] = useState("")
  const [verificando, setVerificando] = useState(false)
  const [disponible, setDisponible] = useState<null | { disponible: boolean; tomado_por?: { id: number; nombre: string; carnet_actual: string } }>(null)
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState<string | null>(null)

  // ── Fetch usuarios ──
  const fetchUsuarios = useCallback(async (pagina = 1) => {
    setLoadingUsuarios(true)
    try {
      const res = await api.get(`/academico/usuarios`, {
        params: { busqueda: busquedaUsuarios.trim() || undefined, per_page: 50, page: pagina },
      })
      setUsuarios((res.data.data ?? []).map((u: Omit<Usuario, "tipo">) => ({ ...u, tipo: "usuario" as const })))
      setPagUsuarios(res.data.pagination ?? PAGINACION_INICIAL)
    } catch {
      setError("Error al cargar los usuarios del sistema.")
    } finally {
      setLoadingUsuarios(false)
    }
  }, [busquedaUsuarios])

  // ── Fetch prospectos ──
  const fetchProspectos = useCallback(async (pagina = 1) => {
    setLoadingProspectos(true)
    try {
      const res = await api.get(`/academico/prospectos-con-carnet`, {
        params: { busqueda: busquedaProspectos.trim() || undefined, per_page: 50, page: pagina },
      })
      setProspectos((res.data.data ?? []).map((p: Omit<ProspectoConCarnet, "tipo">) => ({ ...p, tipo: "prospecto" as const })))
      setPagProspectos(res.data.pagination ?? PAGINACION_INICIAL)
    } catch {
      setError("Error al cargar los prospectos.")
    } finally {
      setLoadingProspectos(false)
    }
  }, [busquedaProspectos])

  useEffect(() => { fetchUsuarios(1) }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchProspectos(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Modal ──
  const abrirEdicion = (r: Registro) => {
    setEditando(r)
    setNuevoCarnet(r.carnet === "—" ? "" : r.carnet)
    setMotivo("")
    setIntercambiarCon("")
    setDisponible(null)
    setExito(null)
    setError(null)
  }

  const cerrarEdicion = () => {
    setEditando(null)
    setNuevoCarnet("")
    setMotivo("")
    setIntercambiarCon("")
    setDisponible(null)
    setExito(null)
    setError(null)
  }

  const verificarCarnetActual = useCallback(async () => {
    if (!nuevoCarnet.trim() || !editando) return
    setVerificando(true)
    setDisponible(null)
    try {
      const endpoint = editando.tipo === "usuario"
        ? `/academico/carnets/verificar`
        : `/academico/carnets/verificar-prospecto`
      const paramId = editando.tipo === "usuario"
        ? { usuario_id: editando.id }
        : { prospecto_id: editando.id }
      const res = await api.get(endpoint, { params: { carnet: nuevoCarnet.trim(), ...paramId } })
      setDisponible(res.data)
    } catch {
      setDisponible(null)
    } finally {
      setVerificando(false)
    }
  }, [nuevoCarnet, editando])

  useEffect(() => {
    if (!nuevoCarnet.trim() || !editando) { setDisponible(null); return }
    const t = setTimeout(verificarCarnetActual, 600)
    return () => clearTimeout(t)
  }, [nuevoCarnet, editando, verificarCarnetActual])

  const guardar = async () => {
    if (!editando) return
    setGuardando(true)
    setError(null)
    try {
      const payload: Record<string, string | number> = {
        nuevo_carnet: nuevoCarnet.trim(),
        motivo: motivo.trim(),
      }
      if (intercambiarCon.trim()) payload.intercambiar_con = Number(intercambiarCon.trim())

      const endpoint = editando.tipo === "usuario"
        ? `/academico/usuarios/${editando.id}/carnet`
        : `/academico/prospectos/${editando.id}/carnet`

      await api.patch(endpoint, payload)
      setExito(`Carnet actualizado correctamente a "${nuevoCarnet.trim()}".`)

      if (editando.tipo === "usuario") fetchUsuarios(pagUsuarios.current_page)
      else fetchProspectos(pagProspectos.current_page)
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError(e.response?.data?.message ?? "Error al actualizar el carnet.")
      }
    } finally {
      setGuardando(false)
    }
  }

  const carnetSinCambio = nuevoCarnet.trim() === (editando?.carnet === "—" ? "" : editando?.carnet ?? "")

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Pencil className="h-6 w-6 text-gray-600" />
          Editar Carnet de Estudiantes
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Busca un estudiante por nombre, carnet o correo y modifica su carnet directamente.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">
            Usuarios del sistema
            {!loadingUsuarios && pagUsuarios.total > 0 && (
              <span className="ml-2 text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">{pagUsuarios.total}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="prospectos">
            Prospectos con carnet
            {!loadingProspectos && pagProspectos.total > 0 && (
              <span className="ml-2 text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">{pagProspectos.total}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Usuarios ── */}
        <TabsContent value="usuarios" className="space-y-3 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nombre, carnet o correo..."
              value={busquedaUsuarios}
              onChange={(e) => setBusquedaUsuarios(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsuarios(1)}
              className="max-w-md"
            />
            <Button onClick={() => fetchUsuarios(1)} disabled={loadingUsuarios}>
              {loadingUsuarios ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </Button>
            <Button variant="outline" onClick={() => fetchUsuarios(pagUsuarios.current_page)} disabled={loadingUsuarios}>
              <RefreshCw className={`h-4 w-4 ${loadingUsuarios ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <TablaRegistros
            registros={usuarios}
            loading={loadingUsuarios}
            total={pagUsuarios.total}
            tipo="usuario"
            paginacion={pagUsuarios}
            onEditar={abrirEdicion}
            onPaginar={fetchUsuarios}
            label="usuarios con carnet"
          />
        </TabsContent>

        {/* ── Tab: Prospectos ── */}
        <TabsContent value="prospectos" className="space-y-3 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nombre, carnet o correo..."
              value={busquedaProspectos}
              onChange={(e) => setBusquedaProspectos(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProspectos(1)}
              className="max-w-md"
            />
            <Button onClick={() => fetchProspectos(1)} disabled={loadingProspectos}>
              {loadingProspectos ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </Button>
            <Button variant="outline" onClick={() => fetchProspectos(pagProspectos.current_page)} disabled={loadingProspectos}>
              <RefreshCw className={`h-4 w-4 ${loadingProspectos ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <TablaRegistros
            registros={prospectos}
            loading={loadingProspectos}
            total={pagProspectos.total}
            tipo="prospecto"
            paginacion={pagProspectos}
            onEditar={abrirEdicion}
            onPaginar={fetchProspectos}
            label="prospectos con carnet"
          />
        </TabsContent>
      </Tabs>

      {/* ── Modal de edición ── */}
      <Dialog open={!!editando} onOpenChange={(open) => !open && cerrarEdicion()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar carnet</DialogTitle>
            <DialogDescription>
              {editando?.tipo === "usuario" ? "Usuario" : "Prospecto"}: <strong>{editando?.nombre}</strong>
              <br />
              Carnet actual: <code className="bg-gray-100 px-1 rounded">{editando?.carnet}</code>
            </DialogDescription>
          </DialogHeader>

          {exito ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-green-700 font-medium">{exito}</p>
              <Button onClick={cerrarEdicion}>Cerrar</Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="nuevo_carnet">Nuevo carnet</Label>
                <div className="flex gap-2">
                  <Input
                    id="nuevo_carnet"
                    placeholder="Ej: 2025-001"
                    value={nuevoCarnet}
                    onChange={(e) => setNuevoCarnet(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                  {verificando && <RefreshCw className="h-4 w-4 animate-spin self-center text-gray-400 shrink-0" />}
                </div>

                {disponible !== null && nuevoCarnet.trim() && (
                  disponible.disponible ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Carnet disponible
                    </p>
                  ) : (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      <p className="font-medium">Carnet en uso por: {disponible.tomado_por?.nombre}</p>
                      <p className="text-gray-500 mt-0.5">
                        Puedes escribir el ID en "Intercambiar con" para hacer un intercambio de carnets.
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="intercambiar_con">
                  Intercambiar con (ID) <span className="text-gray-400 font-normal">— opcional</span>
                </Label>
                <Input
                  id="intercambiar_con"
                  placeholder="ID del otro registro (opcional)"
                  type="number"
                  value={intercambiarCon}
                  onChange={(e) => setIntercambiarCon(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  El carnet actual pasará al registro con ese ID.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="motivo">Motivo del cambio <span className="text-red-500">*</span></Label>
                <Input
                  id="motivo"
                  placeholder="Mínimo 10 caracteres..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
                {motivo.trim().length > 0 && motivo.trim().length < 10 && (
                  <p className="text-xs text-red-500">Mínimo 10 caracteres ({motivo.trim().length}/10)</p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {!exito && (
            <DialogFooter>
              <Button variant="outline" onClick={cerrarEdicion} disabled={guardando}>Cancelar</Button>
              <Button
                onClick={guardar}
                disabled={guardando || !nuevoCarnet.trim() || motivo.trim().length < 10 || carnetSinCambio}
              >
                {guardando ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : null}
                Guardar cambio
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
