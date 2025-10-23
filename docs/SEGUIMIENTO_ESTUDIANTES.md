# Seguimiento de Estudiantes - Gestión de Cuotas

## Descripción
Este módulo permite gestionar las cuotas de pago de cada estudiante matriculado en el sistema. Proporciona una interfaz completa para crear, editar, eliminar y visualizar cuotas de manera individual o masiva.

## Ubicación
**Ruta:** `/finanzas/seguimiento-estudiantes`

## Características Principales

### 1. Vista General de Estudiantes
- **Tabla resumen** con los siguientes datos por estudiante:
  - Nombre y carnet
  - Programa inscrito
  - Saldo pendiente
  - Número de cuotas pendientes
  - Número de cuotas pagadas
  - Próxima cuota a vencer (fecha y monto)
- **Búsqueda** por nombre, carnet o programa
- **Actualización automática** de datos después de cada operación

### 2. Modal de Cuotas por Estudiante
Al hacer clic en "Ver Cuotas" de un estudiante, se abre un modal que muestra:

#### Métricas Resumen
- Saldo pendiente total
- Número de cuotas pendientes
- Número de cuotas pagadas

#### Tabla de Cuotas
Muestra todas las cuotas del estudiante con:
- Número de cuota
- Fecha de vencimiento
- Monto
- Estado (Pendiente, Pagado, Vencido, Cancelado)
- Fecha de pago (si aplica)
- Botones de acción (Editar/Eliminar)

**Nota:** Las cuotas con estado "Pagado" no pueden ser editadas ni eliminadas.

### 3. Operaciones CRUD

#### Crear Nueva Cuota
**Campos:**
- Número de cuota (autocalculado)
- Fecha de vencimiento
- Monto
- Estado (Pendiente, Vencido, Cancelado)
- Observaciones (opcional)

**Validaciones:**
- Todos los campos obligatorios deben completarse
- El monto debe ser mayor a 0
- La fecha de vencimiento debe ser válida

#### Editar Cuota
**Permite modificar:**
- Número de cuota
- Fecha de vencimiento
- Monto
- Estado (puede cambiarse a Pagado)

**Restricciones:**
- Solo se pueden editar cuotas con estado diferente a "Pagado"

#### Eliminar Cuota
**Proceso:**
1. Se muestra un diálogo de confirmación
2. Al confirmar, la cuota se elimina permanentemente
3. La vista se actualiza automáticamente

**Restricciones:**
- No se pueden eliminar cuotas con estado "Pagado"
- El backend valida que no existan pagos aplicados

### 4. Generación Masiva de Cuotas

Esta función permite crear múltiples cuotas automáticamente.

**Configuración:**
- **Fecha de inicio:** Primera fecha de vencimiento
- **Número de cuotas:** Cantidad de cuotas a generar (1-100)
- **Monto por cuota:** Valor de cada cuota
- **Intervalo entre cuotas (días):** Espaciado temporal
  - 30 días = Cuotas mensuales
  - 15 días = Cuotas quincenales
  - 7 días = Cuotas semanales

**Ejemplo:**
- Fecha inicio: 2025-01-15
- Número de cuotas: 10
- Monto por cuota: Q500.00
- Intervalo: 30 días

**Resultado:** Se crearán 10 cuotas de Q500.00 con vencimientos:
- Cuota 1: 2025-01-15
- Cuota 2: 2025-02-14
- Cuota 3: 2025-03-16
- ... hasta la cuota 10

## Códigos de Color (Estados)

| Estado | Color | Descripción |
|--------|-------|-------------|
| **Pendiente** | Amarillo | Cuota por pagar |
| **Pagado** | Verde | Cuota ya pagada |
| **Vencido** | Rojo | Cuota no pagada después de la fecha de vencimiento |
| **Cancelado** | Gris | Cuota anulada |

## API Endpoints Utilizados

### GET `/api/mantenimientos/cuotas/dashboard`
Obtiene la lista de estudiantes con sus cuotas y métricas.

**Parámetros:**
- `limit`: Número máximo de registros (por defecto: 200)
- `prospecto_id`: Filtrar por estudiante específico
- `programa_id`: Filtrar por programa

### POST `/api/mantenimientos/cuotas`
Crea una nueva cuota.

**Payload:**
```json
{
  "estudiante_programa_id": 123,
  "numero_cuota": 1,
  "fecha_vencimiento": "2025-01-15",
  "monto": 500.00,
  "estado": "pendiente",
  "observaciones": "Pago inicial"
}
```

### PUT `/api/mantenimientos/cuotas/{id}`
Actualiza una cuota existente.

**Payload:**
```json
{
  "numero_cuota": 1,
  "fecha_vencimiento": "2025-01-20",
  "monto": 550.00,
  "estado": "pagado",
  "paid_at": "2025-01-18"
}
```

### DELETE `/api/mantenimientos/cuotas/{id}`
Elimina una cuota.

**Validaciones backend:**
- No se puede eliminar si tiene pagos aplicados
- Solo cuotas con estado diferente a "Pagado"

## Notificaciones

El sistema utiliza toast notifications para informar sobre:
- ✅ Operaciones exitosas (crear, editar, eliminar)
- ❌ Errores de validación
- ❌ Errores del servidor

## Flujo de Trabajo Recomendado

### Inscripción de Nuevo Estudiante
1. El estudiante se inscribe al programa
2. En "Seguimiento de Estudiantes", buscar al estudiante
3. Hacer clic en "Ver Cuotas"
4. Usar "Generar Múltiples" para crear el plan de pagos completo
5. Configurar:
   - Fecha inicio: Primera cuota
   - Número de cuotas: Según plan (ej. 10 meses)
   - Monto: Costo mensual del programa
   - Intervalo: 30 días

### Gestión Individual de Cuotas
1. Buscar estudiante en la tabla principal
2. Hacer clic en "Ver Cuotas"
3. Para agregar una cuota adicional: "Nueva Cuota"
4. Para modificar fecha o monto: Botón "Editar"
5. Para cancelar una cuota: Cambiar estado a "Cancelado"

### Marcar Cuota como Pagada
1. Ir al modal de cuotas del estudiante
2. Hacer clic en "Editar" en la cuota correspondiente
3. Cambiar estado a "Pagado"
4. (Opcional) Agregar fecha de pago
5. Guardar cambios

**Nota:** Es recomendable registrar el pago en el módulo de Kardex y que el sistema actualice automáticamente el estado de la cuota.

## Seguridad y Permisos

- Requiere autenticación con token Bearer (Sanctum)
- Solo usuarios con permisos de finanzas pueden acceder
- Todas las operaciones se auditan con:
  - `created_by`: Usuario que creó la cuota
  - `updated_by`: Usuario que modificó la cuota
  - `deleted_by`: Usuario que eliminó la cuota

## Integración con Otros Módulos

### Kardex de Pagos
Cuando se registra un pago en el Kardex, el sistema:
1. Busca la cuota asociada
2. Actualiza el estado a "Pagado"
3. Registra la fecha de pago (`paid_at`)
4. Actualiza el saldo pendiente

### Conciliación Bancaria
Al conciliar un pago:
1. Se vincula con el registro de Kardex
2. La cuota se marca como pagada
3. Se actualiza el saldo del estudiante

## Tips y Mejores Prácticas

✅ **Generar plan completo al inicio:** Use la generación masiva para crear todas las cuotas del programa desde el principio.

✅ **Revisar próximas cuotas:** La columna "Próxima Cuota" en la tabla principal ayuda a identificar estudiantes con pagos próximos a vencer.

✅ **No eliminar cuotas pagadas:** El sistema previene esto, pero es importante mantener el historial completo.

✅ **Usar observaciones:** Agregue notas en cuotas especiales (descuentos, becas, ajustes).

✅ **Filtrar por búsqueda:** Use la barra de búsqueda para encontrar rápidamente estudiantes específicos.

## Solución de Problemas

### Error: "No se puede eliminar la cuota"
**Causa:** La cuota tiene pagos aplicados en el Kardex.
**Solución:** Cancelar o eliminar primero los pagos asociados.

### Error: "Error al crear la cuota"
**Causa:** Validación fallida (datos incompletos o inválidos).
**Solución:** Verificar que todos los campos requeridos estén completos y con valores válidos.

### La lista no se actualiza después de crear cuotas
**Causa:** Error en la recarga de datos.
**Solución:** Refrescar manualmente la página o verificar la conexión al servidor.

## Archivos Relacionados

- **Componente:** `/components/finanzas/seguimiento-estudiantes.tsx`
- **Página:** `/app/finanzas/seguimiento-estudiantes/page.tsx`
- **Servicio:** `/services/mantenimientos.ts`
- **API Backend:** `/api/mantenimientos/cuotas/*`

## Próximas Mejoras Sugeridas

- [ ] Exportar plan de cuotas a Excel/PDF
- [ ] Envío automático de recordatorios de pago
- [ ] Gráficas de evolución de pagos
- [ ] Filtros avanzados (rango de fechas, estado, programa)
- [ ] Vista de calendario con cuotas por vencer
- [ ] Notificaciones en tiempo real de pagos recibidos
- [ ] Integración con WhatsApp para recordatorios
