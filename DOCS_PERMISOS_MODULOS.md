# Documentación: Cómo Eliminar Permisos y Módulos

## Descripción General

Esta documentación explica el proceso para eliminar permisos y módulos del sistema ASM Dashboard. El sistema utiliza una arquitectura basada en módulos y vistas con control de permisos por rol.

## Estructura del Sistema

### 1. Componentes Principales

- **Módulos**: Agrupaciones de funcionalidad (`components/permisos/permisos-modulos-tab.tsx`)
- **Vistas**: Páginas individuales dentro de cada módulo
- **Roles**: Perfiles de usuario con permisos específicos
- **Sidebar**: Navegación principal que muestra módulos según permisos

### 2. Archivos Clave

```
components/
├── permisos/
│   └── permisos-modulos-tab.tsx    # Gestión de módulos y permisos
├── layout/
│   ├── sidebar.tsx                  # Navegación principal (legacy)
│   └── sidebar2.tsx                 # Navegación principal (actual)
└── sidebar.tsx                      # Navegación alternativa

app/
├── [módulo]/                        # Carpetas por módulo
│   ├── page.tsx                    # Página principal del módulo
│   └── [vista]/                    # Vistas dentro del módulo
│       └── page.tsx
```

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

Los permisos están vinculados a módulos y vistas. Para eliminar un permiso:

1. Acceder al componente de gestión de permisos: `/seguridad/permisos`
2. Identificar el módulo o vista asociada
3. Usar la interfaz para desactivar o eliminar el permiso

### Paso 2: Actualizar la Configuración de Roles

Si los roles tienen permisos específicos asignados, actualizar en:

```
app/seguridad/roles/
```

### Paso 3: Verificar Condicionales de Rol en el Sidebar

El sidebar tiene validaciones de rol como:

```typescript
{userRole === "Administrador" && (
  <div className="mb-1">
    {/* Sección solo para administradores */}
  </div>
)}
```

Si se elimina un permiso completo, eliminar también estos bloques condicionales.

## Componente de Gestión de Permisos

El componente `permisos-modulos-tab.tsx` gestiona:

- **Módulos**: Agrupaciones principales
- **Vistas**: Páginas dentro de cada módulo
- **Iconos**: Representación visual en el menú
- **Estado**: Activo/Inactivo

### Interfaz de Módulo

```typescript
interface Modulo {
  id: number;
  nombre: string;
  descripcion: string;
  vistas: number;
  activo: boolean;
  icono?: string;
}
```

### Interfaz de Vista

```typescript
export interface Vista {
  id: number;
  module_id: number;
  menu: string;
  submenu?: string;
  view_path: string;
  status: boolean;
  order_num: number;
  icono?: string;
}
```

## Iconos Disponibles

Los iconos están definidos en `permisos-modulos-tab.tsx`. Los disponibles incluyen:

- `Home`, `Users`, `Mail`, `Calendar`, `Settings`
- `BarChart`, `FileText`, `Shield`, `DollarSign`
- `BookOpen`, `ClipboardList`, `Activity`, `Award`
- Y muchos más de `lucide-react`

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
