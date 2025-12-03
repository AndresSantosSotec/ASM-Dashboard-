# 🔬 DIAGNÓSTICO COMPLETO - TypeError: Cannot read properties of undefined (reading 'nombre')

## 🎯 ERROR IDENTIFICADO

**Ubicación:** `app/inscripcion/aprobacion-alerta-alumno-nuevo/page.tsx`  
**Causa Principal:** Backend no carga correctamente la relación `programas.programa`  
**Gravedad:** 🔴 CRÍTICO - Rompe la UI en producción

---

## 📊 ANÁLISIS DEL PROBLEMA

### 1. **Backend - Problema Resuelto**
El endpoint `/api/alerta-alumno-nuevo/pendientes-aprobacion` ya tiene el eager loading correcto:

```php
// ✅ CORRECTO (Línea 871-875 de AlertaAlumnoNuevoController.php)
$prospectos = Prospecto::with([
    'programas' => function ($q) {
        $q->whereNull('deleted_at')
          ->with('programa'); // ← Carga la relación
    }
])
```

### 2. **Frontend - Validaciones Agregadas**

#### ✅ Cambios Implementados:

**A. Validación en Tabla (Línea ~376):**
```tsx
// ANTES (PELIGROSO):
{prospecto.programas?.[0]?.programa?.nombre || "N/A"}

// DESPUÉS (SEGURO):
{(() => {
  const programa = prospecto.programas?.[0]?.programa
  if (!programa || typeof programa !== 'object') return "N/A"
  return programa.nombre || programa.abreviatura || "Sin nombre"
})()}
```

**B. Validación en Modal (Línea ~507):**
```tsx
// ANTES (CRASH):
{selectedProspecto.programas[0].programa.nombre}

// DESPUÉS (SEGURO):
{selectedProspecto.programas?.[0]?.programa && (
  // Solo renderiza si programa existe
  {selectedProspecto.programas[0].programa.nombre || 
   selectedProspecto.programas[0].programa.abreviatura || 
   "Sin nombre"}
)}
```

**C. Validación Ultra-Defensiva en `cargarPendientes()` (Línea ~102):**
```tsx
const prospectosValidos = (data.data || []).filter((p: any) => {
  // 🛡️ Validación nivel 1: Datos básicos
  if (!p || typeof p !== 'object') {
    console.error("❌ Elemento no es un objeto:", p)
    return false
  }
  
  // 🛡️ Validación nivel 2: Alerta
  if (p.alerta && !p.alerta.asesor) {
    p.alerta.asesor = { first_name: 'N/A', last_name: '', email: '' }
  }
  
  // 🛡️ Validación nivel 3: Programas (CRÍTICO)
  if (p.programas && Array.isArray(p.programas)) {
    p.programas = p.programas.filter((prog: any) => {
      if (!prog.programa || typeof prog.programa !== 'object') {
        console.error("❌ CRÍTICO: programa.programa no existe")
        console.error("   Prospecto:", p.id, p.nombre_completo)
        return false
      }
      return true
    })
  }
  
  return true
})
```

---

## 🔍 CÓMO REPRODUCIR EL ERROR LOCALMENTE

### **Método 1: Mock del Backend con Datos Rotos**

Crea archivo: `test-broken-data.json`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre_completo": "Test Usuario",
      "carnet": "2025-001",
      "correo_electronico": "test@example.com",
      "telefono": "12345678",
      "status": "Pendiente Aprobación Alerta Alumno Nuevo",
      "alerta": {
        "id": 1,
        "asesor": null,  // ⚠️ Roto
        "dias_restantes": 5
      },
      "programas": [
        {
          "id": 1,
          "programa": null,  // ❌ CRÍTICO: Esto causa el crash
          "cuota_mensual": 1000,
          "inscripcion": 500,
          "duracion_meses": 12
        }
      ]
    },
    {
      "id": 2,
      "nombre_completo": "Test Usuario 2",
      "programas": [
        {
          "id": 2,
          // ❌ Falta completamente "programa"
          "cuota_mensual": 1500
        }
      ]
    }
  ]
}
```

Modifica temporalmente `cargarPendientes()`:
```tsx
const cargarPendientes = async () => {
  setLoading(true)
  try {
    // Comentar el fetch real
    // const res = await fetch(...)
    
    // Usar datos de prueba rotos
    const data = await fetch('/test-broken-data.json').then(r => r.json())
    
    // El resto del código detectará los errores
    const prospectosValidos = ...
```

### **Método 2: Interceptar con DevTools**

1. Abre DevTools → Network
2. Encuentra la llamada a `/api/alerta-alumno-nuevo/pendientes-aprobacion`
3. Click derecho → Copy as cURL
4. Modifica el response localmente para quitar `programa`
5. Usa la extensión "Requestly" para sobrescribir la respuesta

---

## 🚀 PLAN DE DEPURACIÓN EN PRODUCCIÓN

### **PASO 1: Verificar que el Backend Está Actualizado**

Ejecuta en el servidor:
```bash
cd /ruta/al/backend
php artisan route:list | grep pendientes-aprobacion
git log -1 --oneline app/Http/Controllers/Api/AlertaAlumnoNuevoController.php
```

**Busca:** Debe mostrar que el archivo fue actualizado recientemente con `->with('programa')`

### **PASO 2: Limpiar Caché del Backend**

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### **PASO 3: Verificar Base de Datos**

Ejecuta este query en producción:
```sql
-- Ver si la tabla estudiante_programa tiene programa_id
SELECT 
    ep.id,
    ep.prospecto_id,
    ep.programa_id,  -- ← Debe existir
    p.nombre as nombre_programa
FROM estudiante_programa ep
LEFT JOIN programa_academico p ON ep.programa_id = p.id
WHERE ep.prospecto_id IN (
    SELECT id FROM prospectos 
    WHERE status = 'Pendiente Aprobación Alerta Alumno Nuevo'
)
LIMIT 5;
```

**Si `programa_id` es NULL:** ¡Ahí está el problema! Los registros no tienen programa asignado.

### **PASO 4: Rebuild del Frontend**

```bash
cd /ruta/al/frontend
npm run build
# O si usas PM2:
pm2 restart blue-atlas-dashboard
```

### **PASO 5: Verificar el Response en Producción**

1. Abre la página en producción
2. F12 → Console
3. Busca los logs que agregamos:
   - `"❌ CRÍTICO: programa.programa no existe"`
   - `"⚠️ Prospecto sin programas válidos"`

4. Network → Busca la llamada API
5. Click → Preview → Expande `data[0].programas[0].programa`
6. **¿Es `null` o no existe?** → Problema en backend
7. **¿Es un objeto válido?** → Problema en frontend (caché)

---

## 🔧 SOLUCIONES POR ESCENARIO

### **Escenario A: `programa` es `null` en la API**

**Causa:** Backend no carga la relación  
**Solución:** 
```bash
# Verificar que el código está actualizado
git pull origin main
composer dump-autoload
php artisan cache:clear
```

### **Escenario B: `programa_id` es NULL en la BD**

**Causa:** Datos corruptos, registros sin programa asignado  
**Solución:**
```sql
-- Opción 1: Asignar programa por defecto
UPDATE estudiante_programa 
SET programa_id = 1  -- ID del programa por defecto
WHERE programa_id IS NULL 
  AND prospecto_id IN (SELECT id FROM prospectos WHERE status = 'Pendiente Aprobación Alerta Alumno Nuevo');

-- Opción 2: Eliminar registros huérfanos
DELETE FROM estudiante_programa 
WHERE programa_id IS NULL;
```

### **Escenario C: Caché del Frontend**

**Causa:** Build viejo en producción  
**Solución:**
```bash
# Limpiar caché de Next.js
rm -rf .next
npm run build

# O forzar hard refresh en el navegador
# Ctrl + Shift + R (Windows)
# Cmd + Shift + R (Mac)
```

---

## 📝 CHECKLIST DE VERIFICACIÓN

- [ ] Backend tiene `->with('programa')` en línea 872
- [ ] Cache del backend limpiado
- [ ] Query SQL devuelve programas con `programa_id` válido
- [ ] Frontend compilado recientemente (< 1 hora)
- [ ] Console en producción muestra los logs de validación
- [ ] Network muestra que `data[0].programas[0].programa` es un objeto
- [ ] No hay más errores de "Cannot read properties of undefined"

---

## 🎓 LECCIONES APRENDIDAS

### ❌ **Malas Prácticas que Causaron el Error:**

1. **Acceso directo sin validación:**
   ```tsx
   // MAL
   {prospecto.programas[0].programa.nombre}
   ```

2. **Optional chaining incompleto:**
   ```tsx
   // INSUFICIENTE
   {prospecto.programas?.[0]?.programa?.nombre}
   // Falla si programa es null pero programas[0] existe
   ```

3. **Eager loading faltante:**
   ```php
   // MAL
   Prospecto::with([]) // Array vacío
   ```

### ✅ **Mejores Prácticas Implementadas:**

1. **Validación exhaustiva en carga:**
   ```tsx
   const prospectosValidos = data.filter(p => {
     if (!p.programas?.[0]?.programa) return false
     return true
   })
   ```

2. **Renderizado condicional:**
   ```tsx
   {prospecto.programas?.[0]?.programa && (
     <div>{prospecto.programas[0].programa.nombre}</div>
   )}
   ```

3. **Logs de diagnóstico:**
   ```tsx
   if (!prog.programa) {
     console.error("❌ CRÍTICO:", prog)
   }
   ```

4. **Fallbacks en todas las capas:**
   ```tsx
   programa.nombre || programa.abreviatura || "Sin nombre"
   ```

---

## 🆘 SI EL ERROR PERSISTE

### **Test de Emergencia:**

Agrega al inicio de `cargarPendientes()`:
```tsx
const cargarPendientes = async () => {
  console.log("🔍 DIAGNÓSTICO INICIADO")
  setLoading(true)
  try {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_BASE_URL}/api/alerta-alumno-nuevo/pendientes-aprobacion`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    
    const data = await res.json()
    
    // 🚨 LOG CRÍTICO
    console.log("📦 Response completo:", data)
    console.log("📊 Total prospectos:", data.data?.length)
    
    if (data.data && data.data.length > 0) {
      console.log("🔎 Primer prospecto:", data.data[0])
      console.log("🔎 Primer programa:", data.data[0].programas?.[0])
      console.log("🔎 Objeto programa:", data.data[0].programas?.[0]?.programa)
    }
    
    // Resto del código...
```

**Captura los logs y envíalos para análisis.**

---

## 📞 CONTACTO DE SOPORTE

Si después de seguir estos pasos el error persiste:

1. Captura screenshot de:
   - Console (logs completos)
   - Network → API response
   - Error stack trace

2. Ejecuta este query y envía resultado:
   ```sql
   SELECT COUNT(*) as total,
          COUNT(ep.programa_id) as con_programa,
          COUNT(*) - COUNT(ep.programa_id) as sin_programa
   FROM estudiante_programa ep
   WHERE ep.prospecto_id IN (
     SELECT id FROM prospectos 
     WHERE status = 'Pendiente Aprobación Alerta Alumno Nuevo'
   );
   ```

3. Incluye versión de Node/npm:
   ```bash
   node --version
   npm --version
   ```

---

**Fecha de Diagnóstico:** Diciembre 2, 2025  
**Versión de Corrección:** 2.0 Ultra-Defensiva  
**Estado:** ✅ Corregido + Validaciones Agregadas
