# 🐛 BUG CRÍTICO: Paginación del Endpoint `/courses`

## 📋 Resumen del Problema

El endpoint `GET /api/courses` **NO respeta la paginación correctamente**. Devuelve **siempre 358 cursos por página** cuando debería respetar el parámetro `per_page=200`.

**Resultado:** El frontend tiene que hacer **145 peticiones** para cargar todos los cursos, cuando debería hacer máximo 2-3 peticiones.

---

## 🔍 Evidencia del Bug

### Observación del Frontend:

- **Total de páginas:** 145 páginas
- **Cursos por página:** 358 (debería ser 200)
- **Total de cursos:** ~51,810 registros (358 × 145)
- **Tiempo de carga:** Extremadamente lento (minutos)

### Peticiones realizadas:

```
GET /api/courses?per_page=200&page=1  → Devuelve 358 cursos ❌ (debería ser 200)
GET /api/courses?per_page=200&page=2  → Devuelve 358 cursos ❌ (debería ser 200)
GET /api/courses?per_page=200&page=3  → Devuelve 358 cursos ❌ (debería ser 200)
...
GET /api/courses?per_page=200&page=145 → Devuelve 358 cursos ❌ (última página debería tener < 200)
```

### Problema Detectado:

El backend **IGNORA el parámetro `per_page`** y usa un valor fijo (probablemente 358, o un límite por defecto diferente).

---

## 🎯 Comportamiento Esperado

Asumiendo que hay **~51,810 cursos totales**:

| Petición | Con `per_page=200` Esperado | Actual (Bug) |
|----------|----------|--------|
| `?per_page=200&page=1` | Cursos 1-200 (200 registros) | 358 cursos ❌ |
| `?per_page=200&page=2` | Cursos 201-400 (200 registros) | 358 cursos ❌ |
| `?per_page=200&page=259` | Cursos 51,601-51,810 (210 registros) | 358 cursos ❌ |
| `?per_page=200&page=260` | Array vacío `[]` | 358 cursos ❌ |

**Cálculo correcto:**
- Total de cursos: 51,810
- Per page: 200
- Páginas esperadas: ceil(51,810 / 200) = **260 páginas**
- Páginas actuales: **145 páginas** (porque usa 358 por página)

---

## 🔧 Causa Probable (Backend Laravel)

### ❌ Código Incorrecto (posiblemente actual):

```php
// app/Http/Controllers/CourseController.php

public function index(Request $request)
{
    // ❌ PROBLEMA 1: El parámetro per_page se ignora o usa valor por defecto
    $perPage = $request->get('per_page', 358); // O simplemente no se usa
    
    // ❌ PROBLEMA 2: paginate() usa su propio default
    $courses = Course::with(['programas', 'facilitator'])
        ->paginate(); // ❌ Sin parámetro, usa default de Laravel (15 o config)
    
    return response()->json($courses);
}
```

### Posible causa alternativa:

```php
// config/database.php o AppServiceProvider
Model::preventLazyLoading(!app()->isProduction());

// ❌ Si hay un global scope que limita:
Course::query()->limit(358)->paginate($perPage); // Ignora $perPage
```

---

## ✅ Solución Recomendada

### Opción 1: Respetar `per_page` del request (RECOMENDADO)

```php
// app/Http/Controllers/CourseController.php

public function index(Request $request)
{
    // ✅ Validar y usar per_page del request
    $perPage = (int) $request->get('per_page', 15);
    
    // ✅ Límite máximo de seguridad (evitar abuso)
    $perPage = min($perPage, 500);
    
    // ✅ Laravel automáticamente lee el parámetro 'page'
    $courses = Course::with(['programas', 'facilitator'])
        ->paginate($perPage);
    
    return response()->json($courses);
}
```

### Opción 2: Si usas API Resources (mejor estructura)

```php
use App\Http\Resources\CourseResource;

public function index(Request $request)
{
    $perPage = min((int) $request->get('per_page', 15), 500);
    
    $courses = Course::with(['programas', 'facilitator'])
        ->paginate($perPage);
    
    return CourseResource::collection($courses);
}
```

---

## 🧪 Cómo Verificar la Corrección

### Test desde el frontend:

1. Abre `http://localhost:3000/academico/cursos`
2. Abre la consola del navegador (F12)
3. Busca los logs esperados:
   ```
   📥 Cargando cursos página 1...
   ✅ Página 1: 200 cursos recibidos
   📥 Cargando cursos página 2...
   ✅ Página 2: 200 cursos recibidos
   📥 Cargando cursos página 3...
   ✅ Página 3: 200 cursos recibidos
   ...
   📥 Cargando cursos página 260...
   ✅ Página 260: 10 cursos recibidos
   🏁 Última página alcanzada (10 < 200)
   📊 Total de cursos cargados: 51,810
   ```

4. Verificar que el footer de la tabla muestre:
   ```
   Página 1 de 260  (en vez de "Página 1 de 145")
   ```

### Test manual con Postman/Insomnia:

```bash
# Página 1 - Debe devolver 200 cursos
GET http://localhost:8000/api/courses?per_page=200&page=1

# Respuesta esperada:
{
  "data": [...], // Array de 200 cursos
  "current_page": 1,
  "per_page": 200,
  "total": 51810,
  "last_page": 260
}

# Página 260 - Última página
GET http://localhost:8000/api/courses?per_page=200&page=260

# Respuesta esperada:
{
  "data": [...], // Array de ~10 cursos (51,810 % 200)
  "current_page": 260,
  "per_page": 200,
  "total": 51810,
  "last_page": 260
}

# Página 261 - Más allá de la última
GET http://localhost:8000/api/courses?per_page=200&page=261

# Respuesta esperada:
{
  "data": [], // Array vacío
  "current_page": 261,
  "per_page": 200,
  "total": 51810,
  "last_page": 260
}
```

---

## 📊 Impacto del Bug

### Problemas causados:
1. ❌ **Rendimiento terrible:** Frontend hace **145 peticiones** en vez de **260** (pero debería ser optimizado)
2. ❌ **Tiempo de carga excesivo:** Minutos en vez de segundos
3. ❌ **Uso excesivo de ancho de banda:** Cada petición devuelve 358 cursos con relaciones
4. ❌ **Experiencia de usuario pésima:** Página se queda cargando eternamente
5. ❌ **Inconsistencia:** Frontend espera 200 por página pero recibe 358

### Cálculos de rendimiento:

**Actual (BUG):**
- Peticiones: 145
- Cursos por petición: 358
- Total transferido: ~51,810 registros
- Tiempo estimado: 2-5 minutos

**Esperado (CORREGIDO):**
- Peticiones: 260
- Cursos por petición: 200
- Total transferido: ~51,810 registros
- Tiempo estimado: 1-2 minutos (todavía mejorable)

**Ideal (con optimizaciones adicionales):**
- Usar `per_page=1000` o carga lazy
- Peticiones: 52
- Tiempo estimado: 10-30 segundos

---

## 🚀 Prioridad

**CRÍTICA** - Afecta múltiples módulos:
- `/academico/cursos` (Admin)
- `/academico/moodle` (Sincronización)
- Cualquier componente que use `fetchCourses()`

---

## 📝 Checklist de Corrección

- [ ] Localizar `CourseController.php`
- [ ] Cambiar `take()` por `paginate()` o implementar paginación manual
- [ ] Probar con Postman que páginas 1, 2, 3 devuelven datos diferentes
- [ ] Verificar que página final devuelve array vacío o `< perPage` registros
- [ ] Desplegar a producción
- [ ] Confirmar con frontend que ahora carga rápido

---

## 🔗 Archivos Relacionados

**Frontend:**
- `services/courses.ts` → función `fetchCourses()`
- `app/academico/moodle/page.tsx` → usa `fetchCourses()` para comparar con Moodle

**Backend (probablemente):**
- `app/Http/Controllers/CourseController.php` → método `index()`
- `routes/api.php` → ruta `GET /courses`

---

## 🚀 Optimizaciones Adicionales Recomendadas (Post-Fix)

### 1. Aumentar `per_page` por defecto en el backend

```php
// En vez de 15 (default Laravel), usar 100 o 200
$perPage = (int) $request->get('per_page', 200);
```

### 2. Implementar filtros en el backend

```php
public function index(Request $request)
{
    $query = Course::with(['programas', 'facilitator']);
    
    // Filtro por mes
    if ($request->has('month')) {
        $query->whereMonth('created_at', $request->month);
    }
    
    // Filtro por año
    if ($request->has('year')) {
        $query->whereYear('created_at', $request->year);
    }
    
    // Búsqueda por nombre
    if ($request->has('search')) {
        $query->where('name', 'like', '%' . $request->search . '%');
    }
    
    $perPage = min((int) $request->get('per_page', 200), 500);
    return response()->json($query->paginate($perPage));
}
```

### 3. Usar cursor pagination para mejor performance

```php
// Para datasets muy grandes (>10,000 registros)
$courses = Course::with(['programas', 'facilitator'])
    ->cursorPaginate($perPage);
```

### 4. Cachear respuestas frecuentes

```php
use Illuminate\Support\Facades\Cache;

$cacheKey = "courses_page_{$page}_per_{$perPage}";

$courses = Cache::remember($cacheKey, 300, function () use ($perPage) {
    return Course::with(['programas', 'facilitator'])
        ->paginate($perPage);
});
```

### 5. Lazy loading en el frontend

En vez de cargar todas las páginas al inicio, cargar solo la primera y paginar con botones:

```typescript
// Frontend: Solo cargar página actual, no todas
export const fetchCoursesPage = async (page: number, perPage: number = 200) => {
  const res = await api.get('/courses', {
    params: { per_page: perPage, page },
  })
  return res.data // Retornar objeto completo con metadata
}
```

---

## ⏱️ Estimación de Mejora

| Métrica | Antes (Bug) | Después (Corregido) | Con Optimizaciones |
|---------|-------------|---------------------|-------------------|
| **Peticiones HTTP** | 145 | 260 | 1 (por página) |
| **Tiempo de carga** | 3-5 min | 1-2 min | 2-5 seg |
| **Datos transferidos** | ~18 MB | ~20 MB | ~500 KB |
| **Memoria usada** | ~200 MB | ~200 MB | ~20 MB |
| **UX** | ❌ Horrible | ⚠️ Mejorable | ✅ Excelente |
