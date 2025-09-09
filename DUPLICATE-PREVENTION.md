# Duplicate Bank Receipt Prevention System

## Overview

This system implements comprehensive duplicate prevention for bank receipt uploads in the ASM Dashboard, ensuring no student can register duplicate payments using the same bank receipt or file.

## Features Implemented

### ✅ Normalization
- **Bank names**: Converted to uppercase, trimmed of spaces
- **Receipt numbers**: Uppercase, spaces and hyphens removed, only alphanumeric characters kept
- **Example**: "banco INDUSTRIAL " + "BI-123 456" becomes "BANCO INDUSTRIAL:BI123456"

### ✅ Global Uniqueness
- Receipt combinations (bank + number) are globally unique across ALL students
- No exceptions based on payment status (approved, rejected, under review, cancelled)

### ✅ File Deduplication
- SHA-256 hashing prevents same student from uploading identical files
- Detected even if receipt number is different

### ✅ Preflight Verification
- `GET /api/estudiante/pagos/boletas/verify` endpoint for checking availability before upload
- Frontend integration with real-time verification

### ✅ Clear Error Messaging
- **Same student duplicate**: "Esta boleta ya fue registrada por usted el {fecha} (estado: {estado})."
- **Other student duplicate**: "Esta boleta ya fue utilizada por otro estudiante."
- **Same file duplicate**: "Este comprobante ya fue cargado previamente."

## API Endpoints

### GET /api/estudiante/pagos/boletas/verify
Preflight verification to check if a bank receipt is available for use.

**Parameters:**
- `banco` (string): Bank name
- `numero_boleta` (string): Receipt number

**Response Examples:**

Available receipt:
```json
{
  "success": true,
  "exists": false,
  "duplicate": false,
  "message": "Esta boleta está disponible para uso.",
  "data": {
    "bancoNorm": "BANCO INDUSTRIAL",
    "numeroboletaNorm": "NEW12345"
  }
}
```

Duplicate receipt:
```json
{
  "success": false,
  "exists": true,
  "duplicate": true,
  "message": "Esta boleta ya fue utilizada por otro estudiante.",
  "data": {
    "bancoNorm": "BANCO INDUSTRIAL",
    "numeroboletaNorm": "BI123456",
    "fechaRegistro": "2025-02-15T10:30:00Z",
    "estado": "aprobado"
  }
}
```

### POST /api/estudiante/pagos/subir-recibo
Upload payment receipt with comprehensive duplicate prevention.

**Form Data:**
- `banco` (string): Bank name
- `numero_boleta` (string): Receipt number  
- `monto` (number): Payment amount
- `fecha_pago` (string): Payment date
- `estudiante_id` (string): Student ID
- `comprobante` (file): Receipt file (JPG, PNG, PDF, max 5MB)
- `numero_autorizacion` (string, optional): Authorization number
- `notas` (string, optional): Additional notes

**Success Response:**
```json
{
  "success": true,
  "message": "Comprobante de pago registrado exitosamente. Pendiente de conciliación.",
  "payment": {
    "id": "pago-1757443444873-5evjw29",
    "receiptId": "BANCO INDUSTRIAL:BI123456",
    "monto": 1500,
    "fechaPago": "2025-01-20",
    "fechaRegistro": "2025-01-20T15:30:00Z",
    "estado": "en_revision"
  }
}
```

**Error Responses:**

Receipt duplicate (other student):
```json
{
  "success": false,
  "error": "Boleta duplicada",
  "message": "Esta boleta ya fue utilizada por otro estudiante.",
  "duplicate_type": "other_student"
}
```

Same student duplicate:
```json
{
  "success": false,
  "error": "Boleta duplicada",
  "message": "Esta boleta ya fue registrada por usted el 2025-01-15 (estado: aprobado).",
  "duplicate_type": "same_student",
  "existing_payment": {
    "id": "pago-123",
    "fecha": "2025-01-15T10:30:00Z",
    "estado": "aprobado",
    "monto": 1500
  }
}
```

File duplicate:
```json
{
  "success": false,
  "error": "Archivo duplicado",
  "message": "Este comprobante ya fue cargado previamente.",
  "duplicate_type": "same_file",
  "existing_payment": {
    "id": "pago-456",
    "fecha": "2025-01-15T10:30:00Z",
    "estado": "en_revision"
  }
}
```

## Frontend Integration

### Updated Components

#### 1. `components/finanzas/subir-boleta.tsx`
- Added preflight verification with real-time checking
- Verification button with loading states
- Color-coded verification results (success/error/warning)
- File validation (size, type)
- Enhanced error handling and user feedback

#### 2. `components/estudiantes/payments-view.tsx`
- Integrated verification workflow in payment upload dialog
- Same validation and error handling as admin interface
- Consistent user experience across roles

### User Experience Flow

1. **User enters bank and receipt number**
2. **Automatic verification** (or manual verify button click)
3. **Real-time feedback** with color-coded alerts
4. **File upload** only enabled if verification passes
5. **Upload validation** with comprehensive duplicate checking
6. **Clear error messages** for any duplicate scenario

## Data Store Implementation

### PaymentDataStore Class
Simulates the `kardex_pagos` database table with the following methods:

- `findByReceiptId(receiptId)`: Check if receipt ID exists
- `findByFileHashAndStudent(fileSha256, estudianteId)`: Check file duplicates
- `checkForDuplicates(receiptId, fileSha256, estudianteId)`: Comprehensive duplicate check
- `create(payment)`: Create new payment record

### Sample Data Structure
```javascript
{
  id: 'pago-001',
  estudianteId: 'est-001',
  bancoNorm: 'BANCO INDUSTRIAL',
  numeroboletaNorm: 'BI123456',
  receiptId: 'BANCO INDUSTRIAL:BI123456',
  fileSha256: 'abc123def456789...',
  monto: 1400,
  fechaPago: '2025-02-15',
  fechaRegistro: '2025-02-15T10:30:00Z',
  estado: 'aprobado',
  numeroAutorizacion: 'AUTH-001'
}
```

## Security Considerations

1. **No sensitive data exposure**: Verification endpoint doesn't reveal student information
2. **File validation**: Size limits (5MB) and type restrictions
3. **Input sanitization**: All inputs are validated and normalized
4. **Hash-based file detection**: SHA-256 ensures reliable duplicate detection

## Testing

### Manual Testing Scenarios

1. **New receipt upload**: Should succeed
2. **Duplicate receipt (same student)**: Should fail with specific message
3. **Duplicate receipt (different student)**: Should fail with generic message  
4. **Same file upload**: Should fail with file duplicate message
5. **Normalization**: Different formatting should be detected as same receipt
6. **Preflight verification**: Should work for both available and duplicate receipts

### Test Commands

```bash
# Test verification endpoint
curl "http://localhost:3000/api/estudiante/pagos/boletas/verify?banco=Banco%20Industrial&numero_boleta=BI123456"

# Test upload endpoint
curl -X POST "http://localhost:3000/api/estudiante/pagos/subir-recibo" \
  -F "banco=Test Bank" \
  -F "numero_boleta=TEST12345" \
  -F "monto=1500" \
  -F "fecha_pago=2025-01-20" \
  -F "estudiante_id=test-student-001" \
  -F "comprobante=@test-file.txt"
```

## Future Enhancements

1. **Whitelist for retry**: Allow specific rejection reasons for re-upload
2. **Database integration**: Replace in-memory store with actual database
3. **File storage**: Integrate with cloud storage service
4. **Audit logging**: Track all duplicate attempts
5. **Admin override**: Allow admins to handle edge cases
6. **Performance optimization**: Add caching for frequent verifications

## Production Deployment Notes

1. Replace `PaymentDataStore` with actual database operations
2. Implement proper file storage (AWS S3, etc.)
3. Add comprehensive logging and monitoring
4. Set up proper error alerting
5. Consider rate limiting for verification endpoint
6. Implement proper authentication and authorization