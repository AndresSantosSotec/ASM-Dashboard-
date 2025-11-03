# 🔧 Cambios Requeridos en Backend para Asignación Masiva Sin Restricciones

## 📋 Resumen Ejecutivo

Se requiere modificar el endpoint `/api/courses/available-for-students` para que devuelva **todos los cursos del mes actual** sin filtrar por programa o carrera del estudiante, permitiendo asignación flexible y cross-programa.

**Fecha:** 2025-10-30  
**Prioridad:** ALTA  
**Impacto:** Cambio en lógica de negocio  
**Estado:** ⏳ PENDIENTE DE IMPLEMENTACIÓN

---

## 🎯 Problema Actual

### Comportamiento Actual (DETECTADO):

El método `getAvailableCourses()` en `CourseController.php` **filtra cursos por programa del estudiante**:

```php
public function getAvailableCourses(Request $request)
{
    // ...
    
    if (count($prospectoIds) === 1) {
        $prospecto = Prospecto::with('programas.programa.courses')->find($prospectoIds[0]);
        $assignedCourseIds = $prospecto->courses()->pluck('courses.id')->toArray();

        $availableCourses = collect();
        foreach ($prospecto->programas as $estudiantePrograma) {
            if ($estudiantePrograma->programa) {
                // ❌ PROBLEMA: Solo trae cursos del programa del estudiante
                $availableCourses = $availableCourses->merge($estudiantePrograma->programa->courses);
            }
        }
        // ...
    }
}
```

**Limitaciones identificadas:**

- ❌ Solo muestra cursos del programa asignado al estudiante
- ❌ Un estudiante de "Pedagogía" NO puede ver cursos de "Administración"
- ❌ Requiere que los cursos estén asociados a un programa específico
- ❌ Para múltiples estudiantes, solo muestra la **intersección** de cursos comunes

---

## ✅ Comportamiento Requerido

### Nuevos Requisitos:

1. **Sin restricción de programa/carrera:**
   - Mostrar **TODOS** los cursos del mes actual
   - No filtrar por `programa_id` del estudiante
   - Permitir asignación cross-programa

2. **Filtros que SÍ deben aplicarse:**
   - ✅ **Mes actual**: Cursos con `start_date` en el mes en curso
   - ✅ **Status válido**: `status != 'synced'`
   - ✅ **No asignados**: Excluir cursos ya asignados al estudiante
   - ✅ **No completados**: (se maneja en frontend)

3. **Información adicional:**
   - Incluir a qué programas pertenece cada curso (contexto visual)
   - Incluir lista de estudiantes que ya tienen el curso asignado
   - Incluir lista de estudiantes que ya completaron el curso

---

## 🔧 Cambios Requeridos

### 1. Modificar `getAvailableCourses()` en `CourseController.php`

**Ubicación:** `app/Http/Controllers/Api/CourseController.php`

#### Código Actual (INCORRECTO):

```php
public function getAvailableCourses(Request $request)
{
    $request->validate([
        'prospecto_ids' => 'required|array',
        'prospecto_ids.*' => 'exists:prospectos,id',
    ]);

    $prospectoIds = $request->prospecto_ids;

    if (count($prospectoIds) === 1) {
        $prospecto = Prospecto::with('programas.programa.courses')->find($prospectoIds[0]);
        $assignedCourseIds = $prospecto->courses()->pluck('courses.id')->toArray();

        $availableCourses = collect();
        foreach ($prospecto->programas as $estudiantePrograma) {
            if ($estudiantePrograma->programa) {
                $availableCourses = $availableCourses->merge($estudiantePrograma->programa->courses);
            }
        }

        $availableCourses = $availableCourses->unique('id')
            ->whereNotIn('id', $assignedCourseIds)
            ->values();

        return response()->json($availableCourses);
    }

    $commonCourses = null;

    foreach ($prospectoIds as $prospectoId) {
        $prospecto = Prospecto::with('programas.programa.courses')->find($prospectoId);

        $currentCourses = collect();
        foreach ($prospecto->programas as $estudiantePrograma) {
            if ($estudiantePrograma->programa) {
                $currentCourses = $currentCourses->merge($estudiantePrograma->programa->courses);
            }
        }

        $currentCourseIds = $currentCourses->pluck('id')->unique()->toArray();

        if ($commonCourses === null) {
            $commonCourses = $currentCourseIds;
        } else {
            $commonCourses = array_intersect($commonCourses, $currentCourseIds);
        }
    }

    $assignedToAll = Course::whereHas('prospectos', function ($query) use ($prospectoIds) {
        $query->whereIn('prospecto_id', $prospectoIds);
    }, '=', count($prospectoIds))->pluck('id')->toArray();

    $availableCourses = Course::with('programas')
        ->whereIn('id', $commonCourses)
        ->whereNotIn('id', $assignedToAll)
        ->get();

    return response()->json($availableCourses);
}
```

#### Código Nuevo (CORRECTO):

```php
/**
 * Get available courses for students/prospectos
 * 
 * IMPORTANTE: Devuelve TODOS los cursos del mes actual sin filtrar por programa.
 * Esto permite asignación flexible y cross-programa.
 * 
 * @param Request $request - prospecto_ids: array de IDs de estudiantes
 * @return JsonResponse - Cursos del mes actual con información de asignaciones
 */
public function getAvailableCourses(Request $request)
{
    $request->validate([
        'prospecto_ids' => 'required|array',
        'prospecto_ids.*' => 'exists:prospectos,id',
    ]);

    $prospectoIds = $request->prospecto_ids;
    
    // 🆕 Obtener fecha del mes actual
    $now = now();
    $monthStart = $now->copy()->startOfMonth();
    $monthEnd = $now->copy()->endOfMonth();

    // 🆕 TODOS los cursos del mes actual (sin filtro de programa)
    $allCourses = Course::with('programas')
        ->where('status', '!=', 'synced')
        ->whereDate('start_date', '>=', $monthStart)
        ->whereDate('start_date', '<=', $monthEnd)
        ->orderBy('start_date', 'asc')
        ->get();

    // 🆕 Para cada curso, obtener información de asignaciones
    $coursesWithInfo = $allCourses->map(function ($course) use ($prospectoIds) {
        // Estudiantes que ya tienen este curso asignado
        $assignedTo = DB::table('curso_prospecto')
            ->whereIn('prospecto_id', $prospectoIds)
            ->where('course_id', $course->id)
            ->pluck('prospecto_id')
            ->toArray();

        // Estudiantes que ya completaron este curso
        // (Asumiendo que existe una tabla 'completed_courses' o similar)
        // Si no existe, comentar esta sección
        $completedBy = DB::table('curso_prospecto')
            ->whereIn('prospecto_id', $prospectoIds)
            ->where('course_id', $course->id)
            ->where('completed', true) // Ajustar según tu esquema
            ->pluck('prospecto_id')
            ->toArray();

        // Agregar información al curso
        $courseData = $course->toArray();
        $courseData['assigned_to'] = $assignedTo;
        $courseData['completed_by'] = $completedBy;
        
        return $courseData;
    });

    return response()->json($coursesWithInfo);
}
```

---

### 2. Verificar Esquema de Base de Datos

#### Tabla `curso_prospecto`:

Asegurarse que existe la tabla pivot con la estructura correcta:

```sql
CREATE TABLE IF NOT EXISTS curso_prospecto (
    id SERIAL PRIMARY KEY,
    prospecto_id INTEGER NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,  -- ⚠️ VERIFICAR SI EXISTE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prospecto_id, course_id)
);
```

**Si la columna `completed` NO existe:**

Opciones:

1. **Agregar la columna:**
   ```sql
   ALTER TABLE curso_prospecto ADD COLUMN completed BOOLEAN DEFAULT FALSE;
   ```

2. **Usar tabla separada** (si ya existe `completed_courses`):
   ```php
   $completedBy = DB::table('completed_courses')
       ->whereIn('prospecto_id', $prospectoIds)
       ->where('course_id', $course->id)
       ->pluck('prospecto_id')
       ->toArray();
   ```

3. **Omitir campo `completed_by`** (si no se necesita):
   ```php
   $courseData['assigned_to'] = $assignedTo;
   // $courseData['completed_by'] = []; // Comentar o remover
   ```

---

### 3. Actualizar Validaciones de Asignación

#### Verificar métodos `assignCourses()` y `bulkAssignCourses()`:

**Asegurarse que NO validen que el curso pertenezca al programa del estudiante.**

```php
public function bulkAssignCourses(Request $request)
{
    $payload = $request->validate([
        'prospecto_ids'   => 'required|array',
        'prospecto_ids.*' => 'exists:prospectos,id',
        'course_ids'      => 'required|array',
        'course_ids.*'    => 'exists:courses,id',
    ]);

    foreach ($payload['prospecto_ids'] as $prospectoId) {
        $prospecto = Prospecto::findOrFail($prospectoId);
        
        // ✅ NO validar que el curso pertenezca al programa
        // ✅ Permitir asignación libre
        $prospecto->courses()->syncWithoutDetaching($payload['course_ids']);
    }

    return response()->json(['message' => 'Cursos asignados correctamente']);
}
```

**Código actual está CORRECTO** si no tiene validaciones de programa.

---

## 🧪 Casos de Prueba

### Caso 1: Un Estudiante de Pedagogía

**Request:**
```json
POST /api/courses/available-for-students
{
  "prospecto_ids": [1]
}
```

**Response Esperada:**
```json
[
  {
    "id": 101,
    "name": "BBA Comunicación y Redacción Ejecutiva",
    "code": "BBA01",
    "start_date": "2025-10-01",
    "status": "approved",
    "programas": [
      {"id": 5, "nombre_del_programa": "Bachelor of Business Administration"}
    ],
    "assigned_to": [],
    "completed_by": []
  },
  {
    "id": 201,
    "name": "MBA Gestión de Crisis y Resiliencia",
    "code": "MBA01",
    "start_date": "2025-10-15",
    "status": "approved",
    "programas": [
      {"id": 10, "nombre_del_programa": "Master of Business Administration"}
    ],
    "assigned_to": [],
    "completed_by": []
  }
  // ... TODOS los cursos del mes actual
]
```

**Validación:**
- ✅ Incluye cursos de BBA (aunque el estudiante sea de Pedagogía)
- ✅ Incluye cursos de MBA (aunque el estudiante sea de BBA)
- ✅ Solo cursos del mes actual (octubre 2025)
- ✅ Excluye cursos con `status='synced'`

---

### Caso 2: Múltiples Estudiantes de Diferentes Programas

**Request:**
```json
POST /api/courses/available-for-students
{
  "prospecto_ids": [1, 2, 3]
}
```

**Donde:**
- Estudiante 1: Pedagogía
- Estudiante 2: Administración
- Estudiante 3: Ingeniería

**Response Esperada:**
```json
[
  {
    "id": 101,
    "name": "BBA Comunicación y Redacción Ejecutiva",
    "code": "BBA01",
    "assigned_to": [1],      // Estudiante 1 ya lo tiene
    "completed_by": []
  },
  {
    "id": 102,
    "name": "BBA Razonamiento Crítico",
    "code": "BBA02",
    "assigned_to": [],
    "completed_by": [2]      // Estudiante 2 ya lo completó
  }
  // ... TODOS los cursos del mes
]
```

**Validación:**
- ✅ Mismo conjunto de cursos para todos
- ✅ `assigned_to` muestra quién ya tiene el curso
- ✅ `completed_by` muestra quién ya lo terminó
- ✅ Frontend decide qué mostrar a cada estudiante

---

### Caso 3: Asignación Cross-Programa

**Request:**
```json
POST /api/courses/assign
{
  "prospecto_ids": [1],     // Estudiante de Pedagogía
  "course_ids": [201]       // Curso de MBA
}
```

**Response Esperada:**
```json
{
  "message": "Cursos asignados correctamente"
}
```

**Validación en DB:**
```sql
SELECT * FROM curso_prospecto WHERE prospecto_id = 1 AND course_id = 201;

-- Resultado esperado:
-- id | prospecto_id | course_id | completed | created_at
-- 1  | 1            | 201       | false     | 2025-10-30 ...
```

---

## 📊 Comparación Antes/Después

| Aspecto | Antes (CON Restricción) | Después (SIN Restricción) |
|---------|-------------------------|---------------------------|
| **Cursos mostrados** | Solo del programa del estudiante | Todos del mes actual |
| **Estudiante Pedagogía** | Solo cursos de Pedagogía | Cursos de todos los programas |
| **Múltiples estudiantes** | Intersección de programas | Todos los cursos del mes |
| **Asignación cross-programa** | ❌ No permitida | ✅ Permitida |
| **Flexibilidad** | Baja | Alta |
| **Lógica de negocio** | Restrictiva | Flexible |

---

## ⚠️ Consideraciones Importantes

### 1. **Validaciones Académicas**

**Pregunta:** ¿Debe haber validación de prerrequisitos?

**Opciones:**
- **No validar** (actual requerimiento) → Máxima flexibilidad
- **Validar en backend** → Agregar lógica de prerrequisitos
- **Validar en frontend** → Solo advertencias visuales

**Recomendación:** Implementar sin validaciones inicialmente, agregar después si se requiere.

---

### 2. **Capacidad de Cursos**

**Pregunta:** ¿Los cursos tienen límite de estudiantes?

**Si NO hay límite:**
- No se requiere validación adicional

**Si HAY límite:**
```php
// Validar capacidad antes de asignar
$course = Course::find($courseId);
$currentEnrollment = $course->prospectos()->count();

if ($course->max_capacity && $currentEnrollment >= $course->max_capacity) {
    return response()->json([
        'message' => 'Curso lleno',
        'course_id' => $courseId,
        'capacity' => $course->max_capacity
    ], 422);
}
```

---

### 3. **Auditoría de Asignaciones**

**Recomendación:** Registrar quién asignó qué curso a quién estudiante.

```php
// Agregar después de syncWithoutDetaching
DB::table('course_assignments_log')->insert([
    'prospecto_id' => $prospectoId,
    'course_id' => $courseId,
    'assigned_by' => auth()->id(),
    'assigned_at' => now(),
    'action' => 'assign'
]);
```

**Crear tabla:**
```sql
CREATE TABLE course_assignments_log (
    id SERIAL PRIMARY KEY,
    prospecto_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(20) NOT NULL  -- 'assign' o 'unassign'
);
```

---

### 4. **Impacto en Reportes**

**Validar:** Si existen reportes que asumen que un estudiante solo tiene cursos de su programa.

**Reportes que podrían afectarse:**
- Reporte de progreso por programa
- Estadísticas de cursos por carrera
- Carga académica por especialidad

**Solución:** Filtrar por `programas` del curso en reportes:

```php
// En reportes, filtrar por programa si se necesita
$cursosDelPrograma = $estudiante->courses()
    ->whereHas('programas', function($q) use ($programaId) {
        $q->where('programa_id', $programaId);
    })
    ->get();
```

---

## ✅ Checklist de Implementación

### Backend (Laravel):

- [ ] **Modificar `getAvailableCourses()`** en `CourseController.php`
  - [ ] Remover filtro de programa
  - [ ] Agregar filtro de mes actual
  - [ ] Incluir `assigned_to` y `completed_by`

- [ ] **Verificar esquema de DB**
  - [ ] Confirmar existencia de tabla `curso_prospecto`
  - [ ] Verificar columna `completed` o tabla alternativa
  - [ ] Agregar índices si es necesario

- [ ] **Validar métodos de asignación**
  - [ ] `assignCourses()` - Verificar que no valide programa
  - [ ] `bulkAssignCourses()` - Verificar que no valide programa
  - [ ] `unassignCourses()` - Sin cambios necesarios

- [ ] **Testing**
  - [ ] Test: Un estudiante recibe todos los cursos del mes
  - [ ] Test: Múltiples estudiantes reciben los mismos cursos
  - [ ] Test: Asignación cross-programa funciona
  - [ ] Test: `assigned_to` y `completed_by` correctos

- [ ] **Opcional: Auditoría**
  - [ ] Crear tabla `course_assignments_log`
  - [ ] Implementar logging de asignaciones

- [ ] **Documentación**
  - [ ] Actualizar documentación de API
  - [ ] Documentar cambio de comportamiento

---

### Frontend (Next.js):

- [x] **Panel mejorado implementado**
  - [x] Filtro de mes actual
  - [x] Exclusión de completados
  - [x] UI sin emojis
  - [x] Validaciones defensivas

- [x] **Listo para recibir datos del backend**
  - [x] Maneja `assigned_to` (si se incluye)
  - [x] Maneja `completed_by` (si se incluye)
  - [x] Filtra por mes en frontend como backup

---

## 🚀 Plan de Deploy

### Fase 1: Desarrollo (2-3 días)
1. Implementar cambios en `getAvailableCourses()`
2. Verificar esquema de DB
3. Tests unitarios

### Fase 2: Testing (1-2 días)
1. Pruebas en ambiente de desarrollo
2. Validar asignaciones cross-programa
3. Verificar reportes existentes

### Fase 3: Staging (1 día)
1. Deploy a staging
2. Pruebas con datos reales
3. Validación de usuario final

### Fase 4: Producción (1 día)
1. Deploy coordinado backend + frontend
2. Monitoreo de errores
3. Validación de funcionalidad

**Total estimado:** 5-7 días

---

## 📞 Contacto y Soporte

**Desarrollador Frontend:** GitHub Copilot  
**Fecha de documentación:** 2025-10-30  
**Versión:** 1.0

---

## 📝 Notas Adicionales

### Alternativa: Endpoint Nuevo

Si no se quiere modificar el endpoint existente, crear uno nuevo:

```php
/**
 * GET /api/courses/available-unrestricted
 * 
 * Devuelve todos los cursos del mes actual sin restricciones
 */
public function getAvailableCoursesUnrestricted(Request $request)
{
    // ... implementación nueva
}
```

**Pros:**
- No afecta código existente
- Permite migración gradual

**Contras:**
- Duplicación de código
- Dos endpoints similares

**Recomendación:** Modificar el endpoint existente y deprecar el comportamiento antiguo.

---

**Estado:** ⏳ **PENDIENTE DE IMPLEMENTACIÓN EN BACKEND**  
**Prioridad:** 🔴 ALTA  
**Bloqueador:** Funcionalidad completa de asignación masiva

---

## 🔍 Anexo: Código SQL de Validación

### Verificar Cursos del Mes Actual:

```sql
-- Cursos que inician en octubre 2025
SELECT id, name, code, start_date, status
FROM courses
WHERE EXTRACT(MONTH FROM start_date) = 10
  AND EXTRACT(YEAR FROM start_date) = 2025
  AND status != 'synced'
ORDER BY start_date ASC;
```

### Verificar Asignaciones de un Estudiante:

```sql
-- Ver todos los cursos de un estudiante (incluyendo de otros programas)
SELECT 
    c.id,
    c.name,
    c.code,
    p.nombre_del_programa as programa_del_curso,
    ep.nombre_del_programa as programa_del_estudiante
FROM curso_prospecto cp
JOIN courses c ON c.id = cp.course_id
LEFT JOIN programa_course pc ON pc.course_id = c.id
LEFT JOIN tb_programas p ON p.id = pc.programa_id
JOIN prospectos pr ON pr.id = cp.prospecto_id
LEFT JOIN estudiante_programa epr ON epr.prospecto_id = pr.id
LEFT JOIN tb_programas ep ON ep.id = epr.programa_id
WHERE cp.prospecto_id = 1
ORDER BY c.start_date;
```

### Verificar Tabla Pivot:

```sql
-- Estructura de curso_prospecto
\d curso_prospecto;

-- Verificar si existe columna 'completed'
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'curso_prospecto'
  AND column_name = 'completed';
```

---

**FIN DEL DOCUMENTO**
