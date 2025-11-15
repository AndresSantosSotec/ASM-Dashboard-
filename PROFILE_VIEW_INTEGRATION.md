# Integración de Datos Reales en ProfileView

## Fecha: 2025-01-14

## Resumen de Cambios

Se ha completado la integración de datos reales desde la API en el componente `ProfileView` (`profile-view.tsx`), reemplazando todos los datos mock con información proveniente de:
- PostgreSQL (prospectos, estudiante_programa, profile_student)
- MySQL/Moodle (historial académico)

---

## Cambios Implementados

### 1. **Estado y Carga de Datos**

#### Estados Agregados:
```typescript
const [loading, setLoading] = useState(true)
const [perfilData, setPerfilData] = useState<PerfilData | null>(null)
const [historialAcademico, setHistorialAcademico] = useState<HistorialAcademico | null>(null)
```

#### Función de Carga:
```typescript
const cargarDatos = async () => {
  const [perfil, historial] = await Promise.all([
    profileService.getMiPerfil(),
    profileService.getHistorialAcademico()
  ])
  
  setPerfilData(perfil)
  setHistorialAcademico(historial)
  
  // Inicializar formData con datos editables
  setFormData({
    telefono: perfil.perfil_editable.telefono || "",
    telefono_emergencia: perfil.perfil_editable.telefono_emergencia || "",
    nombre_contacto_emergencia: perfil.perfil_editable.nombre_contacto_emergencia || "",
    parentesco_emergencia: perfil.perfil_editable.parentesco_emergencia || "",
    direccion: perfil.perfil_editable.direccion || "",
    ciudad: perfil.perfil_editable.ciudad || "",
    biografia: perfil.perfil_editable.biografia || "",
  })
}
```

---

### 2. **Encabezado del Perfil**

#### Avatar:
- **Antes:** Foto mock estática
- **Ahora:** `perfilData.perfil_editable.foto_perfil` con fallback a placeholder
- Iniciales calculadas desde `perfilData.prospecto.nombre_completo`

#### Información del Estudiante:
- **Nombre:** `perfilData.prospecto.nombre_completo`
- **Programa:** `perfilData.programa.nombre`
- **Estado:** `perfilData.programa.estado` (con fallback "Activo")
- **Carnet:** `perfilData.prospecto.carnet`

---

### 3. **Pestaña: Información Personal**

#### Campos de Solo Lectura (del prospecto):
- **Carnet:** `perfilData.prospecto.carnet`
- **Correo:** `perfilData.prospecto.correo_electronico`
- **Programa:** `perfilData.programa?.nombre`
- **Fecha de Inicio:** `perfilData.programa?.fecha_inicio` (formateado con date-fns)

#### Campos Editables (de profile_student):
- **Teléfono:** `formData.telefono`
- **Dirección:** `formData.direccion` y `formData.ciudad`
- **Contacto de Emergencia:** 
  - Nombre: `formData.nombre_contacto_emergencia`
  - Teléfono: `formData.telefono_emergencia`
  - Parentesco: `formData.parentesco_emergencia`
- **Biografía:** `formData.biografia`

#### Completitud del Perfil:
Cálculo dinámico basado en campos completados:
```typescript
const fields = [
  perfilData.perfil_editable.telefono,
  perfilData.perfil_editable.telefono_emergencia,
  perfilData.perfil_editable.direccion,
  perfilData.perfil_editable.ciudad,
  perfilData.perfil_editable.biografia,
  perfilData.perfil_editable.foto_perfil
]
const percentage = (fieldsCompleted / totalFields) * 100
```

---

### 4. **Pestaña: Historial Académico**

#### Tarjetas de Resumen:
- **Promedio General:** Calculado desde cursos con calificación
- **Cursos Completados:** `historialAcademico.cursos.filter(c => c.calificacion !== null).length`
- **Total Cursos:** `historialAcademico.cursos.length`

#### Tabla de Cursos:
Columnas actualizadas con datos reales de Moodle:
- **Curso:** `course.curso`
- **Código:** `course.codigo_curso`
- **Fecha Inicio:** `course.fecha_inicio` (formateado)
- **Calificación:** `course.calificacion` (con formato decimal)
- **Estado:** `course.estado` (Aprobado/En curso/Reprobado con badges de colores)

---

### 5. **Guardado de Cambios**

#### Función actualizada:
```typescript
const handleSaveProfile = async () => {
  await profileService.actualizarPerfil(formData)
  
  toast({
    title: "Perfil actualizado",
    description: "Los cambios se guardaron correctamente"
  })
  
  setIsEditing(false)
  await cargarDatos() // Recargar datos
}
```

#### Botones de Edición:
- Modo lectura: Botón "Editar Perfil"
- Modo edición: Botones "Cancelar" y "Guardar Cambios" (con loader)

---

### 6. **Estados de Carga y Error**

#### Loading State:
```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
```

#### Error State:
```typescript
if (!perfilData) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-muted-foreground">No se pudo cargar el perfil</p>
    </div>
  )
}
```

---

## Estructura de Datos Utilizada

### API Endpoints:
- `GET /api/estudiante/perfil/mi-perfil` → `PerfilData`
- `GET /api/estudiante/perfil/historial-academico` → `HistorialAcademico`
- `PUT /api/estudiante/perfil/actualizar` → `UpdateProfileData`

### Tipos TypeScript:
```typescript
interface PerfilData {
  prospecto: Prospecto              // SOLO LECTURA
  programa: ProgramaAcademico       // SOLO LECTURA
  perfil_editable: ProfileStudent   // EDITABLE
  estadisticas: AcademicStats       // SOLO LECTURA
}

interface HistorialAcademico {
  resumen: AcademicStats
  cursos: CourseHistoryItem[]
  nombre_completo: string
  username: string
}
```

---

## Flujo de Datos

```
Frontend (ProfileView)
    ↓
profileService
    ↓
API Laravel (/api/estudiante/perfil/...)
    ↓
EstudiantePerfilController
    ↓
PostgreSQL (prospectos, estudiante_programa, profile_student)
+
MySQL (Moodle: mdl_user, mdl_course, mdl_grade_grades)
    ↓
Respuesta JSON
    ↓
Estado React (perfilData, historialAcademico)
    ↓
UI (Renderizado)
```

---

## Funcionalidades Completadas

✅ Carga de datos reales desde API  
✅ Separación de campos de solo lectura vs editables  
✅ Edición de campos personales (teléfono, dirección, etc.)  
✅ Guardado de cambios con toast notifications  
✅ Historial académico desde Moodle  
✅ Cálculo de promedio general  
✅ Indicador de completitud del perfil  
✅ Estados de carga y error  
✅ Formato de fechas localizadas (español)  

---

## Campos Mock Restantes (No Implementados)

⚠️ **Pestaña Seguridad:** Todos los elementos son UI mock:
- Cambiar contraseña
- Autenticación de dos factores
- Sesiones activas
- Desactivar cuenta

**Nota:** Estas funcionalidades requieren implementación backend adicional.

---

## Validación de Calidad

✅ **Sin errores TypeScript**  
✅ **Sin warnings de lint**  
✅ **Tipos correctamente definidos**  
✅ **Manejo de errores con try/catch**  
✅ **Loading states implementados**  
✅ **Null checks en toda la UI**  
✅ **Formato de datos consistente**  

---

## Próximos Pasos Sugeridos

1. **Subida de foto de perfil:** Implementar endpoint para cargar imágenes
2. **Cambio de contraseña:** Backend endpoint + validación
3. **2FA:** Sistema de autenticación de dos factores
4. **Descargar historial:** Generar PDF del historial académico
5. **Gestión de sesiones:** API para listar/cerrar sesiones activas

---

## Archivos Modificados

- `d:\ASMProlink\blue-atlas-dashboard\components\estudiantes\profile-view.tsx`

## Archivos Relacionados

- `d:\ASMProlink\blue-atlas-dashboard\services\profile.ts` (tipos y servicios)
- `d:\ASMProlink\blue_atlas_backend\app\Http\Controllers\Api\EstudiantePerfilController.php` (backend)

---

## Mantenimiento

Para actualizar o extender esta funcionalidad:

1. **Agregar nuevo campo editable:**
   - Añadir columna en tabla `profile_student` (migración)
   - Actualizar interface `ProfileStudent` en `profile.ts`
   - Agregar campo en `formData` state
   - Incluir en formulario de edición

2. **Modificar datos de Moodle:**
   - Actualizar query SQL en `EstudiantePerfilController::historialAcademico()`
   - Actualizar interface `CourseHistoryItem` si es necesario
   - Ajustar UI en pestaña "Historial Académico"

---

**Integración completada con éxito** ✅
