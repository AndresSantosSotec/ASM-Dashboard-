# Seguimiento de Estudiantes - Dashboard de Cuotas

## Descripción

El componente `SeguimientoEstudiantes` muestra información detallada sobre las cuotas de pago de estudiantes activos, consumiendo el endpoint `/api/mantenimientos/cuotas/dashboard` del backend.

## Ubicación

- **Ruta:** `/finanzas/reportes` (http://localhost:3000/webpanel/finanzas/reportes)
- **Tab:** "Seguimiento Estudiantes" (primera pestaña)
- **Componente:** `components/finanzas/seguimiento-estudiantes.tsx`

## Características Implementadas

### 1. Resumen Ejecutivo (Cards)
Muestra 4 tarjetas con métricas clave:
- **Estudiantes Activos:** Total de estudiantes en el sistema
- **Saldo Pendiente Total:** Suma de todas las cuotas pendientes
- **Cuotas en Mora:** Cantidad de cuotas vencidas
- **Planes Reestructurados:** Cantidad de planes de pago reestructurados

### 2. Tabla de Estudiantes
Tabla con información de cada estudiante:
- Carnet
- Nombre completo
- Programa académico
- Cuotas pagadas y pendientes
- Saldo pendiente
- Información de la próxima cuota
- Botón para ver detalle

### 3. Búsqueda con Debounce
- Input de búsqueda por carnet o nombre
- Debounce de 500ms para optimizar las llamadas a la API
- Búsqueda en tiempo real

### 4. Modal de Detalle
Al hacer clic en "Ver Detalle", se muestra:
- Información del estudiante (nombre, carnet, correo, teléfono)
- Resumen financiero (saldo, cuotas pagadas/pendientes)
- Historial completo de cuotas con estados
- Próxima cuota a vencer

### 5. Formateo de Datos
- **Moneda:** Formato guatemalteco (Q1,234.56)
- **Fechas:** Formato largo en español (15 de enero de 2025)
- **Estados:** Badges con colores según estado:
  - 🟢 **Pagado:** Verde
  - 🔴 **Vencido:** Rojo
  - ⚪ **Pendiente:** Gris outline

## Archivos Creados

### 1. `types/cuotas.ts`
Define todas las interfaces TypeScript para el dashboard:
```typescript
- CuotaDashboardSummary
- Prospecto
- Programa
- Cuota
- ProximaCuota
- EstudianteCuotas
- CuotasDashboardFilters
- CuotasDashboardResponse
```

### 2. `services/mantenimientos.ts`
Servicio para consumir el endpoint:
```typescript
getCuotasDashboard(filters?: CuotasDashboardFilters)
```

### 3. `components/finanzas/seguimiento-estudiantes.tsx`
Componente principal con toda la UI y lógica.

## Archivos Modificados

### 1. `components/finanzas/reportes-financieros.tsx`
- Agregado import del componente `SeguimientoEstudiantes`
- Agregada nueva pestaña "Seguimiento Estudiantes" como primera opción
- Actualizado layout de tabs a grid de 4 columnas

### 2. `services/finance.ts`
- Removida función duplicada `getCuotasByProspecto`

## Endpoint del Backend

### GET `/api/mantenimientos/cuotas/dashboard`

**Parámetros opcionales (Query Params):**
- `limit`: Cantidad de estudiantes (default: 200, max: 500)
- `search`: Búsqueda por carnet o nombre
- `programa_id`: Filtrar por programa
- `prospecto_id`: Filtrar por prospecto

**Headers requeridos:**
```
Authorization: Bearer {TOKEN}
Content-Type: application/json
```

## Uso

1. Navegar a `/finanzas/reportes`
2. Seleccionar la pestaña "Seguimiento Estudiantes"
3. Ver el resumen general en las cards superiores
4. Usar el buscador para filtrar estudiantes
5. Click en "Ver Detalle" para ver el historial completo de cuotas

## Manejo de Errores

El componente maneja los siguientes escenarios:
- **Loading:** Muestra spinner mientras carga
- **Error:** Muestra alerta con el mensaje de error
- **Sin resultados:** Mensaje indicando que no se encontraron estudiantes
- **Próxima cuota null:** Muestra "Sin cuotas pendientes"

## Optimizaciones

- **Debounce en búsqueda:** Reduce llamadas innecesarias a la API
- **Formateo eficiente:** Funciones reutilizables para moneda y fechas
- **Carga condicional:** Solo carga datos cuando cambian los filtros
- **Límite configurable:** Se puede ajustar el límite de registros

## Próximas Mejoras Sugeridas

1. Agregar exportación a Excel/PDF
2. Implementar filtros por programa
3. Agregar ordenamiento de columnas
4. Implementar paginación para más de 200 estudiantes
5. Agregar gráficos de resumen
6. Permitir enviar recordatorios de pago desde el modal

## Notas Técnicas

- El componente usa "use client" para React hooks
- Compatible con Next.js 15
- Usa shadcn/ui components
- Responsive design con Tailwind CSS
- TypeScript para type safety
