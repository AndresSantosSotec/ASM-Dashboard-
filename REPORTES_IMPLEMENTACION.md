# 📊 Implementación de Módulo de Reportes

## Resumen Ejecutivo
Se ha implementado un sistema completo de reportes analíticos para el panel de administración, permitiendo visualizar estadísticas de leads, asesores, conversiones e ingresos con filtros avanzados y exportación a Excel.

---

## 🎯 Funcionalidades Implementadas

### 1. **Reporte de Asesores** (`/admin` → Tab "Asesores")
Muestra el rendimiento individual de cada asesor con las siguientes métricas:
- Total de leads asignados
- Leads contactados
- Leads convertidos
- Tasa de conversión (%)
- Total de interacciones realizadas

**Filtros disponibles:**
- Rango de fechas (desde/hasta)
- Asesor específico
- Programa académico

### 2. **Reporte de Leads** (`/admin` → Tab "Leads")
Dashboard con tarjetas estadísticas:
- Total de leads
- Nuevos
- En seguimiento
- Contactados
- Convertidos
- No interesados
- **Tabla de distribución por programa**

**Filtros disponibles:**
- Rango de fechas
- Asesor
- Programa

### 3. **Reporte de Conversiones** (`/admin` → Tab "Conversiones")
Análisis de tasas de cierre:
- Total de prospectos
- Total de convertidos
- Tasa de conversión global (%)
- **Tabla de conversiones por programa** con tasa individual

**Filtros disponibles:**
- Rango de fechas
- Asesor
- Programa

### 4. **Exportación a Excel**
Cada tab incluye un botón "Exportar" que descarga un archivo Excel con los datos filtrados actualmente visibles.

---

## 🗂️ Estructura de Archivos

### **Frontend** (`blue-atlas-dashboard/`)

#### 📄 `components/admin/reports.tsx` (NUEVO)
Componente React principal con:
- 3 tabs (Asesores, Leads, Conversiones)
- Filtros dinámicos (fechas, asesor, programa)
- Tablas con datos en tiempo real
- Estados de carga (skeletons)
- Manejo de errores
- Exportación a Excel

#### 📄 `services/reports.ts` (ACTUALIZADO)
Servicio API con funciones:
- `getAdvisorStats(filters)` → Estadísticas de asesores
- `getLeadStats(filters)` → Estadísticas de leads
- `getConversionStats(filters)` → Estadísticas de conversión
- `getIncomeStats(filters)` → Estadísticas de ingresos (futuro)
- `getPerformanceStats(filters)` → Rendimiento general (futuro)
- `exportReport(reportType, filters)` → Exportar a Excel
- `getAdvisorsForFilter()` → Lista de asesores para dropdown
- `getProgramsForFilter()` → Lista de programas para dropdown

**Interfaces TypeScript:**
```typescript
ReportFilters {
  from?: string
  to?: string
  userId?: number
  programId?: number
}

AdvisorStats {
  advisor_id, advisor_name, total_leads,
  leads_asignados, leads_contactados, 
  leads_convertidos, tasa_conversion,
  interacciones_total
}

LeadStats {
  total, nuevos, en_seguimiento,
  contactados, convertidos, no_interesados,
  por_programa[]
}

ConversionStats {
  total_prospectos, total_convertidos,
  tasa_conversion, por_programa[]
}
```

---

### **Backend** (`blue_atlas_backend/`)

#### 📄 `app/Http/Controllers/Api/ReportsController.php` (ACTUALIZADO)
Métodos agregados:

1. **`advisorStats(Request $request)`**
   - Query con JOIN a `users` y `tb_interacciones`
   - GROUP BY por asesor
   - Calcula tasa de conversión por asesor
   - Filtros: from, to, userId, programId

2. **`leadStats(Request $request)`**
   - Conteo de leads por estado (`status`)
   - Distribución por programa (JOIN con `estudiante_programa`)
   - Filtros: from, to, userId, programId

3. **`conversionStats(Request $request)`**
   - Tasa global de conversión
   - Tasas por programa
   - Filtros: from, to, userId, programId

4. **`incomeStats(Request $request)`**
   - Total de ingresos desde `kardex_pagos`
   - Distribución por programa
   - Filtros: from, to, programId

5. **`performanceStats(Request $request)`**
   - Métricas consolidadas
   - Total leads, convertidos, interacciones

6. **`getAdvisors()`**
   - Lista de usuarios con rol de Asesor/Admin/Coordinador
   - O usuarios que tengan leads asignados

7. **`getPrograms()`**
   - Lista de programas activos

8. **`exportReport(Request $request)`**
   - Reutiliza métodos anteriores
   - Genera archivo Excel usando Maatwebsite\Excel
   - Retorna blob para descarga

#### 📄 `routes/api.php` (ACTUALIZADO)
```php
Route::prefix('reports')->group(function () {
    // Endpoints nuevos
    Route::get('/advisor-stats', [ReportsController::class, 'advisorStats']);
    Route::get('/lead-stats', [ReportsController::class, 'leadStats']);
    Route::get('/conversion-stats', [ReportsController::class, 'conversionStats']);
    Route::get('/income-stats', [ReportsController::class, 'incomeStats']);
    Route::get('/performance-stats', [ReportsController::class, 'performanceStats']);
    Route::get('/advisors', [ReportsController::class, 'getAdvisors']);
    Route::get('/programs', [ReportsController::class, 'getPrograms']);
    Route::post('/export-report', [ReportsController::class, 'exportReport']);
    
    // Endpoints existentes (financieros)
    Route::get('/summary', [ReportsController::class, 'summary']);
    Route::get('/export', [ReportsController::class, 'export']);
});
```

---

## 🗄️ Tablas y Modelos Utilizados

### Tablas PostgreSQL:
1. **`prospectos`** - Tabla principal de leads
   - Campos clave: `id`, `nombre_completo`, `status`, `created_by`, `created_at`
   - Estados: `nuevo`, `asignado`, `contactado`, `seguimiento`, `convertido`, `no_interesado`

2. **`users`** - Asesores y usuarios del sistema
   - Campos: `id`, `name`, `email`, `rol`

3. **`tb_interacciones`** - Registro de interacciones con leads
   - Campos: `id`, `id_lead`, `id_asesor`, `defec_interaccion`, `duracion`, `notas`

4. **`estudiante_programa`** - Relación prospecto-programa
   - Campos: `prospecto_id`, `programa_id`, `fecha_inicio`

5. **`tb_programas`** - Programas académicos
   - Campos: `id`, `nombre_del_programa`, `activo`

6. **`kardex_pagos`** - Registro de pagos
   - Campos: `estudiante_programa_id`, `monto_pagado`, `fecha_pago`

### Modelos Eloquent:
- `App\Models\Prospecto`
- `App\Models\User`
- `App\Models\Interacciones`
- `App\Models\EstudiantePrograma`
- `App\Models\Programa`
- `App\Models\KardexPago`

---

## 📊 Queries SQL Clave

### 1. Estadísticas de Asesores
```sql
SELECT 
  users.id as advisor_id,
  users.name as advisor_name,
  COUNT(DISTINCT prospectos.id) as total_leads,
  COUNT(DISTINCT CASE WHEN prospectos.status IN ('asignado','contactado','seguimiento','convertido') THEN prospectos.id END) as leads_asignados,
  COUNT(DISTINCT CASE WHEN prospectos.status IN ('contactado','seguimiento','convertido') THEN prospectos.id END) as leads_contactados,
  COUNT(DISTINCT CASE WHEN prospectos.status = 'convertido' THEN prospectos.id END) as leads_convertidos,
  COALESCE(COUNT(DISTINCT tb_interacciones.id), 0) as interacciones_total
FROM prospectos
JOIN users ON prospectos.created_by = users.id
LEFT JOIN tb_interacciones ON prospectos.id = tb_interacciones.id_lead
WHERE prospectos.created_at >= ? AND prospectos.created_at <= ?
GROUP BY users.id, users.name
```

### 2. Distribución de Leads por Programa
```sql
SELECT 
  tb_programas.nombre_del_programa as programa,
  COUNT(DISTINCT prospectos.id) as cantidad
FROM prospectos
JOIN estudiante_programa ON prospectos.id = estudiante_programa.prospecto_id
JOIN tb_programas ON estudiante_programa.programa_id = tb_programas.id
WHERE prospectos.created_at >= ? AND prospectos.created_at <= ?
GROUP BY tb_programas.nombre_del_programa
ORDER BY cantidad DESC
```

---

## 🎨 UI/UX Features

### Componentes shadcn/ui utilizados:
- `Card` - Contenedores de secciones
- `Tabs` - Navegación entre reportes
- `Table` - Tablas de datos
- `Select` - Dropdowns de filtros
- `Input` - Campos de fecha
- `Button` - Acciones (exportar, actualizar)
- `Badge` - Indicadores visuales
- `Skeleton` - Estados de carga
- `Alert` - Mensajes de error
- `Loader2` - Spinners

### Iconos de Lucide React:
- `BarChart3` - Reportes
- `Users` - Asesores
- `Target` - Leads
- `TrendingUp` - Conversiones
- `Calendar` - Fechas
- `Download` - Exportar
- `RefreshCw` - Actualizar
- `AlertCircle` - Errores
- `Award` - Rendimiento

### Estados visuales:
- **Cargando**: Skeletons animados
- **Sin datos**: Mensaje con icono
- **Con datos**: Tablas y tarjetas
- **Error**: Alerta roja con descripción

---

## 🔐 Seguridad y Validación

### Backend:
- ✅ Filtros sanitizados con Eloquent
- ✅ Queries parametrizadas (prevención SQL injection)
- ✅ Autenticación requerida (middleware `auth:sanctum`)
- ✅ Validación de parámetros con `Request->input()`

### Frontend:
- ✅ Manejo de errores con try/catch
- ✅ Validación de respuestas vacías
- ✅ Estados de carga para prevenir re-clicks
- ✅ Toast notifications para feedback

---

## 📈 Mejoras Futuras Sugeridas

### 1. **Gráficos Visuales**
Implementar recharts o chart.js para:
- Gráfico de barras de conversión por asesor
- Línea de tiempo de leads por mes
- Gráfico circular de distribución por programa

### 2. **Más Filtros**
- Filtro por rango de fecha relativo (últimos 7 días, este mes, trimestre)
- Filtro por fuente de lead (si existe)
- Exportar con gráficos incluidos (PDF)

### 3. **Cache de Resultados**
- Implementar Redis para cachear estadísticas del día
- Actualizar cache cada hora
- Reducir carga en base de datos

### 4. **Reportes Programados**
- Enviar reportes por email semanalmente
- Dashboard ejecutivo mensual automático
- Alertas de bajo rendimiento

### 5. **Comparación de Períodos**
- Vista lado a lado: mes actual vs mes anterior
- Indicadores de crecimiento (↑ ↓)
- Proyecciones basadas en tendencias

---

## 🧪 Testing

### Endpoints a probar:
```bash
# 1. Estadísticas de asesores
GET /api/reports/advisor-stats?from=2025-11-01&to=2025-11-05

# 2. Estadísticas de leads
GET /api/reports/lead-stats?from=2025-11-01&to=2025-11-05

# 3. Conversiones
GET /api/reports/conversion-stats?userId=5

# 4. Lista de asesores
GET /api/reports/advisors

# 5. Lista de programas
GET /api/reports/programs

# 6. Exportar
POST /api/reports/export-report
Body: { "reportType": "asesores", "from": "2025-11-01", "to": "2025-11-05" }
```

### Casos de prueba:
1. ✅ Filtros vacíos (debe retornar todos los datos)
2. ✅ Filtro por asesor que no existe
3. ✅ Rango de fechas sin datos
4. ✅ Exportar con datos vacíos
5. ✅ Múltiples filtros combinados

---

## 📝 Changelog

### v1.0.0 - 2025-11-05
**Agregado:**
- ✨ Componente `Reports.tsx` con 3 tabs funcionales
- ✨ Service layer `reports.ts` con 8 funciones
- ✨ 8 nuevos endpoints en backend
- ✨ Filtros avanzados (fecha, asesor, programa)
- ✨ Exportación a Excel por reporte
- ✨ Estados de carga y error handling
- ✨ Documentación completa

**Modificado:**
- 🔧 `ReportsController.php` - Agregados 8 métodos nuevos
- 🔧 `routes/api.php` - Nuevo grupo de rutas `/reports/*`
- 🔧 Interfaces TypeScript actualizadas

---

## 👥 Uso del Sistema

### Caso de uso 1: "Ver rendimiento de asesores del mes"
1. Ir a `/admin`
2. Click en tab "Asesores"
3. Los filtros ya vienen con mes actual
4. Ver tabla con rendimiento de cada asesor
5. Click en "Exportar" para descargar Excel

### Caso de uso 2: "Leads asignados a asesor específico"
1. Ir a `/admin` → tab "Leads"
2. En filtro "Asesor", seleccionar asesor
3. Ajustar fechas si es necesario
4. Ver tarjetas con estadísticas
5. Ver tabla de distribución por programa

### Caso de uso 3: "Tasa de conversión por programa"
1. Ir a `/admin` → tab "Conversiones"
2. Seleccionar programa en filtro
3. Ver tasa global y tabla detallada
4. Exportar para presentar a dirección

---

## 🛠️ Mantenimiento

### Actualizar datos de cache (futuro):
```bash
php artisan cache:clear
php artisan reports:cache-stats
```

### Índices de base de datos recomendados:
```sql
CREATE INDEX idx_prospectos_status ON prospectos(status);
CREATE INDEX idx_prospectos_created_by ON prospectos(created_by);
CREATE INDEX idx_prospectos_created_at ON prospectos(created_at);
CREATE INDEX idx_interacciones_lead ON tb_interacciones(id_lead);
CREATE INDEX idx_interacciones_asesor ON tb_interacciones(id_asesor);
```

---

## ✅ Estado Actual
- ✅ Backend implementado y funcional
- ✅ Frontend implementado con UI completa
- ✅ Rutas API configuradas
- ✅ Servicio TypeScript creado
- ⏳ **PENDIENTE: Probar en producción**
- ⏳ **PENDIENTE: Agregar gráficos visuales**
- ⏳ **PENDIENTE: Implementar cache**

---

**Documentado por:** GitHub Copilot  
**Fecha:** 5 de noviembre de 2025  
**Versión:** 1.0.0
