import api from '@/services/api'

export interface PendingPayment {
  id: number
  numero_cuota: number
  fecha_vencimiento: string
  monto: number
  estado: string
  estudiante_programa: {
    programa: {
      nombre_del_programa: string
    }
  }
  // Campos opcionales que puede enviar el backend (mora/urgencia)
  is_overdue?: boolean
  months_overdue?: number
  late_fee_total?: number
  total_with_late_fee?: number
  urgent?: boolean
}

export interface PaymentHistory {
  id: number
  fecha_pago: string
  monto_pagado: number
  metodo_pago: string
  numero_boleta?: string
  banco?: string
  estado_pago: string
  cuota?: {
    numero_cuota: number
  }
  estudiante_programa: {
    programa: {
      nombre_del_programa: string
    }
  }
}

export interface AccountSummary {
  cuotas: any[]
  resumen: {
    total_cuotas: number
    cuotas_pagadas: number
    cuotas_pendientes: number
    cuotas_en_revision: number
    monto_total: number
    monto_pagado: number
    monto_pendiente: number
  }
}

export interface UploadReceiptData {
  cuota_id: number
  numero_boleta: string
  banco: string
  monto: number
  comprobante: File
}

export interface PaymentUploadResponse {
  success: boolean
  code: string
  message: string
  pago_id?: number
  cuota_id?: number
  estado_cuota?: string
  estado_pago?: string
  fecha_procesamiento?: string
  error_details?: {
    tipo_error: string
    boleta_original?: {
      numero_boleta: string
      banco: string
      fecha_uso: string
      monto_original: number
      estado: string
      cuota_numero: string
      programa: string
    }
    archivo_original?: {
      fecha_uso: string
      boleta_numero: string
      monto_original: number
    }
  }
  user_message?: string
}

export interface PrevalidationResponse {
  duplicate: boolean
  existing_payment?: {
    fecha_pago: string
    monto_pagado: number
    estado_pago: string
    cuota_numero: string
    programa: string
  }
}

class PaymentsService {
  async getPendingPayments() {
    const response = await api.get('/estudiante/pagos/pendientes')
    return response.data
  }

  async getPaymentHistory() {
    const response = await api.get('/estudiante/pagos/historial')
    return response.data
  }

  async getAccountStatement() {
    const response = await api.get('/estudiante/pagos/estado-cuenta')
    return response.data
  }

  async prevalidateReceipt(numero_boleta: string, banco: string): Promise<PrevalidationResponse> {
    const response = await api.post('/estudiante/pagos/prevalidar-recibo', {
      numero_boleta,
      banco
    })
    return response.data
  }

  async uploadReceipt(data: UploadReceiptData): Promise<PaymentUploadResponse> {
    const formData = new FormData()
    formData.append('cuota_id', data.cuota_id.toString())
    formData.append('numero_boleta', data.numero_boleta)
    formData.append('banco', data.banco)
    formData.append('monto', data.monto.toString())
    formData.append('comprobante', data.comprobante)

    try {
      const response = await api.post('/estudiante/pagos/subir-recibo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    } catch (error: any) {
      // Manejar errores específicos del servidor
      if (error.response?.data) {
        // El servidor devolvió una respuesta estructurada
        throw new PaymentError(error.response.data)
      }
      // Error genérico
      throw error
    }
  }

  async refreshAllData() {
    const timestamp = Date.now()
    const [pending, history, summary] = await Promise.all([
      api.get(`/estudiante/pagos/pendientes?_t=${timestamp}`),
      api.get(`/estudiante/pagos/historial?_t=${timestamp}`),
      api.get(`/estudiante/pagos/estado-cuenta?_t=${timestamp}`)
    ])
    return { pending: pending.data, history: history.data, summary: summary.data }
  }
}

// Error personalizado para pagos
export class PaymentError extends Error {
  public code: string
  public details?: any
  public userMessage?: string
  public isRecoverable: boolean

  constructor(errorData: PaymentUploadResponse) {
    super(errorData.message || 'Error en el pago')
    this.name = 'PaymentError'
    this.code = errorData.code || 'UNKNOWN_ERROR'
    this.details = errorData.error_details
    this.userMessage = errorData.user_message
    
    // Categorizar si el error es recuperable (no crítico)
    // Errores recuperables: problemas con un pago específico que no afectan otros
    this.isRecoverable = this.categorizeError(this.code)
  }

  private categorizeError(code: string): boolean {
    const recoverableErrors = [
      'CUOTA_NOT_FOUND',           // Cuota no encontrada - skip y continuar
      'CUOTA_ALREADY_PAID',        // Cuota ya pagada - skip
      'DUPLICATE_RECEIPT_NUMBER',  // Boleta duplicada - skip
      'DUPLICATE_RECEIPT_FILE',    // Archivo duplicado - skip
      'INVALID_AMOUNT',            // Monto inválido - skip
      'STUDENT_NOT_FOUND',         // Estudiante no encontrado - skip
    ]
    return recoverableErrors.includes(code)
  }
}

export const paymentsService = new PaymentsService()