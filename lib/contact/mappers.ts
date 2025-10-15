// lib/contact/mappers.ts
import type { ProspectoContact } from "@/services/finance"

export function pickTelefono(p?: ProspectoContact): string {
  return (
    (p?.telefono_corporativo ?? "").trim() ||
    (p?.telefono ?? "").trim() ||
    ""
  )
}

export function pickCorreo(p?: ProspectoContact): string {
  return (
    (p?.correo_corporativo ?? "").trim() ||
    (p?.correo_electronico ?? "").trim() ||
    ""
  )
}

export function pickProgramaNombre(p?: ProspectoContact): string | undefined {
  return p?.programas?.[0]?.programa?.nombre_del_programa ?? undefined
}
