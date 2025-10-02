# Backend API Requirements for Kardex Sin Cuotas Feature

This document describes the backend API endpoints that need to be implemented to support the new "Kardex sin Cuotas" frontend feature.

## Problem Statement

The backend import process (ImportarPagosKardex) is storing payments in `kardex_pagos` table without linking them to `cuotas_programa_estudiante` because students don't have cuotas defined. This creates orphaned payment records that need to be managed.

## Required API Endpoints

### 1. Get Kardex Payments Without Cuotas
**Endpoint:** `GET /api/kardex-pagos/sin-cuotas`

**Purpose:** Retrieve all kardex_pagos records where `cuota_id` is NULL

**Response Format:**
```json
{
  "data": [
    {
      "id": 949,
      "estudiante_programa_id": 1,
      "numero_boleta": "1410721",
      "monto": 1400.00,
      "fecha_pago": "2020-08-01",
      "banco": "No especificado",
      "cuota_id": null,
      "estudiante_programa": {
        "id": 1,
        "prospecto": {
          "carnet": "AMS2020126",
          "nombre_completo": "Marta Julia de León Bolaños"
        },
        "programa": {
          "nombre_del_programa": "Master of Business Administration"
        }
      }
    }
  ]
}
```

**Implementation Hint:**
```php
public function getKardexSinCuotas()
{
    $kardex = KardexPagos::with([
        'estudiantePrograma.prospecto',
        'estudiantePrograma.programa'
    ])
    ->whereNull('cuota_id')
    ->orderBy('fecha_pago', 'desc')
    ->get();

    return response()->json(['data' => $kardex]);
}
```

### 2. Get Available Cuotas for Student Program
**Endpoint:** `GET /api/estudiante-programa/{estudianteProgramaId}/cuotas-disponibles`

**Purpose:** Get cuotas that exist for a student program (for linking)

**Query Parameters:**
- `estado` (optional): Filter by cuota status (default: 'pendiente')

**Response Format:**
```json
{
  "data": [
    {
      "id": 1,
      "numero_cuota": 1,
      "monto": 1400.00,
      "fecha_vencimiento": "2020-08-15",
      "estado": "pendiente"
    }
  ]
}
```

### 3. Create Cuotas for Student Program
**Endpoint:** `POST /api/estudiante-programa/{estudianteProgramaId}/cuotas`

**Purpose:** Bulk create cuotas for a student program

**Request Body:**
```json
{
  "numero_cuotas": 9,
  "monto_cuota": 1400.00,
  "fecha_inicio": "2020-08-01"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Se crearon 9 cuotas exitosamente",
  "data": [
    {
      "id": 1,
      "numero_cuota": 1,
      "monto": 1400.00,
      "fecha_vencimiento": "2020-08-15"
    }
  ]
}
```

**Implementation Hint:**
```php
public function createCuotas(Request $request, $estudianteProgramaId)
{
    $validated = $request->validate([
        'numero_cuotas' => 'required|integer|min:1|max:50',
        'monto_cuota' => 'required|numeric|min:0',
        'fecha_inicio' => 'required|date'
    ]);

    $cuotas = [];
    $fechaInicio = Carbon::parse($validated['fecha_inicio']);

    for ($i = 1; $i <= $validated['numero_cuotas']; $i++) {
        $cuota = CuotasProgramaEstudiante::create([
            'estudiante_programa_id' => $estudianteProgramaId,
            'numero_cuota' => $i,
            'monto' => $validated['monto_cuota'],
            'fecha_vencimiento' => $fechaInicio->copy()->addMonths($i - 1)->endOfMonth(),
            'estado' => 'pendiente'
        ]);
        $cuotas[] = $cuota;
    }

    return response()->json([
        'success' => true,
        'message' => "Se crearon {$validated['numero_cuotas']} cuotas exitosamente",
        'data' => $cuotas
    ]);
}
```

### 4. Link Kardex Payment to Cuota
**Endpoint:** `PATCH /api/kardex-pagos/{kardexId}/link-cuota`

**Purpose:** Link an existing kardex payment to a cuota

**Request Body:**
```json
{
  "cuota_id": 1
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Pago vinculado exitosamente a la cuota",
  "data": {
    "kardex_id": 949,
    "cuota_id": 1,
    "cuota": {
      "id": 1,
      "numero_cuota": 1,
      "monto": 1400.00,
      "estado": "pagado"
    }
  }
}
```

**Implementation Hint:**
```php
public function linkToCuota(Request $request, $kardexId)
{
    $validated = $request->validate([
        'cuota_id' => 'required|exists:cuotas_programa_estudiante,id'
    ]);

    $kardex = KardexPagos::findOrFail($kardexId);
    $cuota = CuotasProgramaEstudiante::findOrFail($validated['cuota_id']);

    // Verify they belong to the same student program
    if ($kardex->estudiante_programa_id !== $cuota->estudiante_programa_id) {
        return response()->json([
            'success' => false,
            'message' => 'El pago y la cuota no pertenecen al mismo estudiante'
        ], 422);
    }

    DB::transaction(function () use ($kardex, $cuota, $validated) {
        // Link kardex to cuota
        $kardex->update(['cuota_id' => $validated['cuota_id']]);

        // Update cuota status if payment amount matches
        if (abs($kardex->monto - $cuota->monto) < 0.01) {
            $cuota->update([
                'estado' => 'pagado',
                'fecha_pago' => $kardex->fecha_pago
            ]);
        }
    });

    return response()->json([
        'success' => true,
        'message' => 'Pago vinculado exitosamente a la cuota',
        'data' => [
            'kardex_id' => $kardex->id,
            'cuota_id' => $cuota->id,
            'cuota' => $cuota->fresh()
        ]
    ]);
}
```

## Route Registration

Add these routes to your Laravel API routes file:

```php
// In routes/api.php
Route::middleware(['auth:sanctum'])->group(function () {
    // Kardex sin cuotas
    Route::get('/kardex-pagos/sin-cuotas', [KardexPagosController::class, 'getKardexSinCuotas']);
    Route::patch('/kardex-pagos/{kardexId}/link-cuota', [KardexPagosController::class, 'linkToCuota']);
    
    // Cuotas management
    Route::get('/estudiante-programa/{estudianteProgramaId}/cuotas-disponibles', [CuotasController::class, 'getCuotasDisponibles']);
    Route::post('/estudiante-programa/{estudianteProgramaId}/cuotas', [CuotasController::class, 'createCuotas']);
});
```

## Recommendations for Import Process

To prevent this issue in the future, modify the ImportarPagosKardex process:

1. **Create cuotas automatically if they don't exist** - When a student program is found but has no cuotas, automatically create them based on the payment history
2. **Use a flag to track auto-created cuotas** - Add a field like `auto_created` to distinguish between manually and automatically created cuotas
3. **Implement a reconciliation queue** - Store payments that couldn't be linked in a separate table for later processing
4. **Add validation warnings** - Log warnings (not errors) when cuotas don't exist, but still save the payment

## Testing

Test each endpoint with:
- Valid data
- Missing required fields
- Invalid IDs
- Cross-student program linking attempts
- Edge cases (zero amounts, past dates, etc.)
