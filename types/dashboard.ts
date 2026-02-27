import type React from "react"
import type { DashboardSectionId } from "@/lib/dashboard-inicio-config"

export interface DashboardHelpers {
  getGreeting: () => string
  formatDate: () => string
  formatTime: () => string
  statsGridCols: string
  getIconComponent: (iconName: string) => React.ReactNode
  getActivityIcon: (type: string) => React.ReactNode
  currentPage: number
  setCurrentPage: (page: number) => void
  paginaAprobacion: number
  setPaginaAprobacion: (page: number) => void
  itemsPerPage: number
}

/** Configuración del dashboard que envía el backend (por rol) */
export interface DashboardConfig {
  section_order: DashboardSectionId[]
  stats_columns: 2 | 3 | 4
  spacing: "normal" | "compact"
}
