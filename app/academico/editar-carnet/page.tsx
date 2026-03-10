"use client"

import { useState, useCallback, useEffect } from "react"
import axios from "axios"
import { API_BASE_URL } from "@/utils/apiConfig"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  id: number
  nombre: string
  email: string
  username: string
  carnet: string
}

interface Paginacion {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function authHeaders() {
  const token = localStorage.getItem("access_token")
  return { Authorization: `Bearer ${token}` }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditarCarnetPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [paginacion, setPaginacion] = useState<Paginacion>({ current_page: 1, per_page: 50, total: 0, last_page: 1 })
  const [busqueda, setBusqueda] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal de edición
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [nuevoCarnet, setNuevoCarnet] = useState("")
  const [motivo, setMotivo] = useState("")
  const [intercambiarCon, setIntercambiarCon] = useState("")
  const [verificando, setVerificando] = useState(false)
  const [disponible, setDisponible] = useState<null | { disponible: boolean; tomado_por?: { id: number; nombre: string; carnet_actual: string } }>(null)
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState<string | null>(null)

  const fetchUsuarios = useCallback(async (pagina = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE_URL}/api/academico/usuarios`, {
        headers: authHeaders(),
        params: { busqueda: busqueda.trim() || undefined, per_page: 50, page: pagina },
      })
      setUsuarios(res.data.data ?? [])
      setPaginacion(res.data.pagination ?? { current_page: 1, per_page: 50, total: 0, last_page: 1 })
    } catch {
      setError("Error al cargar los usuarios. Verifica la conexión.")
    } finally {
      setLoading(false)
    }
  }, [busqueda])

  useEffect(() => { fetchUsuarios(1) }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const abrirEdicion = (usuario: Usuario) => {
    setEditando(usuario)
    setNuevoCarnet(usuario.carnet === "—" ? "" : usuario.carnet)
    setMotivo("")
    setIntercambiarCon("")
    setDisponible(null)
    setExito(null)
  }

  const cerrarEdicion = () => {
    setEditando(null)
    setNuevoCarnet("")
    setMotivo("")
    setIntercambiarCon("")
    setDisponible(null)
    setExito(null)
  }

  const verificarCarnet = useCallback(async () => {
    if (!nuevoCarnet.trim() || !editando) return
    setVerificando(true)
    setDisponible(null)
    try {
      const res = await axios.get(`${API_BASE_URL}/api/academico/carnets/verificar`, {
        headers: authHeaders(),
        params: { carnet: nuevoCarnet.trim(), usuario_id: editando.id },
      })
      setDisponible(res.data)
    } catch {
      setDisponible(null)
    } finally {
      setVerificando(false)
    }
  }, [nuevoCarnet, editando])

  // Verificar automáticamente cuando cambia el carnet (debounced)
  useEffect(() => {
    if (!nuevoCarnet.trim() || !editando) { setDisponible(null); return }
    const t = setTimeout(verificarCarnet, 600)
    return () => clearTimeout(t)
  }, [nuevoCarnet, editando, verificarCarnet])

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

      await axios.patch(
        `${API_BASE_URL}/api/academico/usuarios/${editando.id}/carnet`,
        payload,
        { headers: authHeaders() },
      )
      setExito(`Carnet actualizado correctamente a "${nuevoCarnet.trim()}".`)
      fetchUsuarios(paginacion.current_page)
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError(e.response?.data?.message ?? "Error al actualizar el carnet.")
      }
    } finally {
      setGuardando(false)
    }
  }

  const totalPages = paginacion.last_page

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

      {/* Buscador */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nombre, carnet o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchUsuarios(1)}
          className="max-w-md"
        />
        <Button onClick={() => fetchUsuarios(1)} disabled={loading}>
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Buscar
        </Button>
        <Button variant="outline" onClick={() => fetchUsuarios(paginacion.current_page)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Error global */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabla */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium text-gray-500">
            {loading ? "Cargando..." : `${paginacion.total.toLocaleString()} usuarios con carnet`}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="flex justify-center py-12 text-gray-400">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : usuarios.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">No se encontraron resultados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Carnet actual</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nombre}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{u.email}</TableCell>
                    <TableCell className="font-mono text-sm">{u.username}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{u.carnet}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => abrirEdicion(u)}>
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

      {/* Paginación */}
      {!loading && paginacion.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Página {paginacion.current_page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={paginacion.current_page <= 1} onClick={() => fetchUsuarios(paginacion.current_page - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={paginacion.current_page >= totalPages} onClick={() => fetchUsuarios(paginacion.current_page + 1)}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      <Dialog open={!!editando} onOpenChange={(open) => !open && cerrarEdicion()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar carnet</DialogTitle>
            <DialogDescription>
              Estudiante: <strong>{editando?.nombre}</strong>
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
              {/* Nuevo carnet */}
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

                {/* Estado de disponibilidad */}
                {disponible !== null && nuevoCarnet.trim() && (
                  disponible.disponible ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Carnet disponible
                    </p>
                  ) : (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      <p className="font-medium">Carnet en uso por: {disponible.tomado_por?.nombre}</p>
                      <p className="text-gray-500 mt-0.5">
                        Puedes escribir el ID de ese usuario en "Intercambiar con" para hacer un intercambio de carnets.
                      </p>
                    </div>
                  )
                )}
              </div>

              {/* Intercambiar con (opcional) */}
              <div className="space-y-1.5">
                <Label htmlFor="intercambiar_con">
                  Intercambiar con (ID de usuario) <span className="text-gray-400 font-normal">— opcional</span>
                </Label>
                <Input
                  id="intercambiar_con"
                  placeholder="ID del otro usuario (opcional)"
                  type="number"
                  value={intercambiarCon}
                  onChange={(e) => setIntercambiarCon(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  Si lo completas, el carnet actual de este estudiante pasará al usuario especificado.
                </p>
              </div>

              {/* Motivo */}
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
                disabled={
                  guardando ||
                  !nuevoCarnet.trim() ||
                  motivo.trim().length < 10 ||
                  nuevoCarnet.trim() === (editando?.carnet === "—" ? "" : editando?.carnet)
                }
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
