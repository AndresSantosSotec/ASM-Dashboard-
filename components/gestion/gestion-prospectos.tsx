"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Swal from "sweetalert2"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter, MoreHorizontal, Eye, Edit2, UserPlus, AlertCircle, RefreshCw, Download } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import DetallesProspecto from "./detalles-prospecto"
import EditarProspecto from "./editar-prospecto"
import EditarProspectoCompleto from "./editar-prospecto-completo"
import CambiarEstado from "./cambiar-estado"
import AlertaAlumnoNuevo from "./alerta-alumno-nuevo"
import { API_BASE_URL } from "@/utils/apiConfig"

const API_URL = `${API_BASE_URL}/api`

interface Prospecto {
  id: string
  nombre: string
  email: string
  telefono: string
  departamento: string
  puesto: string
  estado: string
  origen?: string
  observaciones?: string
  notasGenerales?: string
  ultimoCambio: string
  programa?: string
  ciudad?: string
  pais?: string
  fechaCaptura?: string
  asesor?: string
}

export default function GestionProspectos() {
  const [mounted, setMounted] = useState(false);
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [programas, setProgramas] = useState<Record<string, string>>({});
  const [programasLoaded, setProgramasLoaded] = useState(false);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null)
  const [modalType, setModalType] = useState<"detalles" | "editar" | "alerta" | null>(null)
  const [showEstadoMenu, setShowEstadoMenu] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [descargandoReporte, setDescargandoReporte] = useState<string | null>(null)

  // Descargar reporte consolidado PDF de un prospecto
  const handleDescargarReporte = async (prospectoId: string) => {
    setDescargandoReporte(prospectoId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/prospectos/${prospectoId}/reporte-consolidado-pdf`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reporte-consolidado-prospecto-${prospectoId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      Swal.fire({
        icon: "success",
        title: "Descarga exitosa",
        text: "El reporte consolidado se descargó correctamente",
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (err) {
      console.error("Error al descargar reporte:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo descargar el reporte consolidado",
      })
    } finally {
      setDescargandoReporte(null)
    }
  }

  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")
  const [estadoFilter, setEstadoFilter] = useState<string>("todos")
  const [departamentoFilter, setDepartamentoFilter] = useState<string>("todos")
  const [puestoFilter, setPuestoFilter] = useState<string>("todos")
  const [origenFilter, setOrigenFilter] = useState<string>("todos")
  const [pageSize, setPageSize] = useState<string>("50")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalProspectos, setTotalProspectos] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)

  // ⚡ Debouncing para búsqueda
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset a primera página al buscar
    }, 500) // 500ms de delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  const [currentUser, setCurrentUser] = useState<any>(null)

  // Datos únicos para filtros dinámicos
  const departamentos = useMemo(
    () =>
      Array.from(
        new Set(
          prospectos
            .map((p) => p.departamento)
            .filter((d) => d && d.trim() !== "")
        )
      ),
    [prospectos]
  )
  const puestos = useMemo(
    () =>
      Array.from(
        new Set(
          prospectos
            .map((p) => p.puesto)
            .filter((p) => p && p.trim() !== "")
        )
      ),
    [prospectos]
  )
  const origenes = useMemo(
    () =>
      Array.from(
        new Set(
          prospectos
            .map((p) => p.origen)
            .filter((o) => o && o.trim() !== "")
        )
      ),
    [prospectos]
  )

  // ⚙️ Control de montaje para evitar hidratación
  useEffect(() => {
    setMounted(true);

    // Cargar estados dinámicos
    const fetchStatuses = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_URL}/prospectos/statuses`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        })
        if (res.ok) {
          const data = await res.json()
          setStatuses(data)
        }
      } catch (err) {
        console.error("Error cargando estados:", err)
      }
    }
    fetchStatuses()
  }, []);

  // 📚 Cargar programas académicos
  useEffect(() => {
    const fetchProgramas = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/programas`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          const programasMap: Record<string, string> = {};
          data.forEach((prog: any) => {
            programasMap[prog.id] = prog.nombre_del_programa || prog.nombre;
          });
          setProgramas(programasMap);
          setProgramasLoaded(true);
          console.log("✅ Programas académicos cargados:", Object.keys(programasMap).length);
        }
      } catch (err) {
        console.error("❌ Error cargando programas:", err);
        setProgramasLoaded(true); // Marcar como loaded incluso con error
      }
    };
    fetchProgramas();
  }, []);

  // ⚡ Carga optimizada con paginación del servidor
  const fetchProspectos = useCallback(async (page: number = 1, resetCache: boolean = false) => {
    // No cargar hasta que los programas estén listos
    if (!programasLoaded) return;

    // Verificar caché solo si no hay filtros activos y no es refresh
    if (!resetCache && !debouncedSearchTerm && estadoFilter === "todos" &&
      departamentoFilter === "todos" && puestoFilter === "todos" && origenFilter === "todos" && page === 1) {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("gestion_prospectos_cache");
        const cacheTime = localStorage.getItem("gestion_prospectos_cache_time");
        if (cached && cacheTime) {
          const now = Date.now();
          const elapsed = now - parseInt(cacheTime);
          if (elapsed < 60000) { // 1 minuto (reducido de 5 minutos para mejor sincronización)
            console.log("✅ Usando caché de gestión prospectos");
            const cachedData = JSON.parse(cached);
            setProspectos(cachedData.items || cachedData);
            if (cachedData.pagination) {
              setTotalProspectos(cachedData.pagination.total);
              setTotalPages(cachedData.pagination.last_page);
            }
            setLoading(false);
            return;
          }
        }
      }
    }

    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")

      // ⚡ Construir query params optimizados
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: pageSize === "all" ? "200" : pageSize,
      })

      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm)
      if (estadoFilter !== "todos") params.append("status", estadoFilter)
      if (departamentoFilter !== "todos") params.append("departamento", departamentoFilter)
      if (puestoFilter !== "todos") params.append("puesto", puestoFilter)
      if (origenFilter !== "todos") params.append("origen", origenFilter)

      const res = await fetch(`${API_URL}/prospectos?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `Error al obtener prospectos: ${res.status}`)
      }

      const json = await res.json()

      // ⚡ Mapear datos de forma optimizada
      const list: Prospecto[] = (json.data || []).map((item: any) => {
        let programaNombre = "—";
        if (item.interes && programas[item.interes]) {
          programaNombre = programas[item.interes];
        } else if (item.interes) {
          programaNombre = `Programa ${item.interes}`;
        }

        return {
          id: String(item.id),
          nombre: item.nombre_completo || "",
          email: item.correo_electronico || "",
          telefono: item.telefono || "",
          departamento: item.empresa_donde_labora_actualmente ?? "Sin Departamento",
          puesto: item.puesto ?? "N/A",
          estado: item.status || "No contactado",
          origen: item.medio_conocimiento_institucion ?? "—",
          observaciones: item.observaciones ?? "",
          notasGenerales: item.notas_generales ?? "",
          ultimoCambio: item.updated_at ?? "N/A",
          programa: programaNombre,
          ciudad: item.municipio_nombre || item.municipio || "—",
          pais: item.pais_nombre || item.pais || "—",
          fechaCaptura: item.created_at ?? "—",
          asesor: item.creator ? `${item.creator.first_name || ""} ${item.creator.last_name || ""}`.trim() : "Sin asignar",
        };
      })

      setProspectos(list)

      // ⚡ Actualizar paginación
      if (json.pagination) {
        setTotalProspectos(json.pagination.total)
        setTotalPages(json.pagination.last_page)
      }

      // 💾 Guardar en caché solo si es primera página sin filtros
      if (page === 1 && !debouncedSearchTerm && estadoFilter === "todos" &&
        departamentoFilter === "todos" && puestoFilter === "todos" && origenFilter === "todos") {
        if (typeof window !== "undefined") {
          localStorage.setItem("gestion_prospectos_cache", JSON.stringify({
            items: list,
            pagination: json.pagination
          }));
          localStorage.setItem("gestion_prospectos_cache_time", Date.now().toString());
        }
      }
    } catch (err: any) {
      setError(err.message || "Error inesperado")
    } finally {
      setLoading(false)
    }
  }, [programasLoaded, debouncedSearchTerm, estadoFilter, departamentoFilter, puestoFilter, origenFilter, pageSize])

  // ⚡ Cargar prospectos cuando cambian los filtros
  useEffect(() => {
    fetchProspectos(currentPage, false)
  }, [fetchProspectos, currentPage])

  // Usuario actual
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user")
      if (storedUser) setCurrentUser(JSON.parse(storedUser))
    }
  }, [])

  // 🔄 Invalidar caché cuando se crea/actualiza un prospecto desde otro componente
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleProspectoChange = () => {
      console.log("🔄 Invalidando caché por cambio de prospecto")
      localStorage.removeItem("gestion_prospectos_cache")
      localStorage.removeItem("gestion_prospectos_cache_time")
      fetchProspectos(currentPage, true)
    }

    // Escuchar eventos personalizados para invalidar caché
    window.addEventListener("prospecto:created", handleProspectoChange)
    window.addEventListener("prospecto:updated", handleProspectoChange)
    window.addEventListener("prospecto:deleted", handleProspectoChange)

    // Invalidar caché cuando la página vuelve a estar visible (usuario regresa a la pestaña)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Verificar si el caché tiene más de 30 segundos de antigüedad
        const cacheTime = localStorage.getItem("gestion_prospectos_cache_time")
        if (cacheTime) {
          const elapsed = Date.now() - parseInt(cacheTime)
          if (elapsed > 30000) { // 30 segundos - refrescar más frecuentemente
            console.log("🔄 Refrescando datos al volver a la pestaña (caché > 30 seg)")
            handleProspectoChange()
          }
        } else {
          // Si no hay caché, cargar datos frescos
          console.log("🔄 Cargando datos frescos al volver a la pestaña")
          handleProspectoChange()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("prospecto:created", handleProspectoChange)
      window.removeEventListener("prospecto:updated", handleProspectoChange)
      window.removeEventListener("prospecto:deleted", handleProspectoChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [currentPage, fetchProspectos])

  // Helpers
  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "no contactado":
        return "bg-gray-100 text-gray-800"
      case "en seguimiento":
        return "bg-blue-100 text-blue-800"
      case "le interesa a futuro":
        return "bg-yellow-100 text-yellow-800"
      case "perdido":
        return "bg-red-100 text-red-800"
      case "inscrito":
        return "bg-green-100 text-green-800"
      case "promesa de pago":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // ⚡ Filtrado ahora se hace en el servidor, solo usamos los datos recibidos
  const filteredProspectos = prospectos

  // ⚡ Paginación del servidor - ya viene paginado
  const paginatedProspectos = useMemo(() => {
    return filteredProspectos
  }, [filteredProspectos])

  // Handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? prospectos.map((p) => p.id) : [])
  }
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((ids) =>
      checked ? [...ids, id] : ids.filter((i) => i !== id)
    )
  }
  const handlePageSizeChange = (v: string) => {
    setPageSize(v)
    setCurrentPage(1)
    // Invalidar caché al cambiar tamaño de página
    if (typeof window !== "undefined") {
      localStorage.removeItem("gestion_prospectos_cache")
      localStorage.removeItem("gestion_prospectos_cache_time")
    }
  }

  // ⚡ Invalidar caché cuando se actualiza un prospecto
  const handleUpdateProspecto = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gestion_prospectos_cache")
      localStorage.removeItem("gestion_prospectos_cache_time")
    }
    fetchProspectos(currentPage, true)
  }, [fetchProspectos, currentPage])
  const handleNextPage = () =>
    currentPage < totalPages && setCurrentPage((p) => p + 1)
  const handlePrevPage = () =>
    currentPage > 1 && setCurrentPage((p) => p - 1)

  // Preinscripción - Redirige automáticamente a la ficha de inscripción
  const handleInscribir = async (id: string) => {
    const result = await Swal.fire({
      title: "Pasar a preinscripción",
      text: "¿Confirmas que deseas pasar este prospecto al módulo de Inscripción?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, pasar a Inscripción",
      cancelButtonText: "Cancelar",
    })
    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/prospectos/${id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Preinscripción" }),
      })
      if (!res.ok) {
        throw new Error(`Error al actualizar estado: ${res.status}`)
      }
      await res.json()

      // ✅ Mostrar mensaje de éxito y redirigir automáticamente
      await Swal.fire({
        title: "¡Listo!",
        text: "El prospecto ha sido pasado a Inscripción. Serás redirigido para completar la ficha.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      })

      // 🔄 Redirigir a la ficha de inscripción con el ID del prospecto
      window.location.href = `/inscripcion/ficha?prospectoId=${id}`

    } catch (err: any) {
      Swal.fire("Error", err.message, "error")
      console.log('Error details:', err);
    }
  }

  //bulk de presinscrpccion 
  // 1) Dentro de tu componente, justo junto al resto de handlers:
  const handleBulkInscribir = async () => {
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
      title: 'Pasar a preinscripción masiva',
      text: `¿Confirmas que deseas inscribir ${selectedIds.length} prospectos?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, inscribir',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/prospectos/bulk-update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prospecto_ids: selectedIds.map((id) => Number(id)),
          status: 'Preinscripción',
        }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await res.json();

      // Actualiza tu estado local: quita los que ya pasaron a inscripción
      setProspectos((ps) => ps.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      Swal.fire('¡Listo!', 'Los prospectos se han pasado a Inscripción.', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };


  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filtros */}
      <div className="p-4 border-b flex flex-wrap gap-4">
        <Input
          placeholder="Buscar prospectos..."
          className="max-w-xs"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
        />

        <Select
          value={estadoFilter}
          onValueChange={(v) => {
            setEstadoFilter(v)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={departamentoFilter}
          onValueChange={(v) => {
            setDepartamentoFilter(v)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {departamentos.filter(d => d && d.trim() !== "").map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={puestoFilter}
          onValueChange={(v) => {
            setPuestoFilter(v)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Puesto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {puestos.filter(p => p && p.trim() !== "" && p !== "N/A").map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={origenFilter}
          onValueChange={(v) => {
            setOrigenFilter(v)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {origenes.filter(o => o && o.trim() !== "" && o !== "—").map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.removeItem("gestion_prospectos_cache")
              localStorage.removeItem("gestion_prospectos_cache_time")
            }
            fetchProspectos(currentPage, true)
          }}
          disabled={loading}
          title="Refrescar lista de prospectos"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refrescar
        </Button>

        <Button
          variant="outline"
          disabled={selectedIds.length === 0}
          onClick={handleBulkInscribir}
        >
          Inscribir seleccionados ({selectedIds.length})
        </Button>

      </div>

      {(!mounted || loading) && (
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-9 gap-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                  <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {error && <p className="p-4 text-red-500">{error}</p>}

      {/* Tabla */}
      {mounted && !loading && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="py-3 px-4">
                  <Checkbox
                    checked={selectedIds.length === prospectos.length}
                    onCheckedChange={(c) => handleSelectAll(c as boolean)}
                  />
                </th>
                <th className="py-3 px-4 text-left">Nombre</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Teléfono</th>
                <th className="py-3 px-4 text-left">Empresa</th>
                <th className="py-3 px-4 text-left">Puesto</th>
                <th className="py-3 px-4 text-left">Origen</th>
                <th className="py-3 px-4 text-left">Notas</th>
                <th className="py-3 px-4 text-left">Estado</th>
                <th className="py-3 px-4 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedProspectos && paginatedProspectos.length > 0 && paginatedProspectos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Checkbox
                      checked={selectedIds.includes(p.id)}
                      onCheckedChange={(c) => handleSelectOne(p.id, c as boolean)}
                    />
                  </td>
                  <td className="py-3 px-4">{p.nombre}</td>
                  <td className="py-3 px-4">{p.email}</td>
                  <td className="py-3 px-4">{p.telefono}</td>
                  <td className="py-3 px-4">{p.departamento}</td>
                  <td className="py-3 px-4">{p.puesto}</td>
                  <td className="py-3 px-4">{p.origen}</td>
                  <td className="py-3 px-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="max-w-[150px] truncate cursor-help">
                            {p.notasGenerales || p.observaciones ? (
                              <span className="text-xs text-gray-600">
                                {p.notasGenerales || p.observaciones}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Sin notas</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          {p.notasGenerales && (
                            <div className="mb-2">
                              <strong>Notas Generales:</strong>
                              <p className="text-sm">{p.notasGenerales}</p>
                            </div>
                          )}
                          {p.observaciones && (
                            <div>
                              <strong>Observaciones:</strong>
                              <p className="text-sm">{p.observaciones}</p>
                            </div>
                          )}
                          {!p.notasGenerales && !p.observaciones && (
                            <p className="text-sm text-gray-400">Sin notas ni observaciones</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(
                          p.estado
                        )}`}
                      >
                        {p.estado}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Último cambio: {p.ultimoCambio}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <TooltipProvider>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedProspecto(p)
                                setModalType("detalles")
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver prospecto</TooltipContent>
                        </Tooltip>

                        {currentUser?.rol !== "asesor" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedProspecto(p)
                                  setModalType("editar")
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                        )}

                        {currentUser?.rol === "administrador" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedProspecto(p)
                                  setModalType("editar")
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleInscribir(p.id)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Inscribir</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedProspecto(p)
                                setModalType("alerta")
                              }}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Alerta Alumno Nuevo</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <DropdownMenu>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProspecto(p)
                                  setModalType("editar")
                                }}
                              >
                                Actualizar Prospecto
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProspecto(p)
                                  setShowEstadoMenu(true)
                                }}
                              >
                                Cambiar Estado
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleInscribir(p.id)}>
                                Inscribir
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDescargarReporte(p.id)}
                                disabled={descargandoReporte === p.id}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {descargandoReporte === p.id ? "Descargando..." : "Descargar Reporte PDF"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <TooltipContent>Más acciones</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </td>
                </tr>
              ))}
              {paginatedProspectos.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-4 text-center text-gray-500">
                    No se encontraron prospectos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      <div className="flex items-center justify-end gap-2 p-4">
        <Select value={pageSize} onValueChange={handlePageSizeChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Paginación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
        {pageSize !== "all" && (
          <>
            <Button variant="outline" onClick={handlePrevPage} disabled={currentPage === 1}>
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Siguiente
            </Button>
          </>
        )}
      </div>

      {/* Modales */}
      {selectedProspecto && modalType === "detalles" && (
        <DetallesProspecto
          prospectoId={selectedProspecto.id}
          onClose={() => {
            setSelectedProspecto(null)
            setModalType(null)
          }}
        />
      )}
      {selectedProspecto && modalType === "editar" && (
        <EditarProspectoCompleto
          prospectoId={selectedProspecto.id}
          onClose={() => {
            setSelectedProspecto(null)
            setModalType(null)
          }}
          onUpdate={handleUpdateProspecto}
        />
      )}
      {selectedProspecto && showEstadoMenu && (
        <CambiarEstado
          prospecto={selectedProspecto}
          onClose={() => {
            setSelectedProspecto(null)
            setShowEstadoMenu(false)
          }}
        />
      )}
      {selectedProspecto && modalType === "alerta" && (
        <Dialog open onOpenChange={() => {
          setSelectedProspecto(null)
          setModalType(null)
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Alerta Alumno Nuevo</DialogTitle>
              <DialogDescription>
                Envía este prospecto al flujo de generación de credenciales para iniciar su proceso como alumno nuevo.
              </DialogDescription>
            </DialogHeader>
            <AlertaAlumnoNuevo
              prospectoId={selectedProspecto.id}
              prospectoNombre={selectedProspecto.nombre}
              onClose={() => {
                setSelectedProspecto(null)
                setModalType(null)
              }}
              onSuccess={() => {
                // Invalidar caché y recargar
                localStorage.removeItem("gestion_prospectos_cache")
                localStorage.removeItem("gestion_prospectos_cache_time")
                window.location.reload()
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
