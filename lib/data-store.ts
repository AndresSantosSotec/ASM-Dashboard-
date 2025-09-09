/**
 * In-memory data store to simulate kardex_pagos database table
 * In a real application, this would be replaced with actual database operations
 */

export interface KardexPago {
  id: string;
  estudianteId: string; // estudiante_programa_id
  bancoNorm: string;
  numeroboletaNorm: string;
  receiptId: string; // banco_norm:numero_boleta_norm
  fileSha256?: string;
  monto: number;
  fechaPago: string;
  fechaRegistro: string;
  estado: 'aprobado' | 'en_revision' | 'rechazado' | 'anulado';
  numeroAutorizacion?: string;
  notas?: string;
}

// In-memory storage (in production this would be a database)
let kardexPagos: KardexPago[] = [
  // Sample data for testing
  {
    id: 'pago-001',
    estudianteId: 'est-001',
    bancoNorm: 'BANCO INDUSTRIAL',
    numeroboletaNorm: 'BI123456',
    receiptId: 'BANCO INDUSTRIAL:BI123456',
    fileSha256: 'abc123def456789',
    monto: 1400,
    fechaPago: '2025-02-15',
    fechaRegistro: '2025-02-15T10:30:00Z',
    estado: 'aprobado',
    numeroAutorizacion: 'AUTH-001'
  },
  {
    id: 'pago-002',
    estudianteId: 'est-002',
    bancoNorm: 'BANRURAL',
    numeroboletaNorm: 'BR654321',
    receiptId: 'BANRURAL:BR654321',
    fileSha256: 'xyz789abc123def',
    monto: 1400,
    fechaPago: '2025-02-20',
    fechaRegistro: '2025-02-20T14:15:00Z',
    estado: 'en_revision'
  }
];

export class PaymentDataStore {
  /**
   * Check if a receipt ID (banco_norm:numero_boleta_norm) already exists
   */
  static findByReceiptId(receiptId: string): KardexPago | null {
    return kardexPagos.find(pago => pago.receiptId === receiptId) || null;
  }

  /**
   * Check if a file hash already exists for the same student
   */
  static findByFileHashAndStudent(fileSha256: string, estudianteId: string): KardexPago | null {
    return kardexPagos.find(
      pago => pago.fileSha256 === fileSha256 && pago.estudianteId === estudianteId
    ) || null;
  }

  /**
   * Create a new payment record
   */
  static create(pago: Omit<KardexPago, 'id' | 'fechaRegistro'>): KardexPago {
    const newPago: KardexPago = {
      ...pago,
      id: `pago-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      fechaRegistro: new Date().toISOString()
    };
    
    kardexPagos.push(newPago);
    return newPago;
  }

  /**
   * Get all payments for a student
   */
  static findByStudentId(estudianteId: string): KardexPago[] {
    return kardexPagos.filter(pago => pago.estudianteId === estudianteId);
  }

  /**
   * Check for any kind of duplicate (receipt ID or file hash)
   */
  static checkForDuplicates(
    receiptId: string,
    fileSha256: string,
    estudianteId: string
  ): {
    receiptDuplicate?: KardexPago;
    fileDuplicate?: KardexPago;
    isDuplicate: boolean;
  } {
    const receiptDuplicate = this.findByReceiptId(receiptId);
    const fileDuplicate = this.findByFileHashAndStudent(fileSha256, estudianteId);
    
    return {
      receiptDuplicate: receiptDuplicate || undefined,
      fileDuplicate: fileDuplicate || undefined,
      isDuplicate: !!(receiptDuplicate || fileDuplicate)
    };
  }

  /**
   * Get payment statistics (for testing/debugging)
   */
  static getStats() {
    return {
      total: kardexPagos.length,
      byStatus: {
        aprobado: kardexPagos.filter(p => p.estado === 'aprobado').length,
        en_revision: kardexPagos.filter(p => p.estado === 'en_revision').length,
        rechazado: kardexPagos.filter(p => p.estado === 'rechazado').length,
        anulado: kardexPagos.filter(p => p.estado === 'anulado').length,
      }
    };
  }
}