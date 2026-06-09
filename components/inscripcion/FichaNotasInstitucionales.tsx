"use client"

import {
  FICHA_NOTAS_INSTITUCIONALES_DESTACADO,
  FICHA_NOTAS_INSTITUCIONALES_LISTA,
  FICHA_NOTAS_INSTITUCIONALES_PARRAFOS,
  FICHA_NOTAS_INSTITUCIONALES_TITULO,
} from "@/utils/fichaNotasInstitucionales"

type Props = {
  className?: string
  compact?: boolean
}

export default function FichaNotasInstitucionales({ className = "", compact = false }: Props) {
  return (
    <section
      className={`rounded-md border border-slate-200 bg-slate-50 ${compact ? "p-3" : "p-4 mt-6"} ${className}`}
      aria-label={FICHA_NOTAS_INSTITUCIONALES_TITULO}
    >
      <h3 className={`font-bold uppercase text-[#1e264d] ${compact ? "text-xs mb-2" : "text-sm mb-3"}`}>
        {FICHA_NOTAS_INSTITUCIONALES_TITULO}
      </h3>
      <div className={`space-y-2 text-slate-600 ${compact ? "text-xs" : "text-sm"} text-justify`}>
        {FICHA_NOTAS_INSTITUCIONALES_PARRAFOS.map((parrafo) => (
          <p key={parrafo}>{parrafo}</p>
        ))}
        <p className="font-semibold text-slate-800">{FICHA_NOTAS_INSTITUCIONALES_DESTACADO}</p>
        <ul className="list-disc ml-5 space-y-1">
          {FICHA_NOTAS_INSTITUCIONALES_LISTA.map((nota) => (
            <li key={nota}>{nota}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
