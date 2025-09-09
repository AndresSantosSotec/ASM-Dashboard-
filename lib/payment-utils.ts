import * as crypto from 'crypto';

/**
 * Utility functions for payment and receipt processing
 */

/**
 * Normalizes bank name by converting to uppercase and trimming spaces
 */
export function normalizeBankName(banco: string): string {
  return banco.trim().toUpperCase();
}

/**
 * Normalizes receipt number by converting to uppercase and removing spaces, hyphens, and non-alphanumeric characters
 */
export function normalizeReceiptNumber(numeroboleta: string): string {
  return numeroboleta
    .toUpperCase()
    .replace(/[\s\-]/g, '') // Remove spaces and hyphens
    .replace(/[^A-Z0-9]/g, ''); // Keep only alphanumeric characters
}

/**
 * Generates SHA-256 hash from file buffer
 */
export function generateFileHash(fileBuffer: Buffer): string {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Creates a unique receipt identifier from normalized bank and receipt number
 */
export function createReceiptId(banco: string, numeroboleta: string): string {
  const bancoNorm = normalizeBankName(banco);
  const numeroboletaNorm = normalizeReceiptNumber(numeroboleta);
  return `${bancoNorm}:${numeroboletaNorm}`;
}

/**
 * Validation helpers
 */
export function validateReceiptData(data: {
  banco: string;
  numeroboleta: string;
  monto: number;
  estudianteId: string;
}) {
  const errors: string[] = [];
  
  if (!data.banco || data.banco.trim() === '') {
    errors.push('Banco es requerido');
  }
  
  if (!data.numeroboleta || data.numeroboleta.trim() === '') {
    errors.push('Número de boleta es requerido');
  }
  
  if (!data.monto || data.monto <= 0) {
    errors.push('Monto debe ser mayor a 0');
  }
  
  if (!data.estudianteId || data.estudianteId.trim() === '') {
    errors.push('ID de estudiante es requerido');
  }
  
  return errors;
}

/**
 * Error messages for different duplicate scenarios
 */
export function getDuplicateErrorMessage(
  scenario: 'same_student' | 'other_student' | 'same_file',
  data?: { fecha?: string; estado?: string }
): string {
  switch (scenario) {
    case 'same_student':
      return `Esta boleta ya fue registrada por usted el ${data?.fecha || 'fecha anterior'} (estado: ${data?.estado || 'pendiente'}).`;
    case 'other_student':
      return 'Esta boleta ya fue utilizada por otro estudiante.';
    case 'same_file':
      return 'Este comprobante ya fue cargado previamente.';
    default:
      return 'Esta boleta ya existe en el sistema.';
  }
}