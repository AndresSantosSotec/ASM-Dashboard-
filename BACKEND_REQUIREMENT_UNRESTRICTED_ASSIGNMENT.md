# 📋 Requerimiento Backend: Asignación Masiva Sin Restricción de Plan/Carrera

## 🎯 Objetivo

Modificar el endpoint de cursos disponibles para que devuelva **todos los cursos del mes actual** sin filtrar por plan o carrera del estudiante, permitiendo asignación flexible e iterativa.

---

## 📊 Estado Actual

### Endpoint Actual:
```
GET /api/courses/available-for-students
```

**Request:**
```json
{
  "prospecto_ids": [1, 2, 3]
}
```

**Comportamiento Actual (SUPUESTO):**
- ✅ Devuelve cursos del mes actual
- ⚠️ **POSIBLE LIMITACIÓN:** Filtra cursos solo del plan/carrera asignado al estudiante
- ⚠️ **POSIBLE LIMITACIÓN:** No permite asignar cursos de otros programas

---

## ✅ Comportamiento Requerido

### Nuevo Comportamiento:

1. **Sin restricción de plan/carrera:**
   - Devolver **todos** los cursos disponibles del mes actual
   - No filtrar por `programa_id` del estudiante
   - Permitir que un estudiante de "Pedagogía" pueda tomar cursos de "Administración"

2. **Filtros que SÍ deben aplicarse:**
   - ✅ Mes actual (cursos que inician en el mes en curso)
   - ✅ Status del curso (`status != 'synced'`)
   - ✅ Excluir cursos ya asignados al estudiante
   - ✅ Excluir cursos ya completados por el estudiante

3. **Asignación iterativa:**
   - El frontend debe poder asignar cursos uno a uno o por grupos
   - La API debe aceptar múltiples asignaciones por estudiante

---

## 🔧 Cambios Requeridos en Backend

### 1. **Endpoint de Cursos Disponibles**

#### Modificación en: `app/Http/Controllers/CourseController.php`

**Antes (SUPUESTO):**
```php
public function availableForStudents(Request $request)
{
    $prospectoIds = $request->input('prospecto_ids', []);
    
    // Obtener programas de los estudiantes
    $programIds = EstudiantePrograma::whereIn('prospecto_id', $prospectoIds)
        ->pluck('programa_id')
        ->unique()
        ->toArray();
    
    // Filtrar cursos solo de esos programas ❌
    $courses = Course::whereIn('programa_id', $programIds)
        ->where('status', '!=', 'synced')
        ->whereMonth('start_date', now()->month)
        ->whereYear('start_date', now()->year)
        ->get();
    
    return response()->json($courses);
}
```

**Después (REQUERIDO):**
```php
public function availableForStudents(Request $request)
{
    $prospectoIds = $request->input('prospecto_ids', []);
    
    // ✅ Obtener TODOS los cursos del mes actual sin filtro de programa
    $courses = Course::where('status', '!=', 'synced')
        ->whereMonth('start_date', now()->month)
        ->whereYear('start_date', now()->year)
        ->with('programas') // Incluir información del programa para contexto
        ->get();
    
    // ✅ Para cada curso, verificar si ya fue asignado o completado por algún estudiante
    $courses = $courses->map(function ($course) use ($prospectoIds) {
        // Obtener estudiantes que ya tienen este curso asignado
        $assignedTo = DB::table('curso_prospecto')
            ->whereIn('prospecto_id', $prospectoIds)
            ->where('course_id', $course->id)
            ->pluck('prospecto_id')
            ->toArray();
        
        // Obtener estudiantes que ya completaron este curso
        $completedBy = DB::table('completed_courses')
            ->whereIn('prospecto_id', $prospectoIds)
            ->where('course_id', $course->id)
            ->pluck('prospecto_id')
            ->toArray();
        
        $course->assigned_to = $assignedTo;
        $course->completed_by = $completedBy;
        
        return $course;
    });
    
    return response()->json($courses);
}
```

---

### 2. **Endpoint de Asignación Masiva**

#### Verificación en: `app/Http/Controllers/CourseController.php`

**Endpoint:**
```
POST /api/courses/assign
POST /api/courses/bulk-assign
```

**Debe soportar:**
```json
{
  "prospecto_ids": [1, 2, 3],
  "course_ids": [101, 102, 103]
}
```

**Validaciones necesarias:**
```php
public function bulkAssign(Request $request)
{
    $validated = $request->validate([
        'prospecto_ids' => 'required|array',
        'prospecto_ids.*' => 'exists:prospectos,id',
        'course_ids' => 'required|array',
        'course_ids.*' => 'exists:courses,id',
    ]);
    
    $prospectoIds = $validated['prospecto_ids'];
    $courseIds = $validated['course_ids'];
    
    // ✅ NO validar que el curso pertenezca al programa del estudiante
    // ✅ Permitir asignación libre
    
    foreach ($prospectoIds as $prospectoId) {
        foreach ($courseIds as $courseId) {
            // Verificar si ya está asignado
            $exists = DB::table('curso_prospecto')
                ->where('prospecto_id', $prospectoId)
                ->where('course_id', $courseId)
                ->exists();
            
            if (!$exists) {
                DB::table('curso_prospecto')->insert([
                    'prospecto_id' => $prospectoId,
                    'course_id' => $courseId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
    
    return response()->json([
        'message' => 'Cursos asignados exitosamente',
        'assigned' => count($prospectoIds) * count($courseIds)
    ]);
}
```

---

### 3. **Nuevo Endpoint (OPCIONAL): Cursos por Mes**

Si se desea más flexibilidad:

```php
/**
 * GET /api/courses/by-month?year=2025&month=10
 */
public function coursesByMonth(Request $request)
{
    $year = $request->input('year', now()->year);
    $month = $request->input('month', now()->month);
    
    $courses = Course::where('status', '!=', 'synced')
        ->whereMonth('start_date', $month)
        ->whereYear('start_date', $year)
        ->with('programas')
        ->orderBy('start_date', 'asc')
        ->get();
    
    return response()->json($courses);
}
```

---

## 🔍 Validaciones del Frontend

El frontend ya implementa:

✅ **Filtro de mes actual:**
```typescript
const now = new Date();
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

const isInCurrentMonth = courseStartDate >= monthStart && courseStartDate <= monthEnd;
```

✅ **Exclusión de completados:**
```typescript
if (selection.completedCourseIds.includes(courseId)) return false;
if (selection.moodleCompletedCourses.some(...)) return false;
```

✅ **Exclusión de sincronizados:**
```typescript
if (course.status === 'synced') return false;
```

---

## 📊 Flujo de Datos

### Actual (Con Restricción):
```
1. Usuario selecciona estudiantes: [Juan (Pedagogía), María (Administración)]
2. Frontend pide cursos: GET /available-for-students?ids=[1,2]
3. Backend filtra: Cursos de Pedagogía + Administración ❌
4. Frontend muestra: Solo cursos de esos 2 programas
```

### Requerido (Sin Restricción):
```
1. Usuario selecciona estudiantes: [Juan (Pedagogía), María (Administración)]
2. Frontend pide cursos: GET /available-for-students?ids=[1,2]
3. Backend devuelve: TODOS los cursos del mes actual ✅
4. Frontend muestra: Todos los cursos (filtrados por completados)
5. Usuario asigna: Puede asignar curso de "Ingeniería" a Juan
```

---

## 🧪 Casos de Prueba

### Caso 1: Asignación Cross-Programa
**Input:**
- Estudiante: Juan (Pedagogía, ID: 1)
- Curso: "Programación I" (Ingeniería, ID: 101)

**Comportamiento Esperado:**
- ✅ Backend permite asignación
- ✅ Frontend muestra el curso
- ✅ Se registra en `curso_prospecto`

### Caso 2: Múltiples Estudiantes, Un Curso
**Input:**
```json
{
  "prospecto_ids": [1, 2, 3],
  "course_ids": [101]
}
```

**Comportamiento Esperado:**
- ✅ Se asigna curso 101 a estudiantes 1, 2 y 3
- ✅ Independiente de sus programas

### Caso 3: Un Estudiante, Múltiples Cursos Iterativamente
**Primera asignación:**
```json
{
  "prospecto_ids": [1],
  "course_ids": [101]
}
```

**Segunda asignación:**
```json
{
  "prospecto_ids": [1],
  "course_ids": [102, 103]
}
```

**Comportamiento Esperado:**
- ✅ Ambas asignaciones exitosas
- ✅ Estudiante 1 tiene cursos: 101, 102, 103

---

## 📝 Respuesta del Backend Requerida

### Formato de Respuesta Mejorado:

```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "name": "Programación I",
      "code": "PROG-101",
      "area": "common",
      "credits": 3,
      "start_date": "2025-10-01",
      "end_date": "2025-12-15",
      "schedule": "Lunes y Miércoles 14:00-16:00",
      "duration": "3 meses",
      "status": "approved",
      "programas": [
        {
          "id": 5,
          "nombre_del_programa": "Ingeniería en Sistemas"
        }
      ],
      "assigned_to": [1, 3], // IDs de estudiantes que ya tienen este curso
      "completed_by": [2]     // IDs de estudiantes que ya completaron
    }
  ]
}
```

**Campos importantes:**
- `programas`: Muestra a qué programa pertenece el curso (contexto visual)
- `assigned_to`: Estudiantes que ya tienen el curso asignado
- `completed_by`: Estudiantes que ya lo completaron

---

## ⚠️ Consideraciones

### 1. **Impacto en Reportes:**
Si existen reportes que asumen que un estudiante solo tiene cursos de su programa, pueden romperse.

### 2. **Validaciones Académicas:**
¿Debe haber alguna validación de prerrequisitos o nivel académico?

### 3. **Capacidad de Cursos:**
¿Los cursos tienen límite de estudiantes? (No implementado actualmente)

### 4. **Auditoría:**
Registrar quién asignó qué curso a quién estudiante:
```php
DB::table('course_assignments_log')->insert([
    'prospecto_id' => $prospectoId,
    'course_id' => $courseId,
    'assigned_by' => auth()->id(),
    'assigned_at' => now(),
]);
```

---

## ✅ Checklist de Implementación Backend

- [ ] Modificar `/available-for-students` para devolver todos los cursos del mes
- [ ] Eliminar filtro de `programa_id` en consulta de cursos
- [ ] Incluir `assigned_to` y `completed_by` en respuesta
- [ ] Verificar que `/assign` y `/bulk-assign` no validen programa
- [ ] Agregar tests unitarios para asignación cross-programa
- [ ] Actualizar documentación de API
- [ ] (Opcional) Crear endpoint `/courses/by-month`
- [ ] (Opcional) Implementar log de auditoría

---

## 🚀 Próximos Pasos

### 1. **Validar con Backend Developer:**
Confirmar si actualmente hay filtro por programa o no.

### 2. **Implementar Cambios:**
Si existe filtro, eliminarlo según especificaciones.

### 3. **Testing:**
Probar asignación cross-programa en staging.

### 4. **Deploy:**
Coordinar deploy de backend + frontend.

---

## 📄 Archivos Afectados

### Backend (Laravel):
- `app/Http/Controllers/CourseController.php`
- `routes/api.php` (si se agrega nuevo endpoint)
- `tests/Feature/CourseAssignmentTest.php` (tests)

### Frontend (Next.js):
- ✅ `components/bulk-assignment-improved-panel.tsx` (actualizado)
- ✅ `components/views/student-cards.tsx` (actualizado)
- ✅ `services/courses.ts` (sin cambios necesarios)

---

**Estado:** ⏳ **PENDIENTE DE IMPLEMENTACIÓN EN BACKEND**  
**Prioridad:** ALTA  
**Tipo:** Cambio de lógica de negocio  
**Impacto:** Medio (cambio en reglas de asignación)

---

**Fecha de requerimiento:** 2025-10-30  
**Solicitado por:** Usuario final  
**Documentado por:** GitHub Copilot
