# 🔍 ANÁLISIS DE RENDIMIENTO DEL BACKEND - REQUERIMIENTO TÉCNICO

## 📋 CONTEXTO DEL PROBLEMA

### Síntomas Observados
- **Carga inicial extremadamente lenta** en `/academico/asignacion`
- **Múltiples errores 404** en consola: `/api/estudiante-programa?prospecto_id={ID}`
- **Errores de canal cerrado**: "A listener indicated an asynchronous response by returning true, but the message channel closed"
- **Timeout/saturación** en peticiones concurrentes durante carga inicial
- **Primera carga tarda mucho**, cargas subsecuentes más rápidas

### Endpoints Problemáticos Identificados
1. `GET /api/estudiante-programa?prospecto_id={ID}` → 404 masivos
2. `GET /api/estudiante-programa/{studentId}/with-courses` → lento
3. `GET /api/prospectos/status/Inscrito?per_page=9999` → base de datos pesada
4. `POST /api/courses/export-cursos` → 404 (no funciona descarga CSV)
5. `POST /api/courses/export-cursos-masivo` → 404 (no funciona descarga masiva)

---

## 🎯 OBJETIVOS DEL ANÁLISIS

### 1. DIAGNÓSTICO DE ENDPOINTS
- [ ] **Verificar existencia de rutas** en `routes/web.php` o `routes/api.php`
- [ ] **Validar controladores** y métodos correspondientes
- [ ] **Revisar middleware** (autenticación, CORS, rate limiting)
- [ ] **Analizar queries SQL** generadas por Eloquent/Query Builder
- [ ] **Identificar N+1 queries** y consultas no optimizadas

### 2. ANÁLISIS DE RENDIMIENTO
- [ ] **Profiling de queries** lentas con Laravel Debugbar/Telescope
- [ ] **Medición de tiempo de respuesta** por endpoint
- [ ] **Análisis de memoria** y uso de CPU
- [ ] **Revisión de índices** en base de datos
- [ ] **Evaluación de eager loading** vs lazy loading

### 3. OPTIMIZACIONES ESPECÍFICAS
- [ ] **Implementar paginación** eficiente en lugar de `per_page=9999`
- [ ] **Crear endpoints batch** para múltiples IDs
- [ ] **Optimizar relaciones** Eloquent con `with()`, `select()`, `whereHas()`
- [ ] **Implementar cache** (Redis/Memcached) para queries frecuentes
- [ ] **Añadir rate limiting** inteligente

---

## 🔧 ENDPOINTS A REVISAR DETALLADAMENTE

### 1. Gestión de Estudiantes-Programas

#### Endpoint Actual Problemático:
```
GET /api/estudiante-programa?prospecto_id={ID}
```

**Problemas esperados:**
- Ruta no existe o tiene nombre diferente
- Parámetro `prospecto_id` no reconocido
- Query SQL no optimizada (joins múltiples sin índices)
- Falta validación de parámetros

**Soluciones requeridas:**
```php
// Ruta optimizada requerida
Route::get('/estudiante-programa', [EstudianteProgramaController::class, 'getByProspecto']);

// Método optimizado requerido
public function getByProspecto(Request $request) {
    $prospectoId = $request->get('prospecto_id');
    
    return EstudiantePrograma::with(['programa:id,nombre_del_programa,abreviatura'])
        ->where('prospecto_id', $prospectoId)
        ->select('id', 'prospecto_id', 'programa_id', 'fecha_inicio')
        ->get();
}
```

#### Endpoint Batch Requerido (NUEVO):
```
POST /api/estudiante-programa/batch
Body: {"prospecto_ids": [1, 2, 3, 4, 5]}
```

### 2. Exportación de Cursos CSV

#### Endpoints Faltantes:
```
POST /api/courses/export-cursos
POST /api/courses/export-cursos-masivo
```

**Implementación requerida en routes/api.php:**
```php
Route::prefix('courses')->group(function () {
    Route::post('/export-cursos', [CourseController::class, 'cursoexportable']);
    Route::post('/export-cursos-masivo', [CourseController::class, 'cursoexportableMasivo']);
});
```

#### 🔄 **REQUERIMIENTO CRÍTICO: Indicadores de Progreso para Descarga CSV**

**Problema actual:**
- Usuario hace clic en "Descargar CSV" y no sabe si está procesando
- No hay feedback visual durante la generación del archivo
- Genera ansiedad y clics repetidos que saturan el servidor

**Solución requerida - Implementar indicadores de carga:**

##### Backend: Headers de Progreso
```php
// En cursoexportable() y cursoexportableMasivo()
public function cursoexportable(Request $request) {
    // Enviar headers inmediatos para indicar que está procesando
    header('X-Processing-Status: started');
    header('X-Estimated-Time: 5-10 segundos');
    
    // ... lógica existente ...
    
    // Antes de generar CSV
    header('X-Processing-Status: generating-csv');
    
    // ... generar archivo ...
    
    return response()->download($filepath, $filename, [
        'Content-Type' => 'text/csv',
        'X-Processing-Status' => 'completed',
        'X-Total-Records' => $totalRecords,
    ])->deleteFileAfterSend(true);
}
```

##### Frontend: Estados de Carga Visual
```typescript
// En components/cards/student-card.tsx y student-assignment-view.tsx
const [downloadState, setDownloadState] = useState<'idle' | 'processing' | 'generating' | 'downloading'>('idle');

const handleExportCourses = async () => {
    setDownloadState('processing');
    
    toast({
        title: "🔄 Procesando...",
        description: "Generando CSV de cursos asignados...",
        duration: 0, // No auto-dismiss
    });

    try {
        // Interceptor para headers de progreso
        const response = await exportarYDescargarCursos(student.carnet);
        
        setDownloadState('downloading');
        toast({
            title: "⬇️ Descargando...",
            description: "El archivo se está descargando...",
            duration: 3000,
        });
        
    } catch (error) {
        setDownloadState('idle');
        // error handling...
    } finally {
        setDownloadState('idle');
    }
};
```

##### Estados del Botón de Descarga
```tsx
<Button
    onClick={handleExportCourses}
    variant="outline"
    disabled={downloadState !== 'idle'}
    className={downloadState !== 'idle' ? "opacity-50 cursor-not-allowed" : ""}
>
    {downloadState === 'idle' && (
        <>
            <Download className="h-4 w-4 mr-2" />
            Descargar CSV
        </>
    )}
    {downloadState === 'processing' && (
        <>
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            Procesando...
        </>
    )}
    {downloadState === 'generating' && (
        <>
            <div className="h-4 w-4 mr-2 animate-pulse">📄</div>
            Generando CSV...
        </>
    )}
    {downloadState === 'downloading' && (
        <>
            <div className="h-4 w-4 mr-2 animate-bounce">⬇️</div>
            Descargando...
        </>
    )}
</Button>
```

##### Mejorar Función de Exportación con Progress
```typescript
// En services/courses.ts
export const exportarYDescargarCursos = async (
    carnet: string,
    onProgress?: (status: string) => void
): Promise<void> => {
    try {
        onProgress?.('Iniciando exportación...');
        
        const blob = await exportCursosCSV(carnet);
        
        onProgress?.('Preparando descarga...');
        
        const filename = `cursos_${carnet.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
        downloadCSVFile(blob, filename);
        
        onProgress?.('Descarga completada');
        
    } catch (error) {
        onProgress?.('Error en la exportación');
        throw error;
    }
};
```

### 3. Listado de Estudiantes Inscritos

#### Endpoint Actual:
```
GET /api/prospectos/status/Inscrito?per_page=9999
```

**Problemas:**
- `per_page=9999` carga miles de registros sin paginación
- Falta eager loading de relaciones
- Query pesada sin optimización

**Optimización requerida:**
```php
public function getByStatus($status) {
    return Prospecto::with([
        'programas:id,nombre_del_programa,abreviatura',
        'programas.programa:id,nombre_del_programa,abreviatura'
    ])
    ->where('status', $status)
    ->select('id', 'nombre_completo', 'carnet', 'fecha_inicio_especifica')
    ->orderBy('fecha_inicio_especifica', 'desc')
    ->paginate(50); // Paginación real
}
```

---

## 🗄️ ANÁLISIS DE BASE DE DATOS REQUERIDO

### 1. Verificar Índices Necesarios
```sql
-- Índices críticos para rendimiento
SHOW INDEX FROM prospectos;
SHOW INDEX FROM estudiante_programa;
SHOW INDEX FROM courses;
SHOW INDEX FROM curso_prospecto;

-- Índices requeridos (si no existen)
CREATE INDEX idx_prospectos_status ON prospectos(status);
CREATE INDEX idx_estudiante_programa_prospecto ON estudiante_programa(prospecto_id);
CREATE INDEX idx_curso_prospecto_prospecto ON curso_prospecto(prospecto_id);
CREATE INDEX idx_curso_prospecto_course ON curso_prospecto(course_id);
```

### 2. Queries Lentas a Analizar
```sql
-- Habilitar log de queries lentas
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Queries típicamente problemáticas
EXPLAIN SELECT * FROM prospectos WHERE status = 'Inscrito';
EXPLAIN SELECT ep.*, p.nombre_del_programa 
        FROM estudiante_programa ep 
        JOIN programas p ON ep.programa_id = p.id 
        WHERE ep.prospecto_id = ?;
```

---

## 🚀 OPTIMIZACIONES ESPECÍFICAS REQUERIDAS

### 1. Implementar Cache Inteligente
```php
// Cache para listado de estudiantes (30 minutos)
$estudiantes = Cache::remember('estudiantes_inscritos', 1800, function () {
    return Prospecto::with('programas')->where('status', 'Inscrito')->get();
});

// Cache para programas de estudiante (1 hora)
$programas = Cache::remember("programas_estudiante_{$prospectoId}", 3600, function () use ($prospectoId) {
    return EstudiantePrograma::with('programa')->where('prospecto_id', $prospectoId)->get();
});
```

### 2. Endpoint Batch para Múltiples Estudiantes
```php
// POST /api/estudiante-programa/batch
public function getBatch(Request $request) {
    $prospectoIds = $request->input('prospecto_ids', []);
    
    return EstudiantePrograma::with('programa:id,nombre_del_programa,abreviatura')
        ->whereIn('prospecto_id', $prospectoIds)
        ->get()
        ->groupBy('prospecto_id');
}
```

### 3. Respuesta Optimizada con Datos Anidados
```php
// GET /api/prospectos/status/Inscrito (optimizado)
public function getInscritosOptimizado() {
    return Prospecto::with([
        'estudiantePrograma.programa:id,nombre_del_programa,abreviatura',
        'cursosAsignados:id,name,code'
    ])
    ->where('status', 'Inscrito')
    ->select('id', 'nombre_completo', 'carnet', 'fecha_inicio_especifica')
    ->paginate(100);
}
```

---

## 📊 MÉTRICAS A MEDIR

### Antes de Optimización
- [ ] Tiempo de respuesta `/api/prospectos/status/Inscrito`
- [ ] Número de queries SQL ejecutadas
- [ ] Tiempo de carga inicial de `/academico/asignacion`
- [ ] **Tiempo percibido de espera** durante descarga CSV (sin indicadores)
- [ ] Memoria utilizada por request
- [ ] Número de requests concurrentes soportados

### Después de Optimización (Objetivos)
- [ ] **< 500ms** para listado de estudiantes
- [ ] **< 200ms** para programas de estudiante individual
- [ ] **< 2 segundos** para carga inicial completa
- [ ] **< 3 segundos** para generar CSV individual
- [ ] **< 10 segundos** para CSV masivo (con progreso visible)
- [ ] **Reducir 80%** el número de queries SQL
- [ ] **Soportar 50+ requests** concurrentes sin degradación
- [ ] **100% feedback visual** en procesos de descarga

---

## 🛠️ HERRAMIENTAS DE DIAGNÓSTICO

### 1. Laravel Telescope (Recomendado)
```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

### 2. Laravel Debugbar
```bash
composer require barryvdh/laravel-debugbar --dev
```

### 3. Query Logging Manual
```php
// En AppServiceProvider o middleware
DB::listen(function ($query) {
    Log::info($query->sql, $query->bindings);
});
```

---

## 📝 ENTREGABLES ESPERADOS

### 1. Reporte de Diagnóstico
- [ ] Lista de endpoints no existentes o mal configurados
- [ ] Queries SQL más lentas identificadas
- [ ] Índices faltantes en base de datos
- [ ] Cuellos de botella específicos

### 2. Implementación de Fixes
- [ ] Rutas faltantes agregadas
- [ ] **Indicadores de progreso implementados** para descarga CSV
- [ ] Controladores optimizados
- [ ] Índices de base de datos creados
- [ ] Cache implementado en endpoints críticos

### 3. Mejoras de UX Críticas
- [ ] **Estados de botón durante procesamiento** (idle → processing → downloading)
- [ ] **Toasts informativos** con progreso de descarga
- [ ] **Prevención de múltiples clics** durante descarga
- [ ] **Estimación de tiempo** para usuario (headers backend)
- [ ] **Manejo de errores** con mensajes claros

### 4. Pruebas de Rendimiento
- [ ] Comparativa antes/después con métricas
- [ ] **Pruebas de UX** de descarga CSV (tiempo percibido vs real)
- [ ] Documentación de endpoints optimizados
- [ ] Guía de mantenimiento y monitoreo

---

## 🎯 PRIORIDADES DE IMPLEMENTACIÓN

### CRÍTICO (Inmediato)
1. **Crear rutas faltantes** para exportación CSV
2. **Implementar indicadores de progreso** para descarga CSV (UX crítica)
3. **Optimizar query** de estudiantes inscritos con eager loading
4. **Agregar índices** de base de datos críticos

### ALTO (Esta semana)
5. **Implementar endpoint batch** para múltiples estudiantes
6. **Añadir cache** en Redis/Memcached
7. **Paginación real** en lugar de `per_page=9999`
8. **Mejorar feedback visual** en todos los procesos de carga

### MEDIO (Siguiente sprint)
7. **Rate limiting inteligente**
8. **Monitoreo y alertas** de rendimiento
9. **Documentación API** actualizada

---

## 💡 NOTAS ADICIONALES

### Configuración de Entorno
- **Servidor**: ¿Qué stack? (Apache/Nginx + PHP-FPM)
- **Base de datos**: ¿MySQL/PostgreSQL? ¿Versión?
- **Cache**: ¿Redis disponible?
- **Recursos**: ¿RAM, CPU disponibles?

### Consideraciones CORS
```php
// config/cors.php - verificar configuración
'paths' => ['api/*'],
'allowed_methods' => ['*'],
'allowed_origins' => ['http://localhost:3000', 'http://localhost:8000'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

---

**📞 CONTACTO PARA SEGUIMIENTO**
- Revisar implementación de rutas faltantes
- Validar queries SQL con EXPLAIN
- Medir tiempos antes/después de optimizaciones
- Coordinar despliegue de cambios en producción