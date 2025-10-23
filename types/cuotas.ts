// types/cuotas.ts

export interface CuotaDashboardSummary {
  estudiantes_activos: number;
  saldo_estimado: number;
  en_mora: number;
  planes_reestructurados: number;
}

export interface Prospecto {
  id: number;
  nombre: string;
  carnet: string;
  correo: string;
  telefono: string;
}

export interface Programa {
  id: number;
  nombre: string;
}

export interface Cuota {
  id: number;
  numero_cuota: number;
  fecha_vencimiento: string;
  monto: number;
  estado: 'pagado' | 'pendiente' | 'vencido';
  paid_at: string | null;
}

export interface ProximaCuota {
  id: number;
  numero_cuota: number;
  fecha_vencimiento: string;
  monto: number;
  estado: string;
}

export interface EstudianteCuotas {
  estudiante_programa_id: number;
  prospecto: Prospecto;
  programa: Programa;
  saldo_pendiente: number;
  cuotas_pendientes: number;
  cuotas_pagadas: number;
  proxima_cuota: ProximaCuota | null;
  cuotas: Cuota[];
}

export interface CuotasDashboardFilters {
  prospecto_id: number | null;
  programa_id: number | null;
  search: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  limit: number;
}

export interface CuotasDashboardResponse {
  timestamp: string;
  filters: CuotasDashboardFilters;
  summary: CuotaDashboardSummary;
  estudiantes: EstudianteCuotas[];
}
