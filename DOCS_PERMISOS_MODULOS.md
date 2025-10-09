# Documentación: Cómo Eliminar Permisos y Módulos

## Descripción General

Esta guía proporciona instrucciones paso a paso sobre cómo eliminar módulos completos y permisos del sistema ASM Dashboard. Es importante seguir estos pasos cuidadosamente para evitar referencias rotas o problemas en la aplicación.

## Estructura del Sistema

El sistema está organizado en las siguientes capas:
- **Páginas**: Definidas en `app/[modulo]/page.tsx`
- **Componentes**: Ubicados en `components/[modulo]/`
- **Navegación**: Menú lateral en `components/layout/sidebar2.tsx`
- **Permisos**: Gestionados a través del sistema de roles y permisos

## Proceso para Eliminar un Módulo

### Paso 1: Eliminar Componentes y Páginas

```bash
# Eliminar la carpeta del módulo en app/
rm -rf app/[nombre-modulo]

# Eliminar componentes relacionados
rm -f components/[nombre-modulo]/*
```

**Ejemplo**: Para eliminar el módulo de chat-docente:
```bash
rm -rf app/estudiantes/chat-docente
rm -f components/estudiantes/chat-docente.tsx
rm -f components/estudiantes/chat-bot.tsx
```

### Paso 2: Actualizar la Navegación (Sidebar)

Editar el archivo `components/layout/sidebar2.tsx` y eliminar las entradas del menú:

```typescript
// ANTES
<Link
  href="/estudiantes/chat-docente"
  className={`flex items-center px-4 py-1.5 rounded-md ${
    pathname === "/estudiantes/chat-docente" 
      ? "bg-asm-medium-gold text-white" 
      : "text-asm-light-gold hover:bg-asm-medium-gold/20"
  }`}
>
  <Mail size={16} className="mr-2" />
  <span>Chat Docente</span>
</Link>

// DESPUÉS: Eliminar completamente el bloque <Link>
```

### Paso 3: Eliminar Importaciones

Buscar y eliminar todas las importaciones del componente eliminado:

```bash
# Buscar referencias
grep -r "chat-docente" app/ components/

# Ejemplo de importaciones a eliminar:
# import ChatDocente from "@/components/estudiantes/chat-docente"
# import { ChatBot } from "./chat-bot"
```

### Paso 4: Actualizar Referencias en Otros Componentes

Si el módulo se usaba en otros lugares, eliminar esas referencias:

```typescript
// En student-dashboard.tsx
// ANTES
import { ChatBot } from "./chat-bot"
// ...
<ChatBot />

// DESPUÉS: Eliminar import y uso del componente
```

## Proceso para Eliminar Permisos

### Paso 1: Identificar el Permiso en la Base de Datos

Los permisos están almacenados en la tabla de base de datos. Necesitas el ID o nombre del permiso.

### Paso 2: Eliminar el Permiso del Backend

```sql
-- Ejemplo de consulta SQL
DELETE FROM permisos WHERE nombre = 'chat-docente';
DELETE FROM rol_permiso WHERE permiso_id = [ID_DEL_PERMISO];
```

### Paso 3: Actualizar el Frontend

Si hay validación de permisos en el frontend, eliminar esas verificaciones:

```typescript
// ANTES
{hasPermission('chat-docente') && (
  <Link href="/chat-docente">Chat</Link>
)}

// DESPUÉS: Eliminar completamente
```

## Componente de Gestión de Permisos

El sistema cuenta con un componente de gestión de permisos ubicado en:
- `components/permisos/permisos-modulos-tab.tsx`

Este componente permite:
- Crear nuevos módulos y permisos
- Asignar permisos a roles
- Visualizar la estructura de permisos

### Uso del Componente

```typescript
import { PermisosModulosTab } from "@/components/permisos/permisos-modulos-tab"

// En tu página
<PermisosModulosTab />
```

## Iconos Disponibles

Los iconos están definidos en `permisos-modulos-tab.tsx`. Los disponibles incluyen:

- `Home`, `Users`, `Mail`, `Calendar`, `Settings`
- `BarChart`, `FileText`, `Shield`, `DollarSign`
- `BookOpen`, `ClipboardList`, `Activity`, `Award`
- Y muchos más de `lucide-react`

Para agregar un nuevo icono:
```typescript
import { NuevoIcono } from "lucide-react"
```

## Checklist para Eliminar un Módulo Completo

- [ ] Eliminar carpeta en `app/[nombre-modulo]`
- [ ] Eliminar componentes en `components/[nombre-modulo]`
- [ ] Actualizar `sidebar2.tsx` (eliminar enlaces de navegación)
- [ ] Buscar y eliminar todas las importaciones
- [ ] Eliminar referencias en otros componentes
- [ ] Verificar y eliminar rutas en el enrutador si existen
- [ ] Probar la aplicación para asegurar que no hay enlaces rotos
- [ ] Ejecutar linter: `npm run lint`
- [ ] Ejecutar build: `npm run build`

## Ejemplo Completo: Eliminación de Chat

### Archivos Eliminados
```
app/estudiantes/chat-docente/
├── page.tsx

components/estudiantes/
├── chat-docente.tsx
├── chat-bot.tsx
```

### Archivos Modificados
```
components/layout/sidebar2.tsx
├── Eliminado: Link a /estudiantes/chat-docente

components/estudiantes/student-dashboard.tsx
├── Eliminado: import { ChatBot } from "./chat-bot"
├── Eliminado: <ChatBot />
```

## Comandos Útiles

```bash
# Buscar referencias a un módulo
grep -r "nombre-modulo" app/ components/

# Buscar importaciones
grep -r "import.*nombre-modulo" .

# Verificar enlaces rotos
npm run build

# Ejecutar linter
npm run lint
```

## Consideraciones Importantes

1. **Respaldo**: Siempre crear un respaldo antes de eliminar módulos
2. **Base de Datos**: Los permisos en base de datos deben actualizarse por separado
3. **Dependencias**: Verificar que otros módulos no dependan del eliminado
4. **Testing**: Probar todas las rutas después de eliminar módulos
5. **Git**: Commit frecuente durante el proceso de eliminación

## Soporte

Para más información sobre la gestión de permisos y módulos:
- Revisar: `components/permisos/permisos-modulos-tab.tsx`
- Contactar al equipo de desarrollo
- Consultar la documentación de la API en `BACKEND_FIX_REQUIRED.md`
