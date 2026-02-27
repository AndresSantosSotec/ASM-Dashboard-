"use client";

import React from "react";
import {
  Home,
  LayoutDashboard,
  DollarSign,
  CreditCard,
  GraduationCap,
  Shield,
  Settings,
  BookOpen,
  ClipboardList,
  Users,
  UserCheck,
  BarChart2,
  Folder,
  FileText,
  type LucideIcon,
} from "lucide-react";

const ICON_CLASS = "h-4 w-4";

const ICON_MAP: Record<string, LucideIcon> = {
  inicio: Home,
  home: Home,
  dashboard: LayoutDashboard,
  finanzas: DollarSign,
  pagos: CreditCard,
  creditcard: CreditCard,
  estudiantes: GraduationCap,
  docentes: GraduationCap,
  seguridad: Shield,
  administracion: Settings,
  settings: Settings,
  academico: BookOpen,
  bookopen: BookOpen,
  inscripcion: ClipboardList,
  clipboardlist: ClipboardList,
  prospectos: Users,
  users: Users,
  asesores: UserCheck,
  usercheck: UserCheck,
  reportes: BarChart2,
  barchart: BarChart2,
  filetext: FileText,
};

/**
 * Devuelve el componente de icono para el sidebar según el nombre del módulo o vista.
 * Busca por palabra clave en el nombre (ej: "Finanzas y Pagos" → DollarSign).
 * Si el backend envía campo `orden`, ordenar por él; mientras tanto se usa SIDEBAR_MODULES_MAP.
 */
export function getIcono(nombre: string, className: string = ICON_CLASS): React.ReactNode {
  const key = Object.keys(ICON_MAP).find((k) =>
    (nombre || "").toLowerCase().includes(k)
  );
  const Icon = key ? ICON_MAP[key] : Folder;
  return <Icon className={className} />;
}

/**
 * Para uso con renderizado: devuelve el componente Lucide (para asignar a variable y usar <Icon />).
 */
export function getIconComponent(nombre: string): LucideIcon {
  const key = Object.keys(ICON_MAP).find((k) =>
    (nombre || "").toLowerCase().includes(k)
  );
  return (key ? ICON_MAP[key] : Folder) as LucideIcon;
}
