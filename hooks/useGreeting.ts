"use client";

import { useMemo } from "react";

export type GreetingType = "morning" | "afternoon" | "night";

export interface GreetingResult {
  /** Texto del saludo: "Buenos días", "Buenas tardes", "Buenas noches" */
  text: string;
  /** Emoji asociado al momento del día */
  emoji: string;
  /** Etiqueta para estilos o lógica */
  type: GreetingType;
  /** Hora actual (0-23) usada para el cálculo */
  hour: number;
}

/**
 * Devuelve un saludo según la hora del día.
 * - 00:00 - 11:59 → Buenos días
 * - 12:00 - 17:59 → Buenas tardes
 * - 18:00 - 23:59 → Buenas noches
 */
export function useGreeting(): GreetingResult {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return {
        text: "Buenos días",
        emoji: "🌅",
        type: "morning",
        hour: 9,
      };
    }
    const hour = new Date().getHours();
    if (hour < 12) {
      return { text: "Buenos días", emoji: "🌅", type: "morning", hour };
    }
    if (hour < 18) {
      return { text: "Buenas tardes", emoji: "☀️", type: "afternoon", hour };
    }
    return { text: "Buenas noches", emoji: "🌙", type: "night", hour };
  }, []);
}
