# Especificación: Auto-Creación de Cuotas Durante Importación de Kardex

## Análisis del Problema

### Estado Actual

Según los logs del backend Laravel, durante la importación del archivo Excel de pagos históricos (kardex):

1. **PASO 1**: Se busca el prospecto por carnet ✅ (Exitoso)
2. **PASO 2**: Se buscan los programas del estudiante ✅ (Exitoso)
3. **PASO 3**: Se obtienen detalles de programas activos ✅ (Exitoso)
4. **PASO 4**: Se buscan las cuotas del programa ❌ **FALLA** - No existen cuotas

```log
[2025-10-02 22:36:36] local.WARNING: ❌ PASO 4: No hay cuotas para este programa 
{"estudiante_programa_id":1,"problema":"No existen cuotas en cuotas_programa_estudiante 
para este estudiante_programa_id"}
```

**Consecuencia**: Los pagos se registran en `kardex_pagos` pero sin asociarse a ninguna cuota:
```log
{"kardex_id":1673,"estudiante_programa_id":1,"cuota_id":"SIN CUOTA",...}
```

### Raíz del Problema

Los estudiantes históricos fueron importados ANTES de que existiera el sistema de cuotas automáticas. Por lo tanto:

- Existen registros en `prospectos` ✅
- Existen registros en `estudiante_programa` ✅
- NO existen registros en `cuotas_programa_estudiante` ❌

## Estructura de Datos (Frontend Context)

### 1. Entidad: `estudiante_programa`

Representa la inscripción de un estudiante a un programa académico específico.

**Relaciones**:
- `prospecto_id` → Tabla `prospectos`
- `programa_id` → Tabla `programas`

**Estados**: `activo` o `inactivo`

### 2. Entidad: `cuotas_programa_estudiante`

Representa el plan de pagos mensual de un estudiante para un programa específico.

**Campos clave**:
- `estudiante_programa_id` → FK a `estudiante_programa`
- `numero_cuota` → Número secuencial (1, 2, 3...)
- `fecha_vencimiento` → Fecha límite de pago
- `monto` → Monto de la cuota mensual
- `estado` → `pendiente`, `pagado`, `vencido`, etc.

**Lógica de creación normal**: Se crean automáticamente al finalizar una inscripción mediante:

```typescript
// components/inscripcion/registration-form.tsx líneas 114-118
for (const programa of estudianteProgramas) {
  await axios.post(`${API_BASE_URL}/api/plan-pagos/generar`, {
    estudiante_programa_id: programa.id,
  });
}
```

### 3. Entidad: `kardex_pagos`

Registra los pagos históricos importados desde Excel.

**Campos clave**:
- `estudiante_programa_id` → FK a `estudiante_programa`
- `cuota_id` → FK OPCIONAL a `cuotas_programa_estudiante` (puede ser NULL)
- `numero_boleta` → Número de comprobante
- `monto` → Monto pagado
- `fecha_pago` → Fecha del pago
- `banco` → Banco donde se realizó el pago

## Solución Propuesta: Auto-Creación de Cuotas

### Requisitos Funcionales

1. **Detección Automática**: Durante la importación, si un `estudiante_programa_id` no tiene cuotas, el sistema debe:
   - Detectarlo automáticamente
   - Generar las cuotas faltantes ANTES de procesar los pagos

2. **Generación de Cuotas Históricas**: 
   - **Fuente de datos**: Obtener el monto de cuota mensual y duración del programa desde:
     - Tabla `programas` → campos `cuota_mensual` y `meses`
     - O desde datos del convenio si el estudiante tiene uno
   
   - **Fechas de vencimiento**: Calcular basado en:
     - `fecha_inicio` del `estudiante_programa`
     - Generar una cuota por cada mes de duración del programa
     - Establecer día de vencimiento según regla general (ej: día 5 de cada mes)

3. **Asociación Inteligente de Pagos**: 
   - Una vez creadas las cuotas, asociar cada pago del kardex a la cuota correspondiente usando:
     - Fecha de pago
     - Monto
     - Orden cronológico

### Algoritmo de Implementación (Backend Laravel)

```php
// Pseudocódigo para PaymentHistoryImport.php

protected function procesarEstudiante($carnet, $pagos) {
    // Pasos existentes 1-3: buscar prospecto y programas
    $prospecto = $this->buscarProspecto($carnet);
    $programas = $this->buscarProgramas($prospecto->id);
    
    foreach ($programas as $estudiantePrograma) {
        // PASO 4 MEJORADO: Verificar y crear cuotas si no existen
        $cuotas = CuotaProgramaEstudiante::where(
            'estudiante_programa_id', 
            $estudiantePrograma->id
        )->get();
        
        if ($cuotas->isEmpty()) {
            Log::warning("⚠️ No hay cuotas para este programa, generando automáticamente...", [
                'estudiante_programa_id' => $estudiantePrograma->id
            ]);
            
            // NUEVO: Llamar al generador de plan de pagos
            $this->generarCuotasAutomaticamente($estudiantePrograma);
            
            // Recargar cuotas después de crearlas
            $cuotas = CuotaProgramaEstudiante::where(
                'estudiante_programa_id', 
                $estudiantePrograma->id
            )->get();
            
            Log::info("✅ Cuotas generadas automáticamente", [
                'estudiante_programa_id' => $estudiantePrograma->id,
                'total_cuotas' => $cuotas->count()
            ]);
        }
        
        // Continuar con el procesamiento normal de pagos
        $this->procesarPagos($estudiantePrograma, $pagos, $cuotas);
    }
}

protected function generarCuotasAutomaticamente($estudiantePrograma) {
    // Obtener datos del programa
    $programa = $estudiantePrograma->programa;
    $convenio = $estudiantePrograma->convenio; // Si existe
    
    // Determinar monto y duración
    $montoCuota = $convenio?->cuota_mensual ?? $programa->cuota_mensual;
    $duracionMeses = $convenio?->meses ?? $programa->meses;
    $fechaInicio = Carbon::parse($estudiantePrograma->fecha_inicio);
    
    // Obtener día de vencimiento de regla general
    $diaVencimiento = PaymentRule::current()?->due_day ?? 5;
    
    // Generar cuotas
    for ($i = 1; $i <= $duracionMeses; $i++) {
        $fechaVencimiento = $fechaInicio->copy()
            ->addMonths($i - 1)
            ->day($diaVencimiento);
        
        CuotaProgramaEstudiante::create([
            'estudiante_programa_id' => $estudiantePrograma->id,
            'numero_cuota' => $i,
            'fecha_vencimiento' => $fechaVencimiento,
            'monto' => $montoCuota,
            'estado' => 'pendiente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
    
    Log::info("📝 Cuotas creadas", [
        'estudiante_programa_id' => $estudiantePrograma->id,
        'cantidad' => $duracionMeses,
        'monto_cuota' => $montoCuota
    ]);
}
```

### Flujo Mejorado de Importación

```
1. Leer archivo Excel ✅
2. Por cada estudiante:
   a. Buscar prospecto por carnet ✅
   b. Obtener programas del estudiante ✅
   c. Por cada programa:
      - Verificar si existen cuotas
      - **SI NO EXISTEN**: Generar cuotas automáticamente ⭐ NUEVO
      - Recargar lista de cuotas
   d. Procesar pagos y asociarlos a cuotas ✅
3. Guardar log de resultados ✅
```

## Consideraciones Especiales

### 1. Programas con Convenios

Si un `estudiante_programa` tiene un `convenio_id`:
- Usar `convenio.cuota_mensual` en lugar de `programa.cuota_mensual`
- Usar `convenio.meses` en lugar de `programa.meses`
- Aplicar descuentos o condiciones especiales del convenio

### 2. Fecha de Inicio

Si `estudiante_programa.fecha_inicio` es NULL:
- Usar la fecha del primer pago como referencia
- O usar `prospecto.created_at`
- Log warning para revisión manual

### 3. Cuotas Parciales vs Completas

El sistema debe permitir pagos parciales:
- Si un pago es menor al monto de la cuota, marcar cuota como `parcialmente_pagada`
- Acumular pagos parciales hasta completar el monto
- Campo adicional: `monto_pagado` para tracking

### 4. Migración de Datos Existentes

Para estudiantes ya inscritos sin cuotas:

```sql
-- Identificar estudiantes sin cuotas
SELECT ep.id, ep.prospecto_id, p.nombre_del_programa, ep.fecha_inicio
FROM estudiante_programa ep
LEFT JOIN cuotas_programa_estudiante cpe ON cpe.estudiante_programa_id = ep.id
INNER JOIN programas p ON p.id = ep.programa_id
WHERE cpe.id IS NULL
AND ep.estado = 'activo';

-- Ejecutar generación en batch
-- Usar comando Artisan: php artisan cuotas:generar-faltantes
```

## Endpoints API Afectados

### Backend Laravel (a implementar/modificar)

1. **POST** `/api/importar-pagos-kardex`
   - Modificar para incluir auto-creación de cuotas
   - Añadir campo en respuesta: `cuotas_generadas: number`

2. **POST** `/api/plan-pagos/generar`
   - Ya existe (usado en inscripciones)
   - Debe ser idempotente (no duplicar si ya existen cuotas)
   - Retornar error claro si falta información

3. **GET** `/api/estudiante-programa/{id}/cuotas`
   - Ya existe (usado en frontend)
   - Sin cambios necesarios

### Frontend Next.js

No requiere cambios inmediatos, pero se recomienda:

1. **Indicador visual** en componente de pagos si cuotas fueron auto-generadas:

```typescript
// services/payments.ts
export interface PendingPayment {
  id: number
  numero_cuota: number
  fecha_vencimiento: string
  monto: number
  estado: string
  auto_generated?: boolean // NUEVO campo opcional
  // ... resto de campos
}
```

2. **Mensaje informativo** en UI:

```tsx
{payment.auto_generated && (
  <Badge variant="secondary" className="ml-2">
    <Info className="w-3 h-3 mr-1" />
    Cuota generada automáticamente
  </Badge>
)}
```

## Validación y Testing

### Tests Unitarios (Backend)

1. **Test: Generación de cuotas para programa sin cuotas**
```php
public function test_genera_cuotas_cuando_no_existen()
{
    $estudiantePrograma = EstudiantePrograma::factory()->create([
        'fecha_inicio' => '2020-08-01',
    ]);
    
    $this->assertCount(0, $estudiantePrograma->cuotas);
    
    $service = new PlanPagosService();
    $service->generarCuotasAutomaticamente($estudiantePrograma);
    
    $estudiantePrograma->refresh();
    $this->assertGreaterThan(0, $estudiantePrograma->cuotas->count());
}
```

2. **Test: No duplicar cuotas existentes**
```php
public function test_no_duplica_cuotas_existentes()
{
    $estudiantePrograma = EstudiantePrograma::factory()
        ->has(CuotaProgramaEstudiante::factory()->count(12))
        ->create();
    
    $countAntes = $estudiantePrograma->cuotas->count();
    
    $service = new PlanPagosService();
    $service->generarCuotasAutomaticamente($estudiantePrograma);
    
    $estudiantePrograma->refresh();
    $this->assertEquals($countAntes, $estudiantePrograma->cuotas->count());
}
```

### Tests de Integración

1. **Test: Importación completa con auto-creación**
   - Importar archivo Excel con estudiantes sin cuotas
   - Verificar que se crean cuotas automáticamente
   - Verificar que pagos se asocian correctamente

2. **Test: Performance con datasets grandes**
   - Importar 1000+ registros
   - Medir tiempo de procesamiento
   - Verificar que no hay errores de memoria

## Checklist de Implementación

### Backend Laravel

- [ ] Crear método `generarCuotasAutomaticamente()` en `PlanPagosService`
- [ ] Modificar `PaymentHistoryImport` para detectar cuotas faltantes
- [ ] Añadir llamada a generación automática en PASO 4
- [ ] Hacer `plan-pagos/generar` idempotente
- [ ] Añadir logs informativos de cuotas generadas
- [ ] Crear comando Artisan: `cuotas:generar-faltantes` para migración
- [ ] Añadir tests unitarios
- [ ] Añadir tests de integración
- [ ] Actualizar documentación de API

### Frontend Next.js (Opcional/Recomendado)

- [ ] Añadir campo `auto_generated` al tipo `PendingPayment`
- [ ] Añadir badge visual en componente de pagos
- [ ] Actualizar documentación del componente
- [ ] Añadir tooltip explicativo

### Base de Datos

- [ ] Verificar integridad de foreign keys
- [ ] Añadir índices si es necesario:
  - `cuotas_programa_estudiante.estudiante_programa_id`
  - `kardex_pagos.estudiante_programa_id`
  - `kardex_pagos.cuota_id`
- [ ] Ejecutar migración de datos históricos

## Monitoreo y Logs

### Logs Requeridos

1. **Antes de generar cuotas**:
```
⚠️ No hay cuotas para este programa, generando automáticamente...
{estudiante_programa_id, prospecto_id, programa_nombre}
```

2. **Después de generar cuotas**:
```
✅ Cuotas generadas automáticamente
{estudiante_programa_id, total_cuotas, monto_cuota, fecha_primera_cuota, fecha_ultima_cuota}
```

3. **Resumen al finalizar importación**:
```
📊 RESUMEN DE IMPORTACIÓN
{
  total_estudiantes: 2712,
  estudiantes_procesados: 2711,
  estudiantes_con_error: 1,
  cuotas_generadas_automaticamente: 350,
  pagos_procesados: 27020,
  pagos_con_cuota: 26670,
  pagos_sin_cuota: 350
}
```

## Referencias

### Archivos del Proyecto

- **Frontend**: 
  - `/components/inscripcion/registration-form.tsx` - Flujo normal de inscripción
  - `/services/payments.ts` - Servicio de pagos
  - `/services/finance.ts` - Endpoints financieros

- **Backend** (no en este repo):
  - `app/Imports/PaymentHistoryImport.php` - Importador de kardex
  - `app/Services/PlanPagosService.php` - Generador de planes de pago
  - `app/Models/CuotaProgramaEstudiante.php` - Modelo de cuotas

### Endpoints API Relevantes

```
POST   /api/inscripciones/finalizar
POST   /api/plan-pagos/generar
GET    /api/estudiante-programa/{id}/cuotas
GET    /api/prospectos/{id}/cuotas
POST   /api/importar-pagos-kardex (TO BE MODIFIED)
POST   /api/estudiante/pagos/subir-recibo
GET    /api/estudiante/pagos/pendientes
GET    /api/estudiante/pagos/historial
GET    /api/estudiante/pagos/estado-cuenta
```

## Conclusión

La auto-creación de cuotas durante la importación de kardex es esencial para:

1. **Completar datos históricos** de estudiantes antiguos
2. **Asociar pagos correctamente** a sus cuotas correspondientes
3. **Mantener integridad** en el sistema financiero
4. **Facilitar reportes** y estados de cuenta precisos

La implementación debe ser **robusta**, **idempotente** y con **logging detallado** para permitir auditoría y debugging.
