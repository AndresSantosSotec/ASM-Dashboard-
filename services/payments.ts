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

// 🔥 NUEVA INTERFAZ PARA LA RESPUESTA DEL PAGO
export interface PaymentUploadResponse {
  message: string
  pago_id: number
  cuota_id?: number
  estado_cuota?: string
  estado_pago?: string
  fecha_procesamiento?: string
  success?: boolean
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

  async uploadReceipt(data: UploadReceiptData): Promise<PaymentUploadResponse> {
    const formData = new FormData()
    formData.append('cuota_id', data.cuota_id.toString())
    formData.append('numero_boleta', data.numero_boleta)
    formData.append('banco', data.banco)
    formData.append('monto', data.monto.toString())
    formData.append('comprobante', data.comprobante)

    const response = await api.post('/estudiante/pagos/subir-recibo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  // 🔥 NUEVO MÉTODO PARA REFRESCAR DATOS DE FORMA FORZADA
  async refreshAllData() {
    // Agregar timestamp para evitar cache
    const timestamp = Date.now()
    const [pending, history, summary] = await Promise.all([
      api.get(`/estudiante/pagos/pendientes?_t=${timestamp}`),
      api.get(`/estudiante/pagos/historial?_t=${timestamp}`),
      api.get(`/estudiante/pagos/estado-cuenta?_t=${timestamp}`)
    ])
    
    return {
      pending: pending.data,
      history: history.data,
      summary: summary.data
    }
  }
}

export const paymentsService = new PaymentsService()