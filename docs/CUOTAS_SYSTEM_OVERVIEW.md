# Sistema de Cuotas: Visión General y Flujos

## Tabla de Contenidos

1. [Modelo de Datos](#modelo-de-datos)
2. [Flujo Normal de Inscripción](#flujo-normal-de-inscripción)
3. [Flujo de Importación de Kardex (Actual)](#flujo-de-importación-de-kardex-actual)
4. [Flujo de Importación Mejorado (Propuesto)](#flujo-de-importación-mejorado-propuesto)
5. [Casos de Uso](#casos-de-uso)

## Modelo de Datos

### Diagrama de Relaciones

```
┌─────────────────────┐
│     prospectos      │
│──────────────────── │
│ • id (PK)           │
│ • nombre            │
│ • carnet            │ ◄────┐
│ • email             │      │
│ • created_at        │      │
└─────────────────────┘      │
                             │
                             │ 1:N
                             │
┌─────────────────────────────┐
│   estudiante_programa       │
│─────────────────────────────│
│ • id (PK)                   │
│ • prospecto_id (FK)         │
│ • programa_id (FK)          │ ◄────┐
│ • convenio_id (FK, opt)     │      │
│ • fecha_inicio              │      │
│ • estado (activo/inactivo)  │      │
└─────────────────────────────┘      │
         ▲                            │ 1:N
         │ 1:N                        │
         │                            │
┌────────┴───────────────────┐  ┌────┴──────────────┐
│ cuotas_programa_estudiante │  │  kardex_pagos     │
│────────────────────────────│  │───────────────────│
│ • id (PK)                  │  │ • id (PK)         │
│ • estudiante_programa_id   │  │ • estudiante_     │
│ • numero_cuota             │  │   programa_id (FK)│
│ • fecha_vencimiento        │  │ • cuota_id (FK)   │ ◄─── ⚠️ Puede ser NULL
│ • monto                    │  │   [NULLABLE]      │
│ • estado                   │  │ • numero_boleta   │
│   (pendiente/pagado/...)   │  │ • monto           │
│ • monto_pagado             │  │ • fecha_pago      │
└────────────────────────────┘  │ • banco           │
         ▲                       └───────────────────┘
         │ N:1
         │
         └──────────┐
                    │
         ┌──────────┴──────────┐
         │   pagos_estudiante   │ (Pagos normales desde frontend)
         │─────────────────────│
         │ • id (PK)           │
         │ • cuota_id (FK)     │
         │ • numero_boleta     │
         │ • monto_pagado      │
         │ • fecha_pago        │
         │ • estado_pago       │
         │ • comprobante (FILE)│
         └─────────────────────┘
```

### Descripción de Entidades

#### 1. `prospectos`
- Representa un estudiante registrado en el sistema
- **Carnet**: Identificador único del estudiante (ej: AMS2020126)
- Creado durante el proceso de inscripción

#### 2. `estudiante_programa`
- Relaciona un estudiante con un programa académico específico
- Un estudiante puede estar inscrito en múltiples programas (1:N)
- Contiene fecha de inicio del programa para el estudiante
- Puede tener un convenio corporativo asociado

#### 3. `cuotas_programa_estudiante`
- Plan de pagos generado para cada `estudiante_programa`
- **Se genera automáticamente** al finalizar inscripción
- Cada cuota representa un pago mensual
- Estados: `pendiente`, `pagado`, `parcialmente_pagada`, `vencido`

#### 4. `kardex_pagos`
- Registra pagos **históricos importados desde Excel**
- NO se crean desde el frontend
- Idealmente deben asociarse a una cuota, pero puede ser NULL si:
  - No existen cuotas para ese estudiante_programa
  - No se puede determinar a qué cuota pertenece el pago

#### 5. `pagos_estudiante`
- Registra pagos **actuales desde el frontend**
- Siempre debe tener un `cuota_id` válido
- Incluye comprobante subido por el estudiante

## Flujo Normal de Inscripción

### Paso a Paso

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND: Usuario completa formulario de inscripción        │
│    Componente: /components/inscripcion/registration-form.tsx   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. POST /api/inscripciones/finalizar                           │
│    Datos: personales, laborales, académicos, financieros       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. BACKEND: Crear/Actualizar prospecto                         │
│    Retorna: prospecto_id, programas[]                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. BACKEND: Crear estudiante_programa por cada programa        │
│    Relaciona: prospecto ← → programa                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. FRONTEND: Por cada programa creado                          │
│    POST /api/plan-pagos/generar                                │
│    Params: { estudiante_programa_id }                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. BACKEND: Generar cuotas automáticamente                     │
│    • Lee programa.meses (ej: 18)                               │
│    • Lee programa.cuota_mensual (ej: 1400)                     │
│    • Crea 18 cuotas con fecha_vencimiento escalonada           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ✅ RESULTADO: Estudiante inscrito con plan de pagos completo   │
│    • 1 registro en prospectos                                  │
│    • N registros en estudiante_programa (uno por programa)     │
│    • M*N cuotas en cuotas_programa_estudiante                  │
│      (donde M = meses de duración)                             │
└─────────────────────────────────────────────────────────────────┘
```

### Ejemplo Concreto

**Estudiante**: Marta Julia de León Bolaños  
**Carnet**: AMS2020126  
**Programa**: MBA (Master of Business Administration)  
**Duración**: 18 meses  
**Cuota mensual**: Q1,400.00  
**Fecha inicio**: 2020-08-01  

**Resultado en BD**:

```sql
-- prospectos
INSERT INTO prospectos (id, nombre, carnet) VALUES (1, 'Marta Julia de León Bolaños', 'AMS2020126');

-- estudiante_programa
INSERT INTO estudiante_programa (id, prospecto_id, programa_id, fecha_inicio, estado)
VALUES (1, 1, 1, '2020-08-01', 'activo');

-- cuotas_programa_estudiante (18 cuotas)
INSERT INTO cuotas_programa_estudiante (...) VALUES
  (1, 1, 1, '2020-09-05', 1400, 'pendiente'),  -- Cuota 1: Sep 2020
  (2, 1, 2, '2020-10-05', 1400, 'pendiente'),  -- Cuota 2: Oct 2020
  (3, 1, 3, '2020-11-05', 1400, 'pendiente'),  -- Cuota 3: Nov 2020
  -- ... hasta cuota 18
  (18, 1, 18, '2022-02-05', 1400, 'pendiente'); -- Cuota 18: Feb 2022
```

## Flujo de Importación de Kardex (Actual)

### Problema: Estudiantes sin Cuotas

```
┌────────────────────────────────────────────────────────────────┐
│ 1. ADMIN: Sube archivo Excel con pagos históricos             │
│    POST /api/importar-pagos-kardex                            │
│    Archivo: pagos_normalizados_optimizado.xlsx (27,020 filas) │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. BACKEND: Leer y parsear Excel                              │
│    Agrupar pagos por carnet                                    │
│    Total estudiantes: 2,712                                    │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. Por cada estudiante (carnet):                              │
│                                                                │
│    PASO 1: Buscar prospecto por carnet                        │
│    ├─ ✅ Encontrado → continuar                               │
│    └─ ❌ No encontrado → saltar estudiante                    │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│    PASO 2: Buscar programas del estudiante                    │
│    ├─ ✅ Encontrado(s) → continuar                            │
│    └─ ❌ No encontrado → saltar estudiante                    │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│    PASO 3: Obtener detalles de programas                      │
│    ✅ Siempre exitoso si PASO 2 OK                            │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│    PASO 4: Buscar cuotas del programa                         │
│    ├─ ✅ Encontradas → procesar pagos                         │
│    └─ ❌ NO ENCONTRADAS → ⚠️ PROBLEMA                         │
│         • Crear kardex_pagos con cuota_id = NULL              │
│         • Log warning                                          │
│         • Pagos quedan "huérfanos"                            │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│ ❌ RESULTADO PROBLEMÁTICO:                                     │
│    • Pagos registrados en kardex_pagos                        │
│    • cuota_id = NULL (sin asociación)                         │
│    • No se actualizan estados de cuotas (porque no existen)   │
│    • Reportes incompletos                                      │
└────────────────────────────────────────────────────────────────┘
```

### Logs del Problema Real

```log
[2025-10-02 22:36:36] local.INFO: === 👤 PROCESANDO ESTUDIANTE AMS2020126 ===
[2025-10-02 22:36:36] local.INFO: ✅ PASO 1 EXITOSO: Prospecto encontrado
[2025-10-02 22:36:36] local.INFO: ✅ PASO 2 EXITOSO: Programas encontrados
[2025-10-02 22:36:36] local.INFO: ✅ PASO 3 EXITOSO: Programas obtenidos
[2025-10-02 22:36:36] local.WARNING: ❌ PASO 4: No hay cuotas para este programa
[2025-10-02 22:36:36] local.INFO: ✅ Kardex creado exitosamente 
{"kardex_id":1673,"cuota_id":"SIN CUOTA"}
[2025-10-02 22:36:36] local.INFO: ⏭️ Saltando actualización de cuota (no se asignó cuota)
```

## Flujo de Importación Mejorado (Propuesto)

### Solución: Auto-Generación de Cuotas

```
┌────────────────────────────────────────────────────────────────┐
│ 1. ADMIN: Sube archivo Excel con pagos históricos             │
│    POST /api/importar-pagos-kardex                            │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. BACKEND: Leer y parsear Excel                              │
│    Agrupar pagos por carnet                                    │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. Por cada estudiante (carnet):                              │
│                                                                │
│    PASO 1-3: Igual que antes (buscar prospecto y programas)   │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│    PASO 4 MEJORADO: Verificar cuotas del programa             │
│    ├─ ✅ Encontradas → continuar con pagos                    │
│    └─ ❌ NO ENCONTRADAS → ⭐ NUEVA LÓGICA                     │
└────────────────────────────────────────────────────────────────┘
                           │ (NO ENCONTRADAS)
                           ▼
┌────────────────────────────────────────────────────────────────┐
│    PASO 4.1: Obtener información del programa                 │
│    • programa.cuota_mensual                                    │
│    • programa.meses (duración)                                 │
│    • convenio.cuota_mensual (si aplica)                       │
│    • estudiante_programa.fecha_inicio                          │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│    PASO 4.2: Generar cuotas automáticamente                   │
│    LLAMAR: generarCuotasAutomaticamente()                      │
│    • Crear N cuotas (N = meses del programa)                  │
│    • Fecha vencimiento escalonada desde fecha_inicio          │
│    • Monto según programa o convenio                           │
│    • Estado inicial: 'pendiente'                              │
│    📝 LOG: "✅ Cuotas generadas automáticamente"              │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│    PASO 4.3: Recargar cuotas desde BD                         │
│    • Ahora SÍ existen cuotas                                  │
│    • Continuar con procesamiento normal                        │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│    PASO 5: Procesar pagos y asociar a cuotas                  │
│    • Por cada pago del Excel:                                  │
│      - Buscar cuota correspondiente (por fecha/monto)         │
│      - Crear kardex_pagos con cuota_id válido                 │
│      - Actualizar estado de la cuota                           │
│      - Actualizar monto_pagado de la cuota                     │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│ ✅ RESULTADO MEJORADO:                                         │
│    • Pagos registrados en kardex_pagos CON cuota_id           │
│    • Cuotas actualizadas con estado y monto_pagado            │
│    • Reportes completos y precisos                             │
│    • Integridad de datos mantenida                             │
└────────────────────────────────────────────────────────────────┘
```

### Logs del Flujo Mejorado (Esperado)

```log
[2025-10-02 22:36:36] local.INFO: === 👤 PROCESANDO ESTUDIANTE AMS2020126 ===
[2025-10-02 22:36:36] local.INFO: ✅ PASO 1 EXITOSO: Prospecto encontrado
[2025-10-02 22:36:36] local.INFO: ✅ PASO 2 EXITOSO: Programas encontrados
[2025-10-02 22:36:36] local.INFO: ✅ PASO 3 EXITOSO: Programas obtenidos
[2025-10-02 22:36:36] local.WARNING: ⚠️ PASO 4: No hay cuotas, generando automáticamente...
[2025-10-02 22:36:36] local.INFO: 📝 Generando cuotas {"estudiante_programa_id":1,"monto":1400,"meses":18}
[2025-10-02 22:36:36] local.INFO: ✅ Cuotas generadas automáticamente {"total_cuotas":18}
[2025-10-02 22:36:36] local.INFO: 🔍 Buscando cuota para pago (fecha: 2020-08-01, monto: 1400)
[2025-10-02 22:36:36] local.INFO: ✅ Cuota encontrada {"cuota_id":1,"numero_cuota":1}
[2025-10-02 22:36:36] local.INFO: ✅ Kardex creado {"kardex_id":1673,"cuota_id":1}
[2025-10-02 22:36:36] local.INFO: ✅ Cuota actualizada {"cuota_id":1,"estado":"pagado"}
```

## Casos de Uso

### Caso 1: Estudiante Nuevo (Inscripción Normal)

**Situación**: Estudiante se inscribe por primera vez  
**Flujo**: Normal (descrito arriba)  
**Resultado**: Cuotas se crean automáticamente al finalizar inscripción  
**Estado BD**: ✅ Completo desde el inicio

### Caso 2: Estudiante Histórico con Pagos (Sin Cuotas)

**Situación**: Estudiante inscrito hace años, antes del sistema de cuotas  
**Problema**: Tiene registros de pagos en Excel pero sin cuotas en BD  
**Flujo**: Importación de kardex encuentra el problema  
**Solución**: Auto-generar cuotas antes de procesar pagos  
**Estado BD**: ✅ Se completa durante importación

### Caso 3: Estudiante Histórico sin Pagos (Sin Cuotas)

**Situación**: Estudiante inscrito pero nunca pagó  
**Problema**: No tiene cuotas ni pagos  
**Solución**: Ejecutar comando Artisan de migración:
```bash
php artisan cuotas:generar-faltantes
```
**Estado BD**: ✅ Se completa con comando de migración

### Caso 4: Pago Parcial

**Situación**: Estudiante paga menos del monto de la cuota  
**Ejemplo**: Cuota Q1,400 pero paga Q700  
**Lógica**:
- Crear kardex_pagos con monto = 700
- Actualizar cuota.monto_pagado += 700
- Estado cuota = 'parcialmente_pagada'
- Si suma de pagos >= cuota.monto → estado = 'pagado'

### Caso 5: Múltiples Programas

**Situación**: Estudiante inscrito en 2 programas simultáneamente  
**Ejemplo**: 
- MBA (18 meses, Q1,400/mes)
- Diplomado (6 meses, Q600/mes)

**Resultado**:
- 1 prospecto
- 2 estudiante_programa
- 18 + 6 = 24 cuotas totales

**Importación**: Sistema debe asociar cada pago al programa correcto usando:
- Monto (Q1,400 → MBA, Q600 → Diplomado)
- Plan de estudios del Excel
- Fecha de pago

## Resumen de Cambios Necesarios

### Backend (Laravel)

1. ✅ Endpoint existente: `/api/plan-pagos/generar`
2. ⭐ **NUEVO**: Método `generarCuotasAutomaticamente()` en servicio
3. ⭐ **MODIFICAR**: `PaymentHistoryImport` para auto-generar cuotas
4. ⭐ **NUEVO**: Comando Artisan `cuotas:generar-faltantes`
5. ✅ Mejorar logging para auditoría

### Frontend (Next.js)

1. ✅ **OPCIONAL**: Badge para cuotas auto-generadas
2. ✅ **OPCIONAL**: Tooltip explicativo
3. ✅ Componentes existentes siguen funcionando sin cambios

### Base de Datos

1. ✅ Verificar índices en foreign keys
2. ✅ Ejecutar migración para datos históricos
3. ✅ Verificar integridad referencial

---

**Nota**: Este documento describe el estado actual y la solución propuesta. La implementación debe realizarse en el repositorio del backend Laravel (no incluido en este repo de frontend).
