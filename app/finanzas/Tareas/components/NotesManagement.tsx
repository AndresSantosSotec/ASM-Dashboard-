"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import {
  Upload, Download, AlertCircle, Plus, Search, Edit, Trash2,
  ChevronDown, ChevronRight, User, Mail, FileText, Loader2,
} from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/utils/apiConfig"

const API_NOTAS = `${API_BASE_URL}/api/notas-pago`

// ── Tipos ────────────────────────────────────────────────────────────────────

interface NotaPago {
  id: number
  nomenclatura: string | null
  nota: string
  fecha: string
  fecha_formateada: string
}

interface EstudianteConNotas {
  carnet: string
  id: number | null
  nombre_completo: string
  correo_electronico: string | null
  programa: { nombre: string; abreviatura: string } | null
  total_notas: number
  ultima_nota_fecha: string | null
  ultima_nota_preview: string | null
  ultima_nota_nomenclatura: string | null
}

interface EstudianteBusqueda {
  id: number
  carnet: string
  nombre_completo: string
  correo_electronico: string
  programa: string
}

// ── Helper fetch autenticado ──────────────────────────────────────────────────

const apiFetch = async (input: RequestInfo, init?: RequestInit) => {
  const token = localStorage.getItem("token")
  const res = await fetch(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers as any),
    },
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`HTTP ${res.status}: ${txt}`)
  }
  return res
}

const NOMENCLATURAS = [
  "Recordatorio", "Cobro especial", "Pago fraccionado",
  "Excepción", "Observación", "Seguimiento", "Urgente", "Otro",
]

// ── Componente principal ──────────────────────────────────────────────────────

const NotesManagement = () => {
  // ── Lista de estudiantes con notas ──────────────────────────────────────
  const [estudiantes, setEstudiantes] = useState<EstudianteConNotas[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [notasPorCarnet, setNotasPorCarnet] = useState<Record<string, NotaPago[]>>({})
  const [loadingNotas, setLoadingNotas] = useState<Set<string>>(new Set())

  // ── Modal crear/editar nota ──────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNota, setEditingNota] = useState<NotaPago | null>(null)
  const [selectedCarnet, setSelectedCarnet] = useState<string | null>(null)
  const [notaText, setNotaText] = useState("")
  const [nomenclatura, setNomenclatura] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedEstudiante, setSelectedEstudiante] = useState<EstudianteBusqueda | null>(null)
  const [searchModal, setSearchModal] = useState("")
  const [searchResults, setSearchResults] = useState<EstudianteBusqueda[]>([])
  const [searching, setSearching] = useState(false)

  // ── Confirmar eliminación ────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [notaToDelete, setNotaToDelete] = useState<{ nota: NotaPago; carnet: string } | null>(null)

  // ── Importación masiva ───────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [skipErrors, setSkipErrors] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  // ── Carga inicial ────────────────────────────────────────────────────────

  const loadEstudiantes = async () => {
    setLoadingList(true)
    try {
      const r = await apiFetch(`${API_NOTAS}?page=1&per_page=100`)
      const json = await r.json()
      if (json.success) setEstudiantes(json.data || [])
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo cargar la lista: " + err.message, variant: "destructive" })
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => { loadEstudiantes() }, [])

  // ── Cargar notas de un carnet (con cache) ────────────────────────────────

  const loadNotas = async (carnet: string) => {
    if (notasPorCarnet[carnet]) return
    await reloadNotas(carnet)
  }

  const reloadNotas = async (carnet: string) => {
    setLoadingNotas(prev => new Set(prev).add(carnet))
    try {
      const r = await apiFetch(`${API_NOTAS}/${carnet}`)
      const json = await r.json()
      if (json.success) {
        setNotasPorCarnet(prev => ({ ...prev, [carnet]: json.data.notas || [] }))
      }
    } catch {
      setNotasPorCarnet(prev => ({ ...prev, [carnet]: [] }))
    } finally {
      setLoadingNotas(prev => { const n = new Set(prev); n.delete(carnet); return n })
    }
  }

  const toggleExpand = async (carnet: string) => {
    const next = new Set(expandedRows)
    if (next.has(carnet)) { next.delete(carnet) } else { next.add(carnet); await loadNotas(carnet) }
    setExpandedRows(next)
  }

  // ── Búsqueda de estudiantes en modal ─────────────────────────────────────

  useEffect(() => {
    if (!modalOpen || searchModal.length < 2) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await apiFetch(`${API_NOTAS}/search?q=${encodeURIComponent(searchModal)}`)
        const json = await r.json()
        setSearchResults(json.success ? json.data : [])
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [searchModal, modalOpen])

  // ── Abrir modal ──────────────────────────────────────────────────────────

  const openCreate = (carnet?: string) => {
    setEditingNota(null); setSelectedCarnet(carnet || null)
    setNotaText(""); setNomenclatura(null)
    setSelectedEstudiante(null); setSearchModal(""); setSearchResults([])
    setModalOpen(true)
  }

  const openEdit = (nota: NotaPago, carnet: string) => {
    setEditingNota(nota); setSelectedCarnet(carnet)
    setNotaText(nota.nota); setNomenclatura(nota.nomenclatura || null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false); setSelectedCarnet(null)
    setSelectedEstudiante(null); setSearchModal(""); setSearchResults([])
  }

  // ── Guardar nota ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!notaText.trim()) {
      toast({ title: "Error", description: "La nota no puede estar vacía", variant: "destructive" }); return
    }
    const carnetFinal = editingNota ? selectedCarnet : (selectedCarnet || selectedEstudiante?.carnet || null)
    if (!carnetFinal) {
      toast({ title: "Error", description: "Selecciona un estudiante", variant: "destructive" }); return
    }
    setSaving(true)
    try {
      if (editingNota) {
        const r = await apiFetch(`${API_NOTAS}/${editingNota.id}`, {
          method: "PUT",
          body: JSON.stringify({ nota: notaText.trim(), nomenclatura: nomenclatura || null }),
        })
        const json = await r.json()
        if (!json.success) throw new Error(json.message)
        toast({ title: "Nota actualizada" })
        closeModal()
        await reloadNotas(carnetFinal)
      } else {
        const r = await apiFetch(API_NOTAS, {
          method: "POST",
          body: JSON.stringify({ carnet: carnetFinal, nota: notaText.trim(), nomenclatura: nomenclatura || null }),
        })
        const json = await r.json()
        if (!json.success) throw new Error(json.message)
        toast({ title: "Nota creada" })
        closeModal()
        if (expandedRows.has(carnetFinal)) await reloadNotas(carnetFinal)
      }
      await loadEstudiantes()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar nota ────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!notaToDelete) return
    try {
      const r = await apiFetch(`${API_NOTAS}/${notaToDelete.nota.id}`, { method: "DELETE" })
      const json = await r.json()
      if (!json.success) throw new Error(json.message)
      toast({ title: "Nota eliminada" })
      await reloadNotas(notaToDelete.carnet)
      await loadEstudiantes()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setDeleteOpen(false); setNotaToDelete(null)
    }
  }

  // ── Importar masivo ──────────────────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token")
      const r = await fetch(`${API_NOTAS}/template`, { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const blob = await r.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = "plantilla_notas_pago.xlsx"
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url)
      toast({ title: "Plantilla descargada" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleImport = async () => {
    if (!importFile) return
    setImporting(true); setImportResult(null)
    try {
      const token = localStorage.getItem("token")
      const fd = new FormData()
      fd.append("file", importFile)
      fd.append("skip_errors", skipErrors ? "1" : "0")
      const r = await fetch(`${API_NOTAS}/import`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd })
      const json = await r.json()
      setImportResult(json)
      if (json.success) {
        toast({ title: "Importación completada", description: json.message })
        setImportFile(null)
        setNotasPorCarnet({})
        await loadEstudiantes()
      } else {
        toast({ title: "Importación con errores", description: json.message, variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setImporting(false)
    }
  }

  // ── Filtrado local ───────────────────────────────────────────────────────

  const filtrados = useMemo(() => {
    if (!searchQuery.trim()) return estudiantes
    const q = searchQuery.toLowerCase()
    return estudiantes.filter(e =>
      e.carnet.toLowerCase().includes(q) ||
      e.nombre_completo.toLowerCase().includes(q) ||
      (e.correo_electronico || "").toLowerCase().includes(q) ||
      (e.programa?.abreviatura || "").toLowerCase().includes(q)
    )
  }, [estudiantes, searchQuery])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Barra de herramientas ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por carnet, nombre, programa…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setImportOpen(true); setImportFile(null); setImportResult(null) }}>
            <Upload className="h-4 w-4 mr-2" />
            Importar masivo
          </Button>
          <Button size="sm" onClick={() => openCreate()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva nota
          </Button>
        </div>
      </div>

      {/* ── Tabla de estudiantes ── */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loadingList ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-16 w-16 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">
                {searchQuery ? "Sin resultados para la búsqueda" : "No hay notas registradas aún"}
              </p>
              {!searchQuery && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => openCreate()}>
                  <Plus className="h-4 w-4 mr-2" /> Crear primera nota
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Estudiante</TableHead>
                  <TableHead className="hidden md:table-cell">Programa</TableHead>
                  <TableHead className="w-24 text-center">Notas</TableHead>
                  <TableHead className="hidden lg:table-cell">Última nota</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map(est => {
                  const expanded = expandedRows.has(est.carnet)
                  const notas = notasPorCarnet[est.carnet] || []
                  const isLoading = loadingNotas.has(est.carnet)

                  return (
                    <React.Fragment key={est.carnet}>
                      {/* Fila del estudiante */}
                      <TableRow className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(est.carnet)}>
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-sm">{est.nombre_completo}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{est.carnet}</span>
                            {est.correo_electronico && (
                              <span className="hidden sm:flex items-center gap-1 truncate max-w-[180px]">
                                <Mail className="h-3 w-3" />{est.correo_electronico}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {est.programa
                            ? <Badge variant="outline" className="font-medium">{est.programa.abreviatura}</Badge>
                            : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-bold">{est.total_notas}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[220px]">
                          {est.ultima_nota_fecha ? (
                            <div className="space-y-0.5">
                              <p className="text-gray-600 dark:text-gray-400">
                                {new Date(est.ultima_nota_fecha).toLocaleDateString('es-GT')}
                                {est.ultima_nota_nomenclatura && (
                                  <Badge variant="outline" className="ml-2 text-[10px]">{est.ultima_nota_nomenclatura}</Badge>
                                )}
                              </p>
                              <p className="truncate">{est.ultima_nota_preview}</p>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openCreate(est.carnet)}>
                            <Plus className="h-3 w-3 mr-1" />Agregar
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Fila expandida con detalle de notas */}
                      {expanded && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-blue-50/40 dark:bg-blue-950/20 py-3 px-6">
                            {isLoading ? (
                              <div className="flex items-center gap-2 py-4 text-muted-foreground">
                                <Loader2 className="animate-spin h-4 w-4" /><span className="text-sm">Cargando notas…</span>
                              </div>
                            ) : notas.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-3">No hay notas para este estudiante.</p>
                            ) : (
                              <div className="space-y-2 py-1">
                                {notas.map(nota => (
                                  <div key={nota.id} className="flex items-start justify-between gap-4 bg-white dark:bg-gray-800 rounded-lg border p-3 shadow-sm">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-xs text-muted-foreground">{nota.fecha_formateada}</span>
                                        {nota.nomenclatura && (
                                          <Badge variant="outline" className="text-xs">{nota.nomenclatura}</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {nota.nota}
                                      </p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-blue-100 dark:hover:bg-blue-900/30" onClick={() => openEdit(nota, est.carnet)}>
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => { setNotaToDelete({ nota, carnet: est.carnet }); setDeleteOpen(true) }}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Modal crear/editar nota ── */}
      <Dialog open={modalOpen} onOpenChange={open => { if (!open) closeModal(); else setModalOpen(true) }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingNota ? "Editar nota de pago" : "Nueva nota de pago"}</DialogTitle>
            <DialogDescription>
              {editingNota
                ? `Editando nota · Carnet: ${selectedCarnet}`
                : selectedCarnet
                  ? `Agregando nota para: ${selectedCarnet}`
                  : "Busca un estudiante y escribe la nota"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Buscador de estudiante (solo al crear sin carnet pre-seleccionado) */}
            {!editingNota && !selectedCarnet && (
              <div className="space-y-1.5">
                <Label>Estudiante *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por carnet, nombre o correo…"
                    value={searchModal}
                    onChange={e => setSearchModal(e.target.value)}
                    className="pl-9"
                  />
                  {(searchResults.length > 0 || searching) && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {searching
                        ? <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Buscando…</div>
                        : searchResults.map(e => (
                          <div
                            key={e.id}
                            className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-0 ${selectedEstudiante?.id === e.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                            onClick={() => { setSelectedEstudiante(e); setSearchModal(e.nombre_completo); setSearchResults([]) }}
                          >
                            <p className="font-medium text-sm">{e.nombre_completo}</p>
                            <p className="text-xs text-muted-foreground">{e.carnet} · {e.correo_electronico}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                {selectedEstudiante && (
                  <p className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded px-2 py-1">
                    ✓ {selectedEstudiante.nombre_completo} ({selectedEstudiante.carnet})
                  </p>
                )}
              </div>
            )}

            {/* Nomenclatura */}
            <div className="space-y-1.5">
              <Label>Nomenclatura (opcional)</Label>
              <Select value={nomenclatura || "__none__"} onValueChange={v => setNomenclatura(v === "__none__" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Sin nomenclatura" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin nomenclatura</SelectItem>
                  {NOMENCLATURAS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Texto de la nota */}
            <div className="space-y-1.5">
              <Label>Nota *</Label>
              <Textarea
                placeholder="Escribe la nota de pago aquí…"
                value={notaText}
                onChange={e => setNotaText(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{notaText.length}/5000</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !notaText.trim() || (!editingNota && !selectedCarnet && !selectedEstudiante)}
            >
              {saving ? "Guardando…" : editingNota ? "Actualizar" : "Crear nota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog confirmación eliminar ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar nota?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Modal importación masiva ── */}
      <Dialog open={importOpen} onOpenChange={open => { if (!open) { setImportOpen(false); setImportResult(null); setImportFile(null) } else setImportOpen(true) }}>
        <DialogContent className="sm:max-w-[820px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Importar Notas Masivamente
            </DialogTitle>
            <DialogDescription>
              Sube un archivo Excel o CSV con columnas: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">carnet</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">nota</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">nomenclatura</code> (opcional).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Descargar plantilla */}
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-3">
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Plantilla de Ejemplo</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Formato correcto con columnas predefinidas y ejemplos.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="border-blue-200 text-blue-700 hover:bg-blue-100">
                <Download className="h-4 w-4 mr-2" />Descargar Plantilla
              </Button>
            </div>

            {!importResult ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Archivo (.xlsx, .xls, .csv)</Label>
                  <Input type="file" accept=".csv,.xlsx,.xls" className="cursor-pointer" onChange={e => setImportFile(e.target.files?.[0] || null)} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="skip-err" checked={skipErrors} onCheckedChange={v => setSkipErrors(!!v)} />
                  <label htmlFor="skip-err" className="text-sm cursor-pointer select-none">Omitir errores y continuar con registros válidos</label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button>
                  <Button onClick={handleImport} disabled={importing || !importFile}>
                    {importing ? <><span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Procesando…</> : <><Upload className="h-4 w-4 mr-2" />Iniciar Importación</>}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Contadores */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Procesados", val: importResult.summary?.total_procesados ?? 0, cls: "bg-gray-50 dark:bg-gray-800 border" },
                    { label: "Éxito", val: importResult.summary?.exitosos ?? 0, cls: "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400" },
                    { label: "Errores", val: importResult.summary?.errores ?? 0, cls: "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400" },
                    { label: "Huérfanos", val: importResult.summary?.advertencias ?? 0, cls: "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400" },
                  ].map(c => (
                    <div key={c.label} className={`${c.cls} rounded-lg p-3 text-center`}>
                      <p className="text-xs uppercase font-medium opacity-80">{c.label}</p>
                      <p className="text-2xl font-bold mt-1">{c.val}</p>
                    </div>
                  ))}
                </div>

                {importResult.errors?.length > 0 && (
                  <div className="border border-red-200 dark:border-red-900 rounded-lg overflow-hidden">
                    <div className="bg-red-50 dark:bg-red-950/20 px-4 py-2 border-b border-red-200 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="font-semibold text-red-900 dark:text-red-200 text-sm">Errores de validación</span>
                    </div>
                    <div className="max-h-28 overflow-y-auto p-3 space-y-1 text-xs">
                      {importResult.errors.map((e: any, i: number) => (
                        <div key={i} className="text-red-800 dark:text-red-300">
                          <span className="font-bold">Fila {e.row}:</span> {e.carnet ? `[${e.carnet}] ` : ""}{e.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importResult.warnings?.length > 0 && (
                  <div className="border border-amber-200 dark:border-amber-900 rounded-lg overflow-hidden">
                    <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-2 border-b border-amber-200 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="font-semibold text-amber-900 dark:text-amber-200 text-sm">Sin estudiante vinculado</span>
                    </div>
                    <div className="max-h-28 overflow-y-auto p-3 space-y-1 text-xs">
                      {importResult.warnings.map((w: any, i: number) => (
                        <div key={i} className="text-amber-800 dark:text-amber-300">
                          <span className="font-bold">Fila {w.row}:</span> {w.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importResult.data?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detalle de registros</p>
                    <div className="border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-12">Fila</TableHead>
                            <TableHead className="w-28">Carnet</TableHead>
                            <TableHead>Estudiante</TableHead>
                            <TableHead className="w-24">Categoría</TableHead>
                            <TableHead>Nota</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResult.data.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{item.row}</TableCell>
                              <TableCell className="font-mono text-xs">{item.carnet_ingresado}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">{item.alumno}</span>
                                  <Badge variant="outline" className={`text-[10px] py-0 px-1 ${item.vinculado ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                    {item.vinculado ? "✓" : "?"}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.nomenclatura
                                  ? <Badge variant="secondary" className="text-[10px]">{item.nomenclatura}</Badge>
                                  : <span className="text-muted-foreground text-xs">—</span>}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{item.nota_preview}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t">
                  <Button variant="outline" onClick={() => { setImportResult(null); setImportFile(null) }}>Nueva importación</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default NotesManagement
