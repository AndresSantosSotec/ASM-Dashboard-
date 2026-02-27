"use client";

import React from "react";

export type StatColor =
  | "blue"
  | "red"
  | "green"
  | "amber"
  | "purple"
  | "slate"
  | "cyan"
  | "indigo"
  | "emerald"
  | "rose"
  | "sky"
  | "orange"
  | "violet"
  | "teal"
  | "lime"
  | "fuchsia";

const COLOR_CLASSES: Record<
  StatColor,
  { border: string; bg: string; text: string; icon: string }
> = {
  blue: { border: "border-t-blue-500", bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
  red: { border: "border-t-red-500", bg: "bg-red-50", text: "text-red-600", icon: "text-red-500" },
  green: { border: "border-t-green-500", bg: "bg-green-50", text: "text-green-600", icon: "text-green-500" },
  amber: { border: "border-t-amber-500", bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-500" },
  purple: { border: "border-t-purple-500", bg: "bg-purple-50", text: "text-purple-600", icon: "text-purple-500" },
  slate: { border: "border-t-slate-500", bg: "bg-slate-50", text: "text-slate-600", icon: "text-slate-500" },
  cyan: { border: "border-t-cyan-500", bg: "bg-cyan-50", text: "text-cyan-600", icon: "text-cyan-500" },
  indigo: { border: "border-t-indigo-500", bg: "bg-indigo-50", text: "text-indigo-600", icon: "text-indigo-500" },
  emerald: { border: "border-t-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500" },
  rose: { border: "border-t-rose-500", bg: "bg-rose-50", text: "text-rose-600", icon: "text-rose-500" },
  sky: { border: "border-t-sky-500", bg: "bg-sky-50", text: "text-sky-600", icon: "text-sky-500" },
  orange: { border: "border-t-orange-500", bg: "bg-orange-50", text: "text-orange-600", icon: "text-orange-500" },
  violet: { border: "border-t-violet-500", bg: "bg-violet-50", text: "text-violet-600", icon: "text-violet-500" },
  teal: { border: "border-t-teal-500", bg: "bg-teal-50", text: "text-teal-600", icon: "text-teal-500" },
  lime: { border: "border-t-lime-500", bg: "bg-lime-50", text: "text-lime-600", icon: "text-lime-500" },
  fuchsia: { border: "border-t-fuchsia-500", bg: "bg-fuchsia-50", text: "text-fuchsia-600", icon: "text-fuchsia-500" },
};

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color?: StatColor;
  trend?: number;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  icon,
  color = "blue",
  trend,
  subtitle,
}: StatCardProps) {
  const c = COLOR_CLASSES[color] ?? COLOR_CLASSES.blue;

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 border-t-4 ${c.border} p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
          <span className={c.icon}>{icon}</span>
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              trend >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={`text-3xl font-black ${c.text} mb-1`}>{value}</div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      {subtitle != null && subtitle !== "" && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export const STAT_COLORS: Record<string, StatColor> = {
  cursos_activos: "blue",
  tareas_pendientes: "amber",
  prospectos_asignados: "green",
  estudiantes_total: "purple",
  promedio_general: "indigo",
  cursos_completados: "green",
  prospectos_nuevos: "cyan",
  total_prospectos: "slate",
  pagos_procesados_mes: "green",
  monto_total_mes: "green",
  pagos_pendientes: "amber",
  pagos_vencidos: "red",
  sesiones_activas: "slate",
  sesiones_hoy: "cyan",
  usuarios_unicos_hoy: "indigo",
  tiempo_promedio_sesion: "violet",
  estudiantes_activos: "teal",
  estudiantes_nuevos_mes: "lime",
  programas_activos: "orange",
  cursos_programados: "fuchsia",
  cursos_asignados: "rose",
  total_estudiantes: "sky",
  tareas_atrasadas: "red",
  alertas_alumno_nuevo: "red",
  alertas_expiradas: "orange",
  prospectos_en_aprobacion: "purple",
};
