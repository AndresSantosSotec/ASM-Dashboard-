/**
 * 💰 SERVICIO DE MÉTRICAS FINANCIERAS
 * 
 * Integración completa con backend Laravel:
 * - Métricas de recaudación en tiempo real
 * - Estado financiero por estudiante
 * - Validación de pagos
 * - Gestión de caché
 * 
 * Base URL: /api/dashboard/financial
 * Formato estándar: {ok: boolean, data: mixed, warnings: string[], errors: string[]}
 */

import { api } from './api';

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

/**
 * ✅ Formato de respuesta estándar del backend
 * MODO SEMI ESTRICTO: todas las respuestas incluyen ok, data, warnings, errors
 */
export interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  warnings: string[];
  errors: string[];
}

export interface FinancialMetricsParams {
  mes?: number;
  anio?: number;
  programa_id?: number;
  auditoria?: boolean;
}

export interface ProgramaDesglose {
  programa_id: number;
  nombre_programa: string;
  cuota_base: number;
  cursos_moodle: number;
  cuota_real: number;
  total_pagado: number;
  estado: EstadoFinanciero;
  mora: number;
  saldo_pendiente: number;
}

export interface EstudianteFinanciero {
  carnet: string;
  nombre_completo: string;
  correo: string;
  telefono: string;
  total_deuda: number;
  total_pagado: number;
  mora_total: number;
  estado_general: EstadoFinanciero;
  programas: ProgramaDesglose[];
  primera_matricula: string | null;
  total_cursos: number;
}

export interface MetricasRecaudacion {
  mes_actual: number;
  mes_anterior: number;
  variacion_porcentaje: number;
  desglose: {
    efectivo: number;
    transferencia: number;
    tarjeta: number;
    cheque: number;
  };
}

export interface RecaudacionPendiente {
  total: number;
  con_mora: number;
  sin_mora: number;
  estudiantes_morosos: number;
}

export interface DistribucionPagos {
  completos: {
    cantidad: number;
    monto: number;
  };
  parciales: {
    cantidad: number;
    monto: number;
    promedio_abonado: number;
  };
  sin_pago: {
    cantidad: number;
    monto_esperado: number;
  };
  anticipados: {
    cantidad: number;
    monto: number;
  };
}

export interface ProgramaMetricas {
  programa_id: number;
  nombre: string;
  abreviatura: string;
  ingresos: number;
  deuda: number;
  estudiantes_activos: number;
  tasa_cobro: number;
}

export interface PaisPagos {
  estudiantes: number;
  ingresos: number;
}

export interface HistorialMensual {
  mes: string;
  recaudado: number;
  esperado: number;
  tasa_cobro: number;
}

export interface FinancialMetrics {
  recaudacion_total: MetricasRecaudacion;
  recaudacion_pendiente: RecaudacionPendiente;
  distribucion_pagos: DistribucionPagos;
  por_programa: ProgramaMetricas[];
  por_pais: Record<string, PaisPagos>;
  historial_mensual: HistorialMensual[];
  metadata: {
    mes_evaluado: number;
    anio_evaluado: number;
    fecha_calculo: string;
    estudiantes_evaluados: number;
    cache_usado: boolean;
  };
  warnings?: string[];
  errors?: string[];
}

export type EstadoFinanciero =
  | 'PAGADO_COMPLETO'
  | 'PAGO_PARCIAL'
  | 'MOROSO'
  | 'MOROSO_CON_ABONO'
  | 'PAGADO_CON_EXCEDENTE'
  | 'SIN_PAGO'
  | 'SIN_CURSOS_ACTIVOS'
  | 'ANTICIPADO_FUTURO'
  | 'ANTICIPADO_SIN_CURSOS';

export interface ValidacionPago {
  valido: boolean;
  error?: string;
  warning?: string;
  requiere_revision?: boolean;
  kardex_original?: number;
  fecha_original?: string;
  detalles?: {
    fingerprint?: string;
    boleta_normalizada?: string;
    banco_normalizado?: string;
    motivo_sospecha?: string[];
  };
}

export interface KardexPagoData {
  estudiante_programa_id: number;
  fecha_pago: string;
  monto_pagado: number;
  metodo_pago: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta';
  numero_boleta?: string;
  banco?: string;
  observaciones?: string;
}

export interface CacheClearResponse {
  success: boolean;
  message: string;
  keys_cleared: string[];
  timestamp: string;
}

// =====================================================
// FUNCIONES DEL SERVICIO
// =====================================================

/**
 * 📊 Obtener métricas financieras completas
 * 
 * Endpoint: GET /api/dashboard/financial/metrics
 * 
 * @param params - Parámetros de filtrado
 * @returns Métricas completas del dashboard
 */
export const getFinancialMetrics = async (
  params: FinancialMetricsParams = {}
): Promise<FinancialMetrics> => {
  const headers: Record<string, string> = {};
  
  // Activar modo auditoría si se solicita
  if (params.auditoria) {
    headers['X-Audit-Mode'] = 'true';
  }

  const response = await api.get<ApiResponse<FinancialMetrics>>(
    '/dashboard/financial/metrics',
    { 
      params: {
        mes: params.mes,
        anio: params.anio,
        programa_id: params.programa_id,
      },
      headers 
    }
  );

  // ✅ Manejar warnings si existen
  if (response.data.warnings && response.data.warnings.length > 0) {
    console.warn('⚠️ Advertencias del backend:', response.data.warnings);
  }

  return response.data.data!;
};

/**
 * 👤 Obtener estado financiero de un estudiante específico
 * 
 * Endpoint: GET /api/dashboard/financial/estudiante/{carnet}
 * 
 * @param carnet - Carnet del estudiante
 * @param mes - Mes a evaluar (opcional)
 * @param anio - Año a evaluar (opcional)
 * @returns Estado financiero detallado
 */
export const getEstudianteFinanciero = async (
  carnet: string,
  mes?: number,
  anio?: number
): Promise<EstudianteFinanciero> => {
  const response = await api.get<ApiResponse<EstudianteFinanciero>>(
    `/dashboard/financial/estudiante/${carnet}`,
    {
      params: { mes, anio }
    }
  );

  // ✅ Manejar warnings
  if (response.data.warnings && response.data.warnings.length > 0) {
    console.warn('⚠️ Advertencias:', response.data.warnings);
  }

  return response.data.data!;
};

/**
 * ✅ Validar un pago antes de guardarlo
 * 
 * Endpoint: POST /api/dashboard/financial/validar-pago
 * 
 * @param kardexData - Datos del pago a validar
 * @returns Resultado de la validación
 */
export const validarPago = async (
  kardexData: KardexPagoData
): Promise<ValidacionPago> => {
  const response = await api.post<ApiResponse<ValidacionPago>>(
    '/dashboard/financial/validar-pago',
    kardexData
  );

  // ✅ Manejar warnings (pagos sospechosos)
  if (response.data.warnings && response.data.warnings.length > 0) {
    console.warn('⚠️ Advertencias de pago:', response.data.warnings);
  }

  return response.data.data!;
};

/**
 * 🗑️ Limpiar caché financiero
 * 
 * Endpoint: POST /api/dashboard/financial/limpiar-cache
 * 
 * @param tipo - Tipo de caché a limpiar (opcional: 'all' | 'estudiantes' | 'metricas')
 * @returns Confirmación de limpieza
 */
export const limpiarCache = async (
  tipo?: 'all' | 'estudiantes' | 'metricas'
): Promise<CacheClearResponse> => {
  const response = await api.post<ApiResponse<CacheClearResponse>>(
    '/dashboard/financial/limpiar-cache',
    { tipo }
  );

  return response.data.data!;
};

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Obtener color por estado financiero
 */
export const getEstadoColor = (estado: EstadoFinanciero): string => {
  const colores: Record<EstadoFinanciero, string> = {
    PAGADO_COMPLETO: 'green',
    PAGO_PARCIAL: 'yellow',
    MOROSO: 'red',
    MOROSO_CON_ABONO: 'orange',
    PAGADO_CON_EXCEDENTE: 'blue',
    SIN_PAGO: 'gray',
    SIN_CURSOS_ACTIVOS: 'gray',
    ANTICIPADO_FUTURO: 'purple',
    ANTICIPADO_SIN_CURSOS: 'cyan',
  };

  return colores[estado] || 'gray';
};

/**
 * Obtener texto descriptivo por estado
 */
export const getEstadoDescripcion = (estado: EstadoFinanciero): string => {
  const descripciones: Record<EstadoFinanciero, string> = {
    PAGADO_COMPLETO: 'Pago completo',
    PAGO_PARCIAL: 'Pago parcial',
    MOROSO: 'Moroso',
    MOROSO_CON_ABONO: 'Moroso con abono',
    PAGADO_CON_EXCEDENTE: 'Pago con excedente',
    SIN_PAGO: 'Sin pago',
    SIN_CURSOS_ACTIVOS: 'Sin cursos activos',
    ANTICIPADO_FUTURO: 'Pago anticipado',
    ANTICIPADO_SIN_CURSOS: 'Pago antes de matrícula',
  };

  return descripciones[estado] || estado;
};

/**
 * Formatear moneda en Quetzales
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
  }).format(amount);
};

/**
 * Obtener mes actual
 */
export const getCurrentMonth = (): number => {
  return new Date().getMonth() + 1;
};

/**
 * Obtener año actual
 */
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

/**
 * Formatear mes-año para display
 */
export const formatMonthYear = (mes: number, anio: number): string => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return `${meses[mes - 1]} ${anio}`;
};

export default {
  getFinancialMetrics,
  getEstudianteFinanciero,
  validarPago,
  limpiarCache,
  getEstadoColor,
  getEstadoDescripcion,
  formatCurrency,
  getCurrentMonth,
  getCurrentYear,
  formatMonthYear,
};
