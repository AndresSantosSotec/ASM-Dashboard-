export interface DashboardFinancieroData {
  resumen: {
    ingresosMensuales: number
    ingresosMesAnterior: number
    tasaMorosidad: number
    tasaMorosidadAnterior: number
    recaudacionPendiente: number
    recaudacionPendienteAnterior: number
    estudiantesActivos: number
    estudiantesActivosAnterior: number
    estudiantesActivosDetalle?: Array<{
      carnet: string
      nombre_completo: string
      correo?: string
      telefono?: string
      city?: string
      estado_cuenta: string
      total_matriculaciones: number
      primera_matricula?: string
      deuda_calculada?: {
        cuota_mensual: number
        inscripcion: number
        cursos_activos: number
        programas_activos: string[]
        detalle_calculo: string
        errores?: string[]
      }
    }>
  }
  pagosRecientes: Array<{
    id: number
    estudiante: string
    concepto: string
    fecha: string
    monto: number
    metodo_pago: string
  }>
  alertasMorosidad: Array<{
    id: number
    estudiante: string
    programa: string
    diasVencidos: number
    montoOriginal: number
    montoVencido: number
    montoMora: number
    fecha_vencimiento: string
    serviciosBloqueados: string[]
  }>
  morosidadPorPrograma: Array<{
    programa: string
    total_estudiantes: number
    estudiantes_morosos: number
    porcentaje: number
    monto_total_vencido: number
  }>
  tendenciaIngresos: Array<{
    mes: string
    mes_nombre: string
    ingresos: number
  }>
  configuracionMora: {
    regla_activa: string
    porcentaje_mora: number
    dias_gracia: number
    reglas_bloqueo: Array<{
      dias_despues_vencimiento: number
      servicios_afectados: string[]
      descripcion: string
    }>
  } | null
}