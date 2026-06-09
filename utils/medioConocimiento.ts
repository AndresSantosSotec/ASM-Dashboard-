export const MEDIO_CONOCIMIENTO_OPCIONES = [
  "facebook",
  "instagram",
  "linkedin",
  "referido",
  "whatsapp_corporativo",
  "pagina_web",
  "actividades_escritorio",
  "meeting",
  "otros",
] as const

export type MedioConocimientoOpcion = (typeof MEDIO_CONOCIMIENTO_OPCIONES)[number]

export const MEDIO_CONOCIMIENTO_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  referido: "Referido",
  whatsapp_corporativo: "WhatsApp Corporativo",
  pagina_web: "Página Web",
  actividades_escritorio: "Actividades de Escritorio",
  meeting: "Meeting",
  otros: "Otros",
}

const PREDEFINIDOS = new Set<string>(MEDIO_CONOCIMIENTO_OPCIONES.filter((v) => v !== "otros"))

export function resolveMedioConocimiento(stored: string | null | undefined) {
  const value = (stored ?? "").trim()
  if (!value) {
    return { selectValue: "", customText: "", isCustom: false, valueToSave: "" }
  }
  if (value === "otros" || !PREDEFINIDOS.has(value)) {
    const customText = value === "otros" ? "" : value
    return {
      selectValue: "otros",
      customText,
      isCustom: true,
      valueToSave: customText,
    }
  }
  return {
    selectValue: value,
    customText: "",
    isCustom: false,
    valueToSave: value,
  }
}

export function getMedioConocimientoToSave(selectValue: string, customText: string): string | null {
  if (!selectValue) return null
  if (selectValue === "otros") {
    const trimmed = customText.trim()
    return trimmed || null
  }
  return selectValue
}

export function formatMedioConocimientoDisplay(stored: string | null | undefined): string {
  const value = (stored ?? "").trim()
  if (!value) return "—"
  return MEDIO_CONOCIMIENTO_LABELS[value] ?? value
}
