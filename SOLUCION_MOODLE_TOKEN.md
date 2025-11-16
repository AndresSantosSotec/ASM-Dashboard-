# 🚨 PROBLEMA ENCONTRADO: Access Exception

## ❌ Error Detectado
```
Error de Moodle: Excepción al control de acceso
Código: accessexception
```

## 🔍 Causa del Problema
El token `db94ff5881e39a80211e89967ee42d5c` **no tiene los permisos necesarios** o **ha expirado**.

## ✅ SOLUCIÓN: Generar un Nuevo Token en Moodle

### Paso 1: Acceder a Moodle como Administrador
1. Ve a: https://campusamerican.com
2. Inicia sesión con una cuenta de **administrador**

### Paso 2: Navegar a Tokens de Seguridad
1. En el menú lateral, ve a: **Administración del sitio**
2. Haz clic en: **Servidor** → **Tokens de seguridad**
   - O accede directamente a: `https://campusamerican.com/admin/settings.php?section=webservicetokens`

### Paso 3: Verificar Web Services Habilitados
Antes de crear el token, verifica que los Web Services estén habilitados:

1. Ve a: **Administración del sitio** → **Funciones avanzadas**
2. Busca: **"Enable web services"**
3. Debe estar **MARCADO** ✅
4. Si no está marcado:
   - Márcalo
   - Haz clic en "Guardar cambios"

### Paso 4: Crear/Verificar el Servicio Web
1. Ve a: **Administración del sitio** → **Servidor** → **Servicios externos**
2. Busca un servicio existente o crea uno nuevo:
   - Nombre: "Dashboard API" (o el nombre que prefieras)
   - Nombre corto: `dashboard_api`
   - Habilitado: **Sí** ✅
   - Usuarios autorizados: Solo usuarios autorizados

3. Haz clic en "Funciones" del servicio
4. Agrega las siguientes funciones (capacidades):
   ```
   - core_webservice_get_site_info
   - core_course_get_courses
   - core_user_get_users
   - core_enrol_get_enrolled_users
   ```

### Paso 5: Crear un Nuevo Token
1. Ve a: **Administración del sitio** → **Servidor** → **Tokens de seguridad**
2. Haz clic en "Añadir"
3. Configura:
   - **Usuario**: Selecciona tu usuario administrador
   - **Servicio**: Selecciona el servicio creado ("Dashboard API")
   - **Dirección IP**: Déjalo en blanco (o especifica la IP de tu servidor si es necesario)
   - **Fecha de expiración**: Déjalo en blanco para que no expire
4. Haz clic en **"Guardar cambios"**

### Paso 6: Copiar el Nuevo Token
1. Se generará un token largo (32 caracteres)
2. **COPIA TODO EL TOKEN**
3. Ejemplo: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### Paso 7: Actualizar el Archivo .env
1. Abre el archivo `.env` en tu editor
2. Encuentra la línea:
   ```env
   NEXT_PUBLIC_MOODLE_TOKEN=db94ff5881e39a80211e89967ee42d5c
   ```
3. Reemplázala con tu nuevo token:
   ```env
   NEXT_PUBLIC_MOODLE_TOKEN=TU_NUEVO_TOKEN_AQUI
   ```
4. **GUARDA EL ARCHIVO**

### Paso 8: Reiniciar el Servidor
```bash
# En la terminal donde corre el servidor:
# 1. Detén el servidor (Ctrl+C)
# 2. Reinicia:
npm run dev
```

### Paso 9: Probar la Conexión
```bash
# Ejecuta de nuevo el test:
npm run test:moodle
```

Deberías ver:
```
✅ Conexión exitosa!
   Sitio: Campus American School
   Usuario: admin
   Versión: Moodle 3.x
```

---

## 🔧 Comandos Rápidos

### Para probar la conexión:
```bash
npm run test:moodle
```

### Para ver el dashboard:
1. Asegúrate de que el servidor esté corriendo: `npm run dev`
2. Ve a: http://localhost:3000/moodle/diagnostico

---

## ⚠️ Si Aún No Funciona

### Problema: "Web Services no habilitados"
**Solución:**
1. Administración del sitio → Funciones avanzadas
2. Marca "Enable web services"
3. Guardar cambios

### Problema: "Token inválido" después de generar uno nuevo
**Solución:**
1. Verifica que copiaste el token completo (32 caracteres)
2. No debe tener espacios al inicio o final
3. Reinicia el servidor después de cambiar el .env

### Problema: "Servicio no disponible"
**Solución:**
1. Verifica que el servicio web esté habilitado en Moodle
2. Verifica que el usuario tenga los permisos necesarios
3. Verifica que las funciones estén agregadas al servicio

---

## 📞 Contacto con el Administrador de Moodle

Si no tienes acceso de administrador a Moodle:
1. Contacta al administrador del sistema
2. Pide que genere un nuevo token
3. Solicita que incluya estas capacidades:
   - `core_webservice_get_site_info`
   - `core_course_get_courses`
   - `core_user_get_users`
   - `core_enrol_get_enrolled_users`

---

**Última actualización:** 24 de octubre de 2025
