# 🔍 Diagnóstico Completo: Moodle funciona en Insomnia pero no en la App

## ✅ Lo que sabemos

### 1. **En Insomnia funciona:**
- URL: `https://campusamerican.com/webservice/rest/server.php`
- Token: `47fc2203f86a7f5f6c9cb6052e87ea7b`
- Función: `core_course_get_courses`
- Respuesta: Array de cursos (JSON válido)

### 2. **En la aplicación NO funciona:**
- Mismo token
- Misma URL
- Mismo endpoint
- Error: No se cargan cursos

---

## 🔎 Causas Posibles

### A. Variables de Entorno No Cargadas
**Síntoma:** El token aparece vacío en runtime  
**Causa:** Next.js usa las variables en build-time  
**Solución:**
```powershell
# Reiniciar el servidor de desarrollo
Ctrl+C
npm run dev
```

### B. Error de Permisos en el Servicio Web
**Síntoma:** Error `accessexception` en consola  
**Causa:** El servicio web de Moodle NO tiene habilitada la función `core_course_get_courses`  
**Solución:** Ver `SOLUCION_DEFINITIVA_MOODLE.md`

### C. Respuesta de Moodle Diferente
**Síntoma:** La app espera un formato diferente al que devuelve Moodle  
**Causa:** Código antiguo esperaba `res.data.courses` pero ahora Moodle devuelve array directo  

---

## 🛠️ Pasos de Diagnóstico

### Paso 1: Verificar Variables de Entorno
```powershell
npm run check:env
```

**Resultado esperado:**
```
✅ NEXT_PUBLIC_MOODLE_URL: https://campusamerican.com
✅ NEXT_PUBLIC_MOODLE_TOKEN: 47fc2203f8... (32 caracteres)
✅ NEXT_PUBLIC_MOODLE_FORMAT: json
```

### Paso 2: Probar Conexión desde Script
```powershell
npm run test:moodle
```

**Resultado esperado:**
```
✅ Conexión exitosa!
   Sitio: American School of Management
✅ 15 cursos encontrados
```

**Si falla con `accessexception`:**
Ve al **Paso 4: Configurar Servicio Web**

### Paso 3: Verificar en Navegador
1. Abre: `http://localhost:3000/academico/moodle`
2. Abre DevTools (F12) → Consola
3. Busca los logs que empiezan con:
   ```
   🔄 Iniciando petición a Moodle Web Services...
   📍 Base URL: ...
   🔑 Token: ...
   ```

**Si ves:** `🔑 Token: NO CONFIGURADO`  
→ El servidor no reinició. Vuelve al **Paso 1**

**Si ves:** `❌ Error de Moodle: Excepción al control de acceso`  
→ Ve al **Paso 4**

**Si ves:** `✅ 15 cursos obtenidos` pero no aparecen en pantalla  
→ Problema en el componente React (revisar estado/renderizado)

### Paso 4: Configurar Servicio Web en Moodle

#### 4.1. Acceder como Admin
```
https://campusamerican.com
→ Iniciar sesión (admin)
```

#### 4.2. Habilitar Web Services
```
Administración del sitio
→ Funciones avanzadas
→ ☑ Enable web services
→ Guardar
```

#### 4.3. Configurar Servicio Externo
```
Administración del sitio
→ Servidor
→ Servicios externos
→ Buscar el servicio asociado a tu token
   (ej: "Moodle mobile web service")
→ Click en "Funciones"
```

#### 4.4. Añadir Funciones Requeridas
Click "Añadir funciones" y marca:
- ✅ `core_webservice_get_site_info`
- ✅ `core_course_get_courses`
- ✅ `core_course_get_categories` (opcional)

Guardar cambios.

#### 4.5. Verificar
```powershell
npm run test:moodle
```

Debería mostrar: `✅ Conexión exitosa!`

---

## 📊 Tabla de Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `invalidtoken` | Token no existe o expirado | Generar nuevo token |
| `accessexception` | Servicio sin permisos para la función | Añadir función al servicio (Paso 4) |
| `Token: NO CONFIGURADO` | Variables de entorno no cargadas | Reiniciar `npm run dev` |
| `CORS error` | Petición bloqueada por política de origen | Verificar URL (debe ser HTTPS) |
| Cursos vacíos pero sin error | Respuesta exitosa sin cursos | Verificar que existan cursos en Moodle |

---

## 🎯 Checklist de Verificación

- [ ] `.env` contiene `NEXT_PUBLIC_MOODLE_TOKEN=47fc2203f86a7f5f6c9cb6052e87ea7b`
- [ ] Servidor reiniciado después de modificar `.env`
- [ ] `npm run check:env` muestra todas las variables ✅
- [ ] `npm run test:moodle` funciona sin errores
- [ ] Web Services habilitados en Moodle Admin
- [ ] Función `core_course_get_courses` añadida al servicio
- [ ] Consola del navegador muestra el token correctamente
- [ ] No hay errores de `accessexception` en consola

---

## 📞 Próximo Paso

**Ejecuta en orden:**

1. ```powershell
   npm run check:env
   ```

2. ```powershell
   npm run test:moodle
   ```

3. Si ambos pasan ✅, el problema está en el componente React
4. Si `test:moodle` falla con `accessexception`, sigue el **Paso 4**
