# 🔧 Diagnóstico de Moodle - Guía de Solución de Problemas

## 🚨 Problema
Los cursos de Moodle ya no se están cargando en el dashboard.

## 🔍 Herramientas de Diagnóstico Implementadas

### 1. Página de Diagnóstico
Accede a: `/moodle/diagnostico`

Esta página te mostrará:
- ✅ Configuración actual de variables de entorno
- ✅ Estado de conexión a Moodle
- ✅ Prueba de Web Services
- ✅ Información detallada del sitio Moodle
- ✅ Recomendaciones específicas según los errores encontrados

### 2. Logs Mejorados en Consola
Abre las DevTools (F12) y ve a la pestaña Console para ver:
- 🔍 URL de conexión utilizada
- 🔑 Estado del token
- 📋 Parámetros enviados
- ✅/❌ Respuesta del servidor
- 📊 Datos recibidos

### 3. Mensajes de Error Mejorados
El componente ahora muestra:
- ⚠️ Mensajes de error claros
- 🔄 Botón de reintentar
- 📊 Contador de cursos encontrados

## 🔧 Pasos para Diagnosticar y Solucionar

### Paso 1: Verifica las Variables de Entorno
En el archivo `.env`, asegúrate de tener:

```env
NEXT_PUBLIC_MOODLE_URL=https://campusamerican.com
NEXT_PUBLIC_MOODLE_TOKEN=tu_token_aqui
NEXT_PUBLIC_MOODLE_FORMAT=json
```

**⚠️ IMPORTANTE:** Después de modificar `.env`, debes **reiniciar el servidor de desarrollo**.

```bash
# Detén el servidor (Ctrl+C) y ejecuta:
npm run dev
```

### Paso 2: Ejecuta el Diagnóstico
1. Ve a `/moodle/diagnostico`
2. Haz clic en "Ejecutar Diagnóstico"
3. Revisa los resultados

### Paso 3: Interpreta los Resultados

#### ❌ Error: "Token no configurado"
**Solución:**
```env
# Agrega o actualiza en .env:
NEXT_PUBLIC_MOODLE_TOKEN=db94ff5881e39a80211e89967ee42d5c
```
Luego reinicia el servidor.

#### ❌ Error: "invalidtoken"
**Solución:**
1. El token ha expirado o es inválido
2. Ve a Moodle → Administración → Tokens de Seguridad
3. Genera un nuevo token
4. Actualiza el `.env` con el nuevo token
5. Reinicia el servidor

#### ❌ Error: "webservicenotavailable"
**Solución:**
En Moodle, habilita los Web Services:
1. Administración del sitio → Funciones avanzadas
2. Marca "Enable web services"
3. Guardar cambios

#### ❌ Error de conexión / Timeout
**Soluciones:**
1. Verifica que la URL sea correcta
2. Verifica tu conexión a internet
3. El servidor de Moodle puede estar caído
4. Si tienes configurada una URL IP alternativa, el sistema intentará usarla automáticamente

### Paso 4: Verifica los Logs en Console
1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Busca mensajes que empiecen con:
   - 🔍 🔄 🌐 = Proceso de conexión
   - ✅ = Éxito
   - ❌ = Error

Ejemplos:
```
✅ 25 cursos obtenidos
❌ Error de Moodle: Invalid token
```

## 📝 Checklist de Verificación

- [ ] Variables de entorno configuradas en `.env`
- [ ] Servidor de desarrollo reiniciado después de modificar `.env`
- [ ] Token de Moodle válido y activo
- [ ] Web Services habilitados en Moodle
- [ ] URL de Moodle accesible desde el navegador
- [ ] Sin errores de CORS (verifica en Console)
- [ ] Diagnóstico ejecutado sin errores

## 🛠️ Comandos Útiles

### Reiniciar el servidor
```bash
npm run dev
```

### Ver todas las variables de entorno
```bash
# En PowerShell
Get-Content .env
```

### Probar conexión a Moodle manualmente
```bash
# En PowerShell
Invoke-WebRequest -Uri "https://campusamerican.com" -UseBasicParsing
```

## 🔐 Generar un Nuevo Token en Moodle

1. Inicia sesión en Moodle como administrador
2. Ve a: **Administración del sitio** → **Servidor** → **Tokens de seguridad**
3. En "Crear token", selecciona:
   - Usuario: Tu usuario de admin
   - Servicio: Crear uno nuevo o seleccionar existente
4. Haz clic en "Guardar cambios"
5. Copia el token generado
6. Pégalo en `.env`:
   ```env
   NEXT_PUBLIC_MOODLE_TOKEN=tu_nuevo_token_aqui
   ```
7. Reinicia el servidor

## 🎯 Mejoras Implementadas

1. **Logging detallado** - Cada petición muestra información completa en console
2. **Manejo de errores robusto** - Mensajes claros para cada tipo de error
3. **Página de diagnóstico** - Herramienta visual para verificar la configuración
4. **Botón de reintentar** - No necesitas recargar la página
5. **Contador de cursos** - Sabrás cuántos cursos se cargaron
6. **Fallback a URL IP** - Si la URL principal falla, intenta con la alternativa automáticamente
7. **Detección de errores de Moodle** - Muestra errores específicos del servidor Moodle

## 📞 Soporte

Si después de seguir estos pasos el problema persiste:
1. Captura de pantalla de la página de diagnóstico
2. Captura de pantalla de la consola (F12)
3. Contenido del archivo `.env` (SIN el token completo, solo confirma que existe)
4. Mensaje de error exacto que aparece

---

**Última actualización:** 24 de octubre de 2025
