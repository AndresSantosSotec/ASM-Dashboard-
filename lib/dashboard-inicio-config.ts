/**
 * Configuración del dashboard de inicio (http://localhost:3000/).
 *
 * - DASHBOARD_SECTION_ORDER: FALLBACK cuando el backend no retorna dashboard_config.
 *   El orden REAL lo controla el backend por rol (DashboardController::getDashboardConfig).
 *
 * - DASHBOARD_INICIO_DESIGN: valores por defecto de columnas y espaciado (fallback).
 *
 * - DASHBOARD_CONFIGS_POR_ROL: espejo del backend para referencia/debug.
 */

export type DashboardSectionId =
  | "welcome"
  | "stats"
  | "notifications"
  | "activity"
  | "alertas"
  | "aprobacion"
  | "quickAccess"

/** FALLBACK: orden usado si el backend no retorna dashboard_config */
export const DASHBOARD_SECTION_ORDER: DashboardSectionId[] = [
  "welcome",
  "quickAccess",
  "stats",
  "notifications",
  "activity",
  "alertas",
  "aprobacion",
]

export const DASHBOARD_INICIO_DESIGN = {
  statsGridColumnsLg: 4 as 2 | 3 | 4,
  sectionSpacing: "normal" as "normal" | "compact",
}

/** Configuraciones por rol (espejo del backend para debug). El backend es la fuente de verdad. */
export const DASHBOARD_CONFIGS_POR_ROL: Record<
  number,
  {
    section_order: DashboardSectionId[]
    stats_columns: 2 | 3 | 4
    spacing: "normal" | "compact"
  }
> = {
  1: {
    section_order: ["welcome", "quickAccess", "stats", "alertas", "aprobacion", "notifications", "activity"],
    stats_columns: 4,
    spacing: "normal",
  },
  2: {
    section_order: ["welcome", "quickAccess", "stats", "activity", "notifications"],
    stats_columns: 3,
    spacing: "normal",
  },
  3: {
    section_order: ["welcome", "stats", "quickAccess", "activity", "notifications"],
    stats_columns: 2,
    spacing: "compact",
  },
  4: {
    section_order: ["welcome", "quickAccess", "stats", "notifications", "activity"],
    stats_columns: 3,
    spacing: "normal",
  },
  5: {
    section_order: ["welcome", "stats", "quickAccess", "notifications", "activity"],
    stats_columns: 4,
    spacing: "normal",
  },
  6: {
    section_order: ["welcome", "stats", "activity", "quickAccess", "notifications"],
    stats_columns: 4,
    spacing: "compact",
  },
  7: {
    section_order: ["welcome", "quickAccess", "stats", "alertas", "aprobacion", "activity", "notifications"],
    stats_columns: 3,
    spacing: "normal",
  },
}
