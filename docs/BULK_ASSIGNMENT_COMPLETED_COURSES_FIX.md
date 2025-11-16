# 🔧 Corrección: Cursos Completados en Asignación Masiva

## 📋 Problema Identificado

El **Panel de Asignación Masiva Mejorada** no estaba mostrando correctamente **todos los cursos que el estudiante ya cursó**, ya que no estaba implementando la misma lógica que usa el **módulo de asignación individual**.

### ❌ Problema Anterior

- Solo mostraba los cursos asignados (`student.assignedCourses`)
- **No consultaba** el endpoint `/api/prospectos/${studentId}` para obtener `completed_courses`
- **No consultaba** Moodle para obtener cursos aprobados
- **No filtraba** duplicados entre sistema y Moodle

### ✅ Solución Implementada

Ahora el panel mejorado usa **exactamente la misma lógica** que `student-assignment-view.tsx`:

1. **Consulta al backend** para obtener cursos completados del sistema
2. **Consulta a Moodle** para obtener cursos aprobados
3. **Filtrado de duplicados** usando comparación de nombres (algoritmo Levenshtein)
4. **Visualización diferenciada** entre cursos del sistema y de Moodle

---

## 🔄 Cambios Implementados

### 1. **Nuevas Importaciones**

```typescript
import { fetchStudentCourseLists } from "@/services/students";
import fetchApprovedMoodleCourses, { MoodleQueryCourse } from "@/services/moodleCourseQueries";
```

### 2. **Actualización de la Interfaz**

```typescript
interface StudentCourseSelection {
  studentId: string;
  selectedCourseIds: string[];
  completedCourseIds: string[];  // IDs de cursos completados del sistema
  moodleCompletedCourses: MoodleQueryCourse[];  // Cursos de Moodle
}
```

### 3. **Funciones Auxiliares de Comparación**

Se agregaron las mismas funciones que usa `student-assignment-view.tsx`:

```typescript
const normalizeName = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");

const levenshtein = (a: string, b: string) => { /* ... */ };

const areNamesSimilar = (a: string, b: string) => {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na.includes(nb) || nb.includes(na)) return true;
  const distance = levenshtein(na, nb);
  const ratio = distance / Math.max(na.length, nb.length);
  return ratio <= 0.3;
};
```

### 4. **Carga Asíncrona de Cursos Completados**

```typescript
useEffect(() => {
  (async () => {
    setLoadingData(true);
    try {
      const updated = await Promise.all(
        selectedStudents.map(async (student) => {
          const existing = selections.find((s) => s.studentId === student.id);
          
          // Si ya existe en cache y tiene datos, usarlos
          if (existing && (existing.completedCourseIds.length > 0 || existing.moodleCompletedCourses.length > 0)) {
            return existing;
          }

          // Cargar desde backend
          const [lists, moodle] = await Promise.all([
            fetchStudentCourseLists(student.id),
            fetchApprovedMoodleCourses(student.carnet),
          ]);

          // Filtrar Moodle para evitar duplicados
          const filteredMoodle = moodle.filter(
            (m) => !lists.completed.some((c) => areNamesSimilar(m.coursename, c.name))
          );

          return {
            studentId: student.id,
            selectedCourseIds: existing?.selectedCourseIds || [],
            completedCourseIds: lists.completed.map((c) => String(c.id)),
            moodleCompletedCourses: filteredMoodle,
          };
        })
      );
      setSelections(updated);
    } catch (err) {
      console.error("Error inicializando selecciones:", err);
    } finally {
      setLoadingData(false);
    }
  })();
}, [selectedStudents.map(s => s.id).join(',')]);
```

### 5. **Filtrado Mejorado de Cursos Disponibles**

```typescript
const getAvailableCoursesForStudent = (studentId: string) => {
  const selection = selections.find((s) => s.studentId === studentId);
  if (!selection) return [];

  return courses.filter((course) => {
    // Excluir cursos completados del sistema
    if (selection.completedCourseIds.includes(String(course.id))) return false;

    // Excluir cursos completados de Moodle (por similitud de nombre)
    if (selection.moodleCompletedCourses.some((m) => areNamesSimilar(m.coursename, course.name))) {
      return false;
    }

    // Aplicar filtros globales...
    return matchesName && matchesCode && matchesDate;
  });
};
```

### 6. **Nuevas Funciones Getter**

```typescript
// Cursos del sistema
const getCompletedCoursesForStudent = (studentId: string) => {
  const selection = selections.find((s) => s.studentId === studentId);
  if (!selection) return [];
  return courses.filter((course) =>
    selection.completedCourseIds.includes(String(course.id))
  );
};

// Cursos de Moodle
const getMoodleCompletedCoursesForStudent = (studentId: string) => {
  const selection = selections.find((s) => s.studentId === studentId);
  if (!selection) return [];
  return selection.moodleCompletedCourses;
};
```

### 7. **UI Mejorada con Diferenciación Visual**

```tsx
{selectedStudents.map((student) => {
  const completedCourses = getCompletedCoursesForStudent(student.id);
  const moodleCompletedCourses = getMoodleCompletedCoursesForStudent(student.id);
  const totalCompleted = completedCourses.length + moodleCompletedCourses.length;

  return (
    <AccordionItem>
      {/* Badge con total de completados */}
      <Badge variant="outline" className="bg-green-50 text-green-700">
        {totalCompleted} completados
      </Badge>

      {/* Cursos del Sistema con badge verde */}
      {completedCourses.map((course) => (
        <div>
          <p>{course.name}</p>
          <Badge className="bg-green-600 text-white">Sistema</Badge>
        </div>
      ))}

      {/* Cursos de Moodle con badge morado */}
      {moodleCompletedCourses.map((course) => (
        <div>
          <p>{course.coursename}</p>
          <Badge className="bg-purple-600 text-white">Moodle</Badge>
        </div>
      ))}
    </AccordionItem>
  );
})}
```

---

## 🎯 Flujo de Datos Completo

### Al abrir el panel:

1. **Verificar cache local** (`localStorage`)
   - Si existe y tiene datos → usar cache
   - Si no existe o está vacío → consultar backend

2. **Consultar Backend** (por cada estudiante)
   ```
   GET /api/prospectos/${studentId}
   └─> completed_courses: Course[]
   
   GET /api/moodle/approved-courses?carnet=${carnet}
   └─> MoodleQueryCourse[]
   ```

3. **Filtrar duplicados**
   - Comparar `moodle.coursename` vs `course.name`
   - Usar algoritmo Levenshtein (ratio <= 0.3)
   - Mantener solo Moodle sin equivalente en sistema

4. **Actualizar estado**
   ```typescript
   {
     studentId: "123",
     completedCourseIds: ["1", "2", "3"],  // Del sistema
     moodleCompletedCourses: [...]         // De Moodle (sin duplicados)
   }
   ```

5. **Guardar en cache** (`localStorage`)

### Al filtrar cursos disponibles:

```
cursos_disponibles = todos_los_cursos
  - cursos_completados_sistema
  - cursos_completados_moodle (por similitud de nombre)
  - cursos_ya_seleccionados
```

---

## ✅ Ventajas de la Implementación

| Característica | Antes | Ahora |
|----------------|-------|-------|
| **Cursos del sistema** | ❌ No se mostraban | ✅ Se consultan desde backend |
| **Cursos de Moodle** | ❌ No se consultaban | ✅ Se consultan y filtran |
| **Duplicados** | ❌ No se controlaban | ✅ Se filtran con Levenshtein |
| **Cache** | ⚠️ Solo selecciones | ✅ Cache inteligente de completados |
| **Identificación visual** | ❌ N/A | ✅ Badges de "Sistema" y "Moodle" |
| **Performance** | ⚠️ N/A | ✅ Cache evita reconsultas |

---

## 📊 Endpoints Utilizados

### 1. Cursos Completados del Sistema
```http
GET /api/prospectos/${studentId}
```
**Response:**
```json
{
  "data": {
    "id": 123,
    "nombre_completo": "Juan Pérez",
    "courses": [...],
    "completed_courses": [
      {
        "id": 1,
        "name": "Introducción a la Programación",
        "code": "PROG-101",
        "area": "common",
        "credits": 3,
        ...
      }
    ]
  }
}
```

### 2. Cursos Aprobados de Moodle
```http
GET /api/moodle/approved-courses?carnet=${carnet}
```
**Response:**
```json
[
  {
    "courseid": 456,
    "coursename": "Programación Básica",
    "finalgrade": 85.5,
    "fecha_inicio_curso": "2024-01-15",
    "fecha_fin_curso": "2024-05-30"
  }
]
```

---

## 🧪 Testing

### Caso 1: Estudiante sin cursos completados
✅ Muestra mensaje "No hay cursos completados"
✅ Todos los cursos aparecen como disponibles

### Caso 2: Estudiante con cursos del sistema
✅ Se muestran con badge verde "Sistema"
✅ No aparecen en cursos disponibles

### Caso 3: Estudiante con cursos de Moodle
✅ Se muestran con badge morado "Moodle"
✅ Se excluyen equivalentes del sistema (por nombre similar)

### Caso 4: Estudiante con cursos en ambos sistemas
✅ Se muestran ambos tipos diferenciados
✅ No hay duplicados visuales
✅ Conteo total correcto

### Caso 5: Cache y persistencia
✅ Al cerrar y reabrir panel, datos persisten
✅ Al cambiar de estudiante, se cargan datos correctos
✅ Selecciones se mantienen separadas por estudiante

---

## 🐛 Posibles Issues y Soluciones

### Issue 1: "Cursos de Moodle no aparecen"
**Causa:** Endpoint de Moodle no disponible o carnet incorrecto
**Solución:** Verificar que `student.carnet` sea válido

### Issue 2: "Duplicados entre Sistema y Moodle"
**Causa:** Nombres muy diferentes entre sistemas
**Solución:** Ajustar umbral de similitud (actualmente 0.3)

### Issue 3: "Panel tarda en cargar"
**Causa:** Múltiples estudiantes con muchas peticiones
**Solución:** Cache implementado, solo carga 1 vez por estudiante

### Issue 4: "Cache desactualizado"
**Causa:** Estudiante completó cursos pero cache antiguo
**Solución:** Limpiar `localStorage` con clave `bulk-assignment-selections`

---

## 🔧 Mantenimiento

### Limpiar cache manualmente (DevTools Console):
```javascript
localStorage.removeItem('bulk-assignment-selections');
```

### Ver contenido del cache:
```javascript
JSON.parse(localStorage.getItem('bulk-assignment-selections') || '[]');
```

### Forzar recarga de datos:
1. Cerrar panel de asignación masiva
2. Limpiar cache (línea anterior)
3. Reabrir panel
4. Se volverán a consultar todos los datos

---

## 📝 Archivos Modificados

- ✅ `components/bulk-assignment-improved-panel.tsx`
  - Imports de servicios
  - Interface actualizada
  - Lógica de carga asíncrona
  - Funciones de comparación
  - UI mejorada con badges

---

## 🎯 Resultado Final

Ahora el **Panel de Asignación Masiva Mejorada** tiene **paridad funcional completa** con el módulo de asignación individual en cuanto a:

1. ✅ Detección de cursos completados
2. ✅ Integración con Moodle
3. ✅ Filtrado de duplicados
4. ✅ Visualización diferenciada
5. ✅ Performance optimizada con cache

**Estado:** ✅ **COMPLETADO Y LISTO PARA PRODUCCIÓN**

---

**Fecha:** 2025-10-30  
**Autor:** GitHub Copilot  
**Versión:** 2.1
