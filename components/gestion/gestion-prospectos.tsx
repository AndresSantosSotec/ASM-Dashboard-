"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Swal from "sweetalert2"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter, MoreHorizontal, Eye, Edit2, UserPlus, AlertCircle, RefreshCw, Download, MessageCircle, Trash2, Settings2, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react"
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
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
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
import SeguimientoModalPanel from "@/components/seguimiento/seguimiento-modal-panel"
import SelectorColumnasModal from "./selector-columnas-modal"
import { ScrollArea } from "@/components/ui/scroll-area"
import { API_BASE_URL } from "@/utils/apiConfig"

const API_URL = `${API_BASE_URL}/api`

interface Columna {
  key: string
  label: string
  tipo: "base" | "extra"
  visible: boolean
  orden: number
}

interface ColumnasData {
  base: Columna[]
  extra: Columna[]
}

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
  creador?: string
  creadorId?: string
  genero?: string
  correo_corporativo?: string
  telefono_corporativo?: string
  modalidad?: string
  nivel_academico?: string
  ultimo_titulo_obtenido?: string
  institucion_titulo?: string
  carrera_ultimo_titulo?: string
  anio_graduacion?: string
  numero_identificacion?: string
  fecha_nacimiento?: string
  direccion_residencia?: string
  // ✨ Permitir cualquier propiedad adicional para columnas dinámicas
  [key: string]: any
}

interface Creator {
  id: number
  name: string
  email: string
}

export default function GestionProspectos() {
  const [mounted, setMounted] = useState(false);
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [programas, setProgramas] = useState<Record<string, string>>({});
  const [programasLoaded, setProgramasLoaded] = useState(false);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null)
  const [modalType, setModalType] = useState<"detalles" | "editar" | "alerta" | "seguimiento" | null>(null)
  const [showEstadoMenu, setShowEstadoMenu] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [descargandoReporte, setDescargandoReporte] = useState<string | null>(null)

  // 📊 Estados para columnas dinámicas
  const [columnasDisponibles, setColumnasDisponibles] = useState<ColumnasData | null>(null)
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState<string[]>([])
  const [mostrarSelectorColumnas, setMostrarSelectorColumnas] = useState(false)

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
  const [estadoFilters, setEstadoFilters] = useState<string[]>([])
  const [departamentoFilters, setDepartamentoFilters] = useState<string[]>([])
  const [puestoFilters, setPuestoFilters] = useState<string[]>([])
  const [origenFilters, setOrigenFilters] = useState<string[]>([])
  const [creadorFilters, setCreadorFilters] = useState<string[]>([])
  const [pageSize, setPageSize] = useState<string>("50")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalProspectos, setTotalProspectos] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  // Ordenador
  const [sortBy, setSortBy] = useState<string>("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  // Buscador dentro de cada filtro multi-select
  const [searchEstado, setSearchEstado] = useState<string>("")
  const [searchDepartamento, setSearchDepartamento] = useState<string>("")
  const [searchPuesto, setSearchPuesto] = useState<string>("")
  const [searchOrigen, setSearchOrigen] = useState<string>("")
  const [searchCreador, setSearchCreador] = useState<string>("")
  const [filtrosAbiertos, setFiltrosAbiertos] = useState<boolean>(true)
  // Filtros dinámicos por columnas agregadas (key columna -> valores seleccionados)
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, string[]>>({})
  const [searchDynamic, setSearchDynamic] = useState<Record<string, string>>({})

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
            .filter((o) => o && o.trim() !== "" && o !== "—")
        )
      ).sort((a, b) => a.localeCompare(b)),
    [prospectos]
  )

  // Opciones filtradas por buscador (multi-select)
  const departamentosFiltrados = useMemo(
    () =>
      searchDepartamento.trim()
        ? departamentos.filter((d) =>
            d != null && String(d).toLowerCase().includes(searchDepartamento.toLowerCase())
          )
        : departamentos,
    [departamentos, searchDepartamento]
  )
  const puestosFiltrados = useMemo(
    () =>
      searchPuesto.trim()
        ? puestos.filter((p) =>
            p != null && String(p).toLowerCase().includes(searchPuesto.toLowerCase())
          )
        : puestos,
    [puestos, searchPuesto]
  )
  const origenesFiltrados = useMemo(
    () =>
      searchOrigen.trim()
        ? origenes.filter((o) =>
            o != null && String(o).toLowerCase().includes(searchOrigen.toLowerCase())
          )
        : origenes,
    [origenes, searchOrigen]
  )
  const creatorsFiltrados = useMemo(
    () =>
      searchCreador.trim()
        ? creators.filter(
            (c) =>
              (c.name && c.name.toLowerCase().includes(searchCreador.toLowerCase())) ||
              (c.email && c.email.toLowerCase().includes(searchCreador.toLowerCase()))
          )
        : creators,
    [creators, searchCreador]
  )

  // Columnas extra seleccionadas (para filtros dinámicos con misma estructura)
  const columnasExtraParaFiltros = useMemo(() => {
    if (!columnasDisponibles) return []
    const baseKeys = new Set(columnasDisponibles.base.map((c) => c.key))
    return columnasSeleccionadas.filter((key) => !baseKeys.has(key))
  }, [columnasDisponibles, columnasSeleccionadas])

  // Valores distintos por columna extra (desde datos actuales)
  const getValorColumna = useCallback((p: Prospecto, columnaKey: string): string => {
    const fieldMap: Record<string, string> = {
      nombre_completo: "nombre",
      correo_electronico: "email",
      status: "estado",
      created_by: "creador",
      medio_conocimiento_institucion: "origen",
      empresa_donde_labora_actualmente: "departamento",
      municipio_nombre: "ciudad",
      pais_nombre: "pais",
      interes: "programa",
      notas_generales: "notasGenerales",
    }
    const campo = fieldMap[columnaKey] || columnaKey
    let v = p[campo] ?? p[columnaKey]
    if (v === undefined || v === null) return ""
    if (typeof v === "object") return ""
    return String(v).trim()
  }, [])

  const valoresPorColumnaExtra = useMemo(() => {
    const out: Record<string, string[]> = {}
    columnasExtraParaFiltros.forEach((key) => {
      const vals = Array.from(
        new Set(
          prospectos
            .map((p) => getValorColumna(p, key))
            .filter((v) => v !== "" && v !== "—" && v !== "N/A")
        )
      ).sort((a, b) => a.localeCompare(b))
      out[key] = vals
    })
    return out
  }, [columnasExtraParaFiltros, prospectos, getValorColumna])

  // Lista completa de estados: API + los que aparecen en los datos (por si el backend limita por paginación)
  const statusesCompletos = useMemo(
    () =>
      Array.from(
        new Set([
          ...statuses,
          ...prospectos.map((p) => p.estado).filter((e): e is string => !!e && e.trim() !== ""),
        ])
      ).sort((a, b) => a.localeCompare(b)),
    [statuses, prospectos]
  )

  // Estados filtrados por buscador (para el selector múltiple)
  const statusesFiltrados = useMemo(
    () =>
      searchEstado.trim()
        ? statusesCompletos.filter((s) =>
            s != null && String(s).toLowerCase().includes(searchEstado.toLowerCase())
          )
        : statusesCompletos,
    [statusesCompletos, searchEstado]
  )

  // ⚙️ Control de montaje para evitar hidratación
  useEffect(() => {
    setMounted(true);

    // Cargar TODOS los estados (sin límite de paginación)
    const fetchStatuses = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_URL}/prospectos/statuses?per_page=500`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        })
        if (res.ok) {
          const data = await res.json()
          setStatuses(Array.isArray(data) ? data : data.data ?? data.statuses ?? [])
        }
      } catch (err) {
        console.error("Error cargando estados:", err)
      }
    }
    
    // Cargar creadores (usuarios que han creado prospectos)
    const fetchCreators = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_URL}/prospectos/creators`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        })
        if (res.ok) {
          const data = await res.json()
          setCreators(data)
        }
      } catch (err) {
        console.error("Error cargando creadores:", err)
      }
    }
    
    // 📊 Cargar columnas disponibles
    const fetchColumnas = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_URL}/prospectos/columnas-disponibles`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        })
        if (res.ok) {
          const data = await res.json()
          setColumnasDisponibles(data.data)
          
          // Cargar columnas seleccionadas desde localStorage o usar defaults
          const savedColumns = localStorage.getItem("gestion_prospectos_columnas")
          if (savedColumns) {
            setColumnasSeleccionadas(JSON.parse(savedColumns))
          } else {
            // Por defecto: solo columnas base
            const baseKeys = data.data.base.map((c: Columna) => c.key)
            setColumnasSeleccionadas(baseKeys)
          }
        }
      } catch (err) {
        console.error("Error cargando columnas:", err)
      }
    }
    
    fetchStatuses()
    fetchCreators()
    fetchColumnas()
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
    const sinFiltrosMulti =
      estadoFilters.length === 0 &&
      departamentoFilters.length === 0 &&
      puestoFilters.length === 0 &&
      origenFilters.length === 0 &&
      creadorFilters.length === 0 &&
      Object.keys(dynamicFilters).every((k) => dynamicFilters[k].length === 0)
    if (!resetCache && !debouncedSearchTerm && sinFiltrosMulti && page === 1) {
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

      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm)
        params.append("ignore_case", "1")
      }
      // Backend: con ignore_case=1 hacer búsqueda case-insensitive (ILIKE / LOWER(campo) LIKE LOWER(?))
      if (estadoFilters.length > 0) params.append("status", estadoFilters.join(","))
      if (departamentoFilters.length > 0) params.append("departamento", departamentoFilters.join(","))
      if (puestoFilters.length > 0) params.append("puesto", puestoFilters.join(","))
      if (origenFilters.length > 0) params.append("origen", origenFilters.join(","))
      if (creadorFilters.length > 0) params.append("created_by", creadorFilters.join(","))
      Object.entries(dynamicFilters).forEach(([key, vals]) => {
        if (vals.length > 0) params.append(`filter[${key}]`, vals.join(","))
      })
      if (sortBy) {
        params.append("sort_by", sortBy)
        params.append("sort_order", sortOrder)
      }

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

      // ⚡ Mapear datos de forma DINÁMICA - Incluye TODOS los campos del backend
      const list: Prospecto[] = (json.data || []).map((item: any) => {
        let programaNombre = "—";
        if (item.interes && programas[item.interes]) {
          programaNombre = programas[item.interes];
        } else if (item.interes) {
          programaNombre = `Programa ${item.interes}`;
        }

        // ✨ Spread operator para incluir TODOS los campos del backend dinámicamente
        const prospecto: Prospecto = {
          ...item, // Incluye todos los campos del backend
          // Mapeos específicos para compatibilidad con código existente
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
          creador: item.creator ? `${item.creator.first_name || ""} ${item.creator.last_name || ""}`.trim() : "Sin asignar",
          creadorId: item.created_by ? String(item.created_by) : undefined,
        };

        return prospecto;
      })

      setProspectos(list)

      // ⚡ Actualizar paginación
      if (json.pagination) {
        setTotalProspectos(json.pagination.total)
        setTotalPages(json.pagination.last_page)
      }

      // 💾 Guardar en caché solo si es primera página sin filtros
      if (page === 1 && !debouncedSearchTerm && sinFiltrosMulti) {
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
  }, [programasLoaded, debouncedSearchTerm, estadoFilters, departamentoFilters, puestoFilters, origenFilters, creadorFilters, dynamicFilters, pageSize, sortBy, sortOrder])

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
    if (estado == null || typeof estado !== "string") return "bg-gray-100 text-gray-800"
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

  // 📊 Handler para cambio de columnas + hot refresh con filtros actuales
  const handleColumnasChange = (columnas: string[]) => {
    setColumnasSeleccionadas(columnas)
    localStorage.setItem("gestion_prospectos_columnas", JSON.stringify(columnas))
    fetchProspectos(currentPage, true)
  }

  // 📊 Ordenar por columna (alterna asc/desc)
  const handleSort = (columnaKey: string) => {
    if (sortBy === columnaKey) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(columnaKey)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

  // 📊 Obtener label de columna
  const getLabelColumna = (key: string): string => {
    if (!columnasDisponibles) return key
    
    const columnaBase = columnasDisponibles.base.find(c => c.key === key)
    if (columnaBase) return columnaBase.label
    
    const columnaExtra = columnasDisponibles.extra.find(c => c.key === key)
    if (columnaExtra) return columnaExtra.label
    
    return key
  }

  // 📊 Renderizar celda dinámica - Soporta CUALQUIER columna del backend
  const renderCelda = (prospecto: Prospecto, columnaKey: string) => {
    // Mapeos especiales para campos con nombres diferentes en frontend vs backend
    const fieldMap: Record<string, string> = {
      'nombre_completo': 'nombre',
      'correo_electronico': 'email',
      'status': 'estado',
      'created_by': 'creador',
      'medio_conocimiento_institucion': 'origen',
      'empresa_donde_labora_actualmente': 'departamento',
      'municipio_nombre': 'ciudad',
      'pais_nombre': 'pais',
      'pais_residencia': 'pais',
      'interes': 'programa',
      'notas_generales': 'notasGenerales',
    }

    // Determinar el campo real a buscar
    const campoReal = fieldMap[columnaKey] || columnaKey
    
    // Obtener valor del prospecto (primero intenta el mapeo, luego directamente)
    let valor = prospecto[campoReal] !== undefined ? prospecto[campoReal] : prospecto[columnaKey]
    
    // Si aún no hay valor, intentar acceso directo por la key original
    if (valor === undefined || valor === null) {
      valor = '—'
    }
    
    // Formateo especial para fechas
    if ((columnaKey.includes('fecha') || columnaKey.includes('_at')) && valor && valor !== '—') {
      try {
        const fecha = new Date(valor)
        if (!isNaN(fecha.getTime())) {
          return fecha.toLocaleDateString('es-GT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
        }
      } catch {
        return valor
      }
    }

    // Formateo especial para booleanos
    if (typeof valor === 'boolean') {
      return valor ? 'Sí' : 'No'
    }

    // Formateo especial para números
    if (typeof valor === 'number') {
      return valor.toString()
    }

    return valor || '—'
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

  // Eliminar prospecto (solo para administradores)
  const handleDeleteProspecto = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar prospecto?',
      text: 'Esta acción no se puede deshacer. ¿Estás seguro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/prospectos/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      // Remover del estado local
      setProspectos((ps) => ps.filter((p) => p.id !== id));
      
      // Invalidar caché
      if (typeof window !== "undefined") {
        localStorage.removeItem("gestion_prospectos_cache");
        localStorage.removeItem("gestion_prospectos_cache_time");
      }
      
      Swal.fire('¡Eliminado!', 'El prospecto ha sido eliminado.', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.message || 'No se pudo eliminar el prospecto', 'error');
    }
  };


  return (
    <div className="bg-white rounded-lg shadow">
      {/* Panel de Filtros (colapsable) */}
      <div className="p-4 border-b">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFiltrosAbiertos((v) => !v)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {filtrosAbiertos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {(estadoFilters.length > 0 || departamentoFilters.length > 0 || puestoFilters.length > 0 || origenFilters.length > 0 || creadorFilters.length > 0 || Object.values(dynamicFilters).some((arr) => arr.length > 0)) && (
            <Badge variant="secondary">
              Filtros activos
            </Badge>
          )}
        </div>
        {filtrosAbiertos && (
        <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Buscar prospectos..."
          className="max-w-xs"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
        />

        {/* Selector múltiple de Estados con buscador */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              <span className="truncate">
                {estadoFilters.length === 0
                  ? "Todos los estados"
                  : `Estados (${estadoFilters.length})`}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px] p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar estado..."
                  className="pl-8 h-9"
                  value={searchEstado}
                  onChange={(e) => setSearchEstado(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[280px]">
              {statusesFiltrados.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Sin resultados</p>
              ) : (
                statusesFiltrados.map((s) => (
                  <DropdownMenuCheckboxItem
                    key={s}
                    checked={estadoFilters.includes(s)}
                    onCheckedChange={(checked) => {
                      setEstadoFilters((prev) =>
                        checked ? [...prev, s] : prev.filter((x) => x !== s)
                      )
                      setCurrentPage(1)
                    }}
                  >
                    {s}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </ScrollArea>
            {estadoFilters.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setEstadoFilters([])
                      setCurrentPage(1)
                    }}
                  >
                    Limpiar selección
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Departamento: multi-select con buscador */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              <span className="truncate">
                {departamentoFilters.length === 0 ? "Todos departamentos" : `Depart. (${departamentoFilters.length})`}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px] p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-8 h-9" value={searchDepartamento} onChange={(e) => setSearchDepartamento(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
              </div>
            </div>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[220px]">
              {departamentosFiltrados.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">Sin resultados</p> : departamentosFiltrados.map((d) => (
                <DropdownMenuCheckboxItem key={d} checked={departamentoFilters.includes(d)} onCheckedChange={(checked) => { setDepartamentoFilters((prev) => (checked ? [...prev, d] : prev.filter((x) => x !== d))); setCurrentPage(1) }}>{d}</DropdownMenuCheckboxItem>
              ))}
            </ScrollArea>
            {departamentoFilters.length > 0 && (
              <div className="p-2 border-t"><Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setDepartamentoFilters([]); setCurrentPage(1) }}>Limpiar</Button></div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Puesto: multi-select con buscador */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              <span className="truncate">{puestoFilters.length === 0 ? "Todos puestos" : `Puestos (${puestoFilters.length})`}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px] p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
            <div className="p-2 border-b"><div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-8 h-9" value={searchPuesto} onChange={(e) => setSearchPuesto(e.target.value)} onKeyDown={(e) => e.stopPropagation()} /></div></div>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[220px]">
              {puestosFiltrados.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">Sin resultados</p> : puestosFiltrados.map((p) => (
                <DropdownMenuCheckboxItem key={p} checked={puestoFilters.includes(p)} onCheckedChange={(checked) => { setPuestoFilters((prev) => (checked ? [...prev, p] : prev.filter((x) => x !== p))); setCurrentPage(1) }}>{p}</DropdownMenuCheckboxItem>
              ))}
            </ScrollArea>
            {puestoFilters.length > 0 && <div className="p-2 border-t"><Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setPuestoFilters([]); setCurrentPage(1) }}>Limpiar</Button></div>}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Origen: multi-select con buscador */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              <span className="truncate">{origenFilters.length === 0 ? "Todos orígenes" : `Orígenes (${origenFilters.length})`}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px] p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
            <div className="p-2 border-b"><div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-8 h-9" value={searchOrigen} onChange={(e) => setSearchOrigen(e.target.value)} onKeyDown={(e) => e.stopPropagation()} /></div></div>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[220px]">
              {origenesFiltrados.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">Sin resultados</p> : origenesFiltrados.map((o) => (
                <DropdownMenuCheckboxItem key={o} checked={origenFilters.includes(o)} onCheckedChange={(checked) => { setOrigenFilters((prev) => (checked ? [...prev, o] : prev.filter((x) => x !== o))); setCurrentPage(1) }}>{o}</DropdownMenuCheckboxItem>
              ))}
            </ScrollArea>
            {origenFilters.length > 0 && <div className="p-2 border-t"><Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setOrigenFilters([]); setCurrentPage(1) }}>Limpiar</Button></div>}
          </DropdownMenuContent>
        </DropdownMenu>

        {currentUser?.rol === "administrador" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                <span className="truncate">{creadorFilters.length === 0 ? "Todos creadores" : `Creadores (${creadorFilters.length})`}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px] p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
              <div className="p-2 border-b"><div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-8 h-9" value={searchCreador} onChange={(e) => setSearchCreador(e.target.value)} onKeyDown={(e) => e.stopPropagation()} /></div></div>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[220px]">
                {creatorsFiltrados.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">Sin resultados</p> : creatorsFiltrados.map((c) => (
                  <DropdownMenuCheckboxItem key={c.id} checked={creadorFilters.includes(String(c.id))} onCheckedChange={(checked) => { setCreadorFilters((prev) => (checked ? [...prev, String(c.id)] : prev.filter((x) => x !== String(c.id)))); setCurrentPage(1) }}>{c.name}</DropdownMenuCheckboxItem>
                ))}
              </ScrollArea>
              {creadorFilters.length > 0 && <div className="p-2 border-t"><Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setCreadorFilters([]); setCurrentPage(1) }}>Limpiar</Button></div>}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Filtros dinámicos por columnas agregadas */}
        {columnasExtraParaFiltros.map((colKey) => {
          const opts = valoresPorColumnaExtra[colKey] ?? []
          const selected = dynamicFilters[colKey] ?? []
          const searchVal = searchDynamic[colKey] ?? ""
          const setSearchVal = (v: string) => setSearchDynamic((prev) => ({ ...prev, [colKey]: v }))
          const filtrados = searchVal.trim() ? opts.filter((o) => (o != null && String(o).toLowerCase().includes(searchVal.toLowerCase()))) : opts
          return (
            <DropdownMenu key={colKey}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  <span className="truncate">{selected.length === 0 ? getLabelColumna(colKey) : `${getLabelColumna(colKey)} (${selected.length})`}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[240px] p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
                <div className="p-2 border-b"><div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-8 h-9" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.stopPropagation()} /></div></div>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[200px]">
                  {filtrados.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">Sin opciones</p> : filtrados.map((val) => (
                    <DropdownMenuCheckboxItem key={val} checked={selected.includes(val)} onCheckedChange={(checked) => { setDynamicFilters((prev) => ({ ...prev, [colKey]: checked ? [...(prev[colKey] ?? []), val] : (prev[colKey] ?? []).filter((x) => x !== val) })); setCurrentPage(1) }}>{val}</DropdownMenuCheckboxItem>
                  ))}
                </ScrollArea>
                {selected.length > 0 && <div className="p-2 border-t"><Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setDynamicFilters((prev) => ({ ...prev, [colKey]: [] })); setCurrentPage(1) }}>Limpiar</Button></div>}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        })}

        {/* 📊 Botón de configuración de columnas */}
        <Button
          variant="outline"
          onClick={() => setMostrarSelectorColumnas(true)}
          title="Configurar columnas visibles"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Columnas
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
        )}
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
                {columnasSeleccionadas.map((columnaKey) => (
                  <th key={columnaKey} className="py-3 px-4 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort(columnaKey)}
                      className="flex items-center gap-1 hover:text-gray-900 font-medium"
                    >
                      {getLabelColumna(columnaKey)}
                      {sortBy === columnaKey ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  </th>
                ))}
                <th className="py-3 px-4 text-left">Notas</th>
                <th className="py-3 px-4 text-left">
                  <button
                    type="button"
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-1 hover:text-gray-900 font-medium"
                  >
                    Estado
                    {sortBy === "status" ? (
                      sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                </th>
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
                  {/* Columnas dinámicas */}
                  {columnasSeleccionadas.map((columnaKey) => (
                    <td key={columnaKey} className="py-3 px-4">
                      {renderCelda(p, columnaKey)}
                    </td>
                  ))}
                  {/* Notas (siempre visible) */}
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
                  {/* Estado (siempre visible) */}
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
                  {/* Acciones (siempre visible) */}
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
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedProspecto(p)
                                setModalType("seguimiento")
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Panel de Seguimiento</TooltipContent>
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
                              {currentUser?.rol === "administrador" && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteProspecto(p.id)}
                                  className="text-red-600 focus:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar Prospecto
                                </DropdownMenuItem>
                              )}
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
                  <td colSpan={16} className="py-4 text-center text-gray-500">
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
      {selectedProspecto && modalType === "seguimiento" && (
        <SeguimientoModalPanel
          prospecto={selectedProspecto}
          onClose={() => {
            setSelectedProspecto(null)
            setModalType(null)
          }}
        />
      )}

      {/* 📊 Modal de Configuración de Columnas */}
      <SelectorColumnasModal
        open={mostrarSelectorColumnas}
        onClose={() => setMostrarSelectorColumnas(false)}
        columnasDisponibles={columnasDisponibles}
        columnasSeleccionadas={columnasSeleccionadas}
        onChange={handleColumnasChange}
      />
    </div>
  )
}
