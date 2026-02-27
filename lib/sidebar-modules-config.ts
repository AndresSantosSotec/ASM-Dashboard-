/**
 * Configuración centralizada del sidebar y carnets de prospectos.
 *
 * - SIDEBAR_MODULES: Define el orden y los iconos de los módulos en el sidebar.
 *   Cambia `order` para reordenar. El orden 1 aparece primero.
 *
 * - CARNET_CONFIG: Prefijo y formato de carnets para prospectos.
 *   El backend puede usar NEXT_PUBLIC_CARNET_PREFIX o esta config.
 */

import * as Icons from "lucide-react"

export type LucideIconName = keyof typeof Icons

export type SidebarModuleConfig = {
  /** Nombre del módulo (debe coincidir con el backend) */
  name: string
  /** Orden de aparición en el sidebar (1 = primero) */
  order: number
  /** Icono Lucide para el módulo */
  icon: LucideIconName
}

/**
 * Orden e iconos de los módulos en el sidebar.
 * Modifica `order` para cambiar el orden de aparición.
 */
export const SIDEBAR_MODULES: SidebarModuleConfig[] = [
  { name: "Prospectos y Asesores", order: 1, icon: "Users" },
  { name: "Inscripción", order: 2, icon: "FileText" },
  { name: "Académico", order: 3, icon: "BookOpen" },
  { name: "Finanzas y Pagos", order: 4, icon: "DollarSign" },
  { name: "Docentes", order: 5, icon: "GraduationCap" },
  { name: "Estudiantes", order: 6, icon: "Users" },
  { name: "Seguridad", order: 7, icon: "Shield" },
  { name: "Administración", order: 8, icon: "Settings" },
]

/** Mapa por nombre para búsqueda rápida */
export const SIDEBAR_MODULES_MAP: Record<string, SidebarModuleConfig> =
  Object.fromEntries(SIDEBAR_MODULES.map((m) => [m.name, m]))

/**
 * Configuración de carnets para prospectos.
 * - prefix: Prefijo del carnet (ej: "GAI" → GAI2025001)
 * - displayName: Nombre para mostrar en etiquetas/documentos
 */
export const CARNET_CONFIG = {
  /** Prefijo del carnet de prospectos (usado al generar nuevo carnet) */
  prefix: process.env.NEXT_PUBLIC_CARNET_PREFIX ?? "GAI",
  /** Nombre corto para mostrar (ej: "Carnet Gaia") */
  displayName: "Carnet",
} as const

/** Obtiene el icono del módulo por nombre */
export function getModuleIcon(name: string): LucideIconName {
  return SIDEBAR_MODULES_MAP[name]?.icon ?? "Folder"
}

/**
 * Configuración del DISEÑO del sidebar.
 * Cambia estos valores para que el sidebar se vea diferente o mejor.
 */
export const SIDEBAR_DESIGN = {
  /**
   * Variante de layout: cambia el aspecto general del sidebar al inicio
   * - "classic": diseño actual con bordes suaves y fondo sólido
   * - "modern": más limpio, líneas finas, más aire entre elementos
   * - "minimal": ultra simple, sin separadores, solo iconos y texto
   * - "grouped": módulos en bloques visuales con fondo diferenciado
   */
  layoutVariant: "modern" as "classic" | "modern" | "minimal" | "grouped",
  /** Estilo del encabezado: "full" = icono + nombre, "icon" = solo icono, "minimal" = texto corto */
  headerStyle: "full" as "full" | "icon" | "minimal",
  /** Nombre de la marca */
  brandName: "Gaia Business School",
  /** Nombre corto (colapsado o headerStyle minimal) */
  brandNameShort: "Gaia",
  /** Ancho expandido (px) */
  widthExpanded: 256,
  /** Ancho colapsado (px) */
  widthCollapsed: 80,
  /** Radio de botones */
  itemRadius: "xl" as "xl" | "lg" | "md",
  /** Espaciado */
  spacing: "default" as "default" | "compact",
  /** Mostrar o no la etiqueta "Módulos" sobre la lista */
  showSectionLabel: true,
}
