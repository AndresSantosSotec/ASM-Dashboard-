import { NextRequest, NextResponse } from 'next/server';
import { 
  normalizeBankName, 
  normalizeReceiptNumber, 
  createReceiptId, 
  generateFileHash,
  validateReceiptData,
  getDuplicateErrorMessage 
} from '@/lib/payment-utils';
import { PaymentDataStore } from '@/lib/data-store';

/**
 * POST /api/estudiante/pagos/subir-recibo
 * Upload payment receipt with duplicate prevention
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const banco = formData.get('banco') as string;
    const numeroboleta = formData.get('numero_boleta') as string;
    const monto = parseFloat(formData.get('monto') as string);
    const estudianteId = formData.get('estudiante_id') as string;
    const fechaPago = formData.get('fecha_pago') as string;
    const numeroAutorizacion = formData.get('numero_autorizacion') as string;
    const notas = formData.get('notas') as string;
    const file = formData.get('comprobante') as File;

    // Validate required fields
    const validationErrors = validateReceiptData({
      banco,
      numeroboleta,
      monto,
      estudianteId
    });

    if (!file) {
      validationErrors.push('Archivo comprobante es requerido');
    }

    if (!fechaPago) {
      validationErrors.push('Fecha de pago es requerida');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Errores de validación',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Normalize receipt data
    const bancoNorm = normalizeBankName(banco);
    const numeroboletaNorm = normalizeReceiptNumber(numeroboleta);
    const receiptId = createReceiptId(banco, numeroboleta);

    // Generate file hash
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileSha256 = generateFileHash(fileBuffer);

    // Validate file size (5MB max)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (fileBuffer.length > maxFileSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'El archivo es demasiado grande. Máximo permitido: 5MB'
        },
        { status: 400 }
      );
    }

    // Check for duplicates (transactional simulation)
    const duplicateCheck = PaymentDataStore.checkForDuplicates(
      receiptId,
      fileSha256,
      estudianteId
    );

    if (duplicateCheck.isDuplicate) {
      if (duplicateCheck.receiptDuplicate) {
        const existingReceipt = duplicateCheck.receiptDuplicate;
        
        // Check if it's the same student or another student
        if (existingReceipt.estudianteId === estudianteId) {
          // Same student trying to use the same receipt again
          const errorMessage = getDuplicateErrorMessage('same_student', {
            fecha: existingReceipt.fechaRegistro.split('T')[0],
            estado: existingReceipt.estado
          });
          
          return NextResponse.json(
            {
              success: false,
              error: 'Boleta duplicada',
              message: errorMessage,
              duplicate_type: 'same_student',
              existing_payment: {
                id: existingReceipt.id,
                fecha: existingReceipt.fechaRegistro,
                estado: existingReceipt.estado,
                monto: existingReceipt.monto
              }
            },
            { status: 409 }
          );
        } else {
          // Different student trying to use an already used receipt
          const errorMessage = getDuplicateErrorMessage('other_student');
          
          return NextResponse.json(
            {
              success: false,
              error: 'Boleta duplicada',
              message: errorMessage,
              duplicate_type: 'other_student'
            },
            { status: 409 }
          );
        }
      }

      if (duplicateCheck.fileDuplicate) {
        // Same file uploaded by the same student
        const errorMessage = getDuplicateErrorMessage('same_file');
        
        return NextResponse.json(
          {
            success: false,
            error: 'Archivo duplicado',
            message: errorMessage,
            duplicate_type: 'same_file',
            existing_payment: {
              id: duplicateCheck.fileDuplicate.id,
              fecha: duplicateCheck.fileDuplicate.fechaRegistro,
              estado: duplicateCheck.fileDuplicate.estado
            }
          },
          { status: 409 }
        );
      }
    }

    // All validations passed - create the payment record
    const newPayment = PaymentDataStore.create({
      estudianteId,
      bancoNorm,
      numeroboletaNorm,
      receiptId,
      fileSha256,
      monto,
      fechaPago,
      estado: 'en_revision', // Default status
      numeroAutorizacion: numeroAutorizacion || undefined,
      notas: notas || undefined
    });

    // In a real application, you would also:
    // 1. Store the file in a secure storage service
    // 2. Update the student's account balance/status
    // 3. Send notifications
    // 4. Log the transaction

    return NextResponse.json({
      success: true,
      message: 'Comprobante de pago registrado exitosamente. Pendiente de conciliación.',
      payment: {
        id: newPayment.id,
        receiptId: newPayment.receiptId,
        monto: newPayment.monto,
        fechaPago: newPayment.fechaPago,
        fechaRegistro: newPayment.fechaRegistro,
        estado: newPayment.estado
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in payment upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al procesar el pago'
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}