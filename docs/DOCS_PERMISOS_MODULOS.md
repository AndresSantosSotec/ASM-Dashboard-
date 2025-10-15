# Documentación: Cómo Eliminar Permisos y Módulos

## Descripción General

Este documento proporciona una guía paso a paso para eliminar módulos y permisos del sistema ASM Dashboard. El sistema está construido con Next.js 15 y utiliza una arquitectura basada en componentes con routing basado en archivos.

## Estructura del Sistema

### Organización de Archivos

```
ASM-Dashboard-/
├── app/                          # Rutas de la aplicación (Next.js App Router)
│   ├── docente/                  # Módulo de docentes
│   ├── estudiantes/              # Módulo de estudiantes
│   ├── admin/                    # Módulo de administración
│   └── ...                       # Otros módulos
├── components/                   # Componentes reutilizables
│   ├── layout/                   # Componentes de layout (sidebar, header, etc.)
│   ├── docente/                  # Componentes específicos de docentes
│   ├── estudiantes/              # Componentes específicos de estudiantes
│   └── ...                       # Otros componentes
└── services/                     # Servicios de API
```

### Sistema de Navegación

La navegación principal se gestiona en:
- `components/layout/sidebar2.tsx` - Sidebar principal con menú de navegación
- `components/layout/sidebar.tsx` - Sidebar alternativo (si aplica)

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

### Paso 5: Verificar y Compilar

```bash
# Verificar que no haya errores de compilación
npm run build

# Ejecutar linter para detectar problemas
npm run lint
```

## Proceso para Eliminar Permisos

### Paso 1: Identificar el Sistema de Permisos

El sistema de permisos puede estar implementado en:
- Base de datos (tablas de permisos, roles, usuarios)
- Archivos de configuración
- Componentes de gestión de permisos (ej: `seguridad/permisos`)

### Paso 2: Eliminar de la Base de Datos

Si los permisos están en la base de datos, ejecutar queries SQL:

```sql
-- Eliminar permisos específicos
DELETE FROM permisos WHERE modulo = 'chat-docente';

-- Eliminar relaciones rol-permiso
DELETE FROM rol_permisos WHERE permiso_id IN (
  SELECT id FROM permisos WHERE modulo = 'chat-docente'
);
```

### Paso 3: Actualizar Configuración de Permisos

Si hay archivos de configuración de permisos, actualizarlos:

```typescript
// Ejemplo: permisos.config.ts
// ANTES
export const permisos = {
  estudiantes: ['documentos', 'pagos', 'chat-docente', 'ranking'],
  // ...
}

// DESPUÉS
export const permisos = {
  estudiantes: ['documentos', 'pagos', 'ranking'],
  // ...
}
```

### Paso 4: Actualizar Middleware de Autorización

Si hay middleware que verifica permisos, actualizarlo:

```typescript
// Eliminar referencias al permiso
const permisosValidos = [
  'ver_documentos',
  'gestionar_pagos',
  // 'usar_chat_docente', // ELIMINAR
  'ver_ranking'
]
```

## Componente de Gestión de Permisos

Si existe un componente UI para gestionar permisos (como `seguridad/permisos`), asegurarse de:

1. **Eliminar el permiso de la lista**: Quitar el permiso del array de permisos disponibles
2. **Actualizar la base de datos**: Ejecutar scripts de migración si es necesario
3. **Verificar roles**: Asegurarse de que ningún rol tenga asignado el permiso eliminado

## Iconos Disponibles

Los iconos están definidos en `permisos-modulos-tab.tsx`. Los disponibles incluyen:

- `Home`, `Users`, `Mail`, `Calendar`, `Settings`
- `BarChart`, `FileText`, `Shield`, `DollarSign`
- `BookOpen`, `ClipboardList`, `Activity`, `Award`
- Y muchos más de `lucide-react`

## Checklist para Eliminar un Módulo Completo

- [ ] Eliminar carpeta del módulo en `app/`
- [ ] Eliminar componentes relacionados en `components/`
- [ ] Actualizar `sidebar2.tsx` para eliminar enlaces de navegación
- [ ] Buscar y eliminar todas las importaciones
- [ ] Actualizar componentes que usan el módulo
- [ ] Eliminar permisos de la base de datos
- [ ] Actualizar archivos de configuración de permisos
- [ ] Actualizar middleware de autorización
- [ ] Ejecutar `npm run build` para verificar
- [ ] Ejecutar `npm run lint` para detectar problemas
- [ ] Probar la aplicación manualmente
- [ ] Actualizar documentación del proyecto

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

1. **Backup**: Siempre hacer backup de la base de datos antes de eliminar permisos
2. **Dependencias**: Verificar que otros módulos no dependan del módulo a eliminar
3. **Migraciones**: Crear scripts de migración para cambios en base de datos
4. **Usuarios Activos**: Notificar a usuarios si el módulo está en uso activo
5. **Documentación**: Actualizar toda la documentación relacionada
6. **Testing**: Ejecutar tests automatizados si existen
7. **Rollback Plan**: Tener un plan de reversión en caso de problemas

## Soporte

Para más información o ayuda:
- Revisar la documentación de Next.js: https://nextjs.org/docs
- Consultar con el equipo de desarrollo
- Crear un issue en el repositorio del proyecto

---

**Última actualización**: Enero 2025
**Versión del sistema**: Next.js 15
**Mantenido por**: Equipo de Desarrollo ASM
