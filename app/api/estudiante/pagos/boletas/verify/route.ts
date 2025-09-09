import { NextRequest, NextResponse } from 'next/server';
import { normalizeBankName, normalizeReceiptNumber, createReceiptId, getDuplicateErrorMessage } from '@/lib/payment-utils';
import { PaymentDataStore } from '@/lib/data-store';

/**
 * GET /api/estudiante/pagos/boletas/verify
 * Preflight verification to check if a bank receipt already exists
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const banco = searchParams.get('banco');
    const numeroboleta = searchParams.get('numero_boleta');

    // Validate required parameters
    if (!banco || !numeroboleta) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parámetros requeridos: banco y numero_boleta'
        },
        { status: 400 }
      );
    }

    // Normalize the data
    const bancoNorm = normalizeBankName(banco);
    const numeroboletaNorm = normalizeReceiptNumber(numeroboleta);
    const receiptId = createReceiptId(banco, numeroboleta);

    // Check if receipt already exists
    const existingReceipt = PaymentDataStore.findByReceiptId(receiptId);

    if (existingReceipt) {
      // Receipt exists - return information without exposing sensitive data
      return NextResponse.json({
        success: false,
        exists: true,
        duplicate: true,
        message: 'Esta boleta ya fue utilizada por otro estudiante.',
        data: {
          bancoNorm,
          numeroboletaNorm,
          fechaRegistro: existingReceipt.fechaRegistro,
          estado: existingReceipt.estado
          // Note: Not exposing estudianteId or other sensitive information
        }
      });
    }

    // Receipt is available
    return NextResponse.json({
      success: true,
      exists: false,
      duplicate: false,
      message: 'Esta boleta está disponible para uso.',
      data: {
        bancoNorm,
        numeroboletaNorm
      }
    });

  } catch (error) {
    console.error('Error in boletas verification:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al verificar la boleta'
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}