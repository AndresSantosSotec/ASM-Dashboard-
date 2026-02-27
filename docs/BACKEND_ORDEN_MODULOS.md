# Backend Laravel: Orden de módulos en el sidebar

El frontend espera que los módulos puedan venir ordenados desde el backend mediante un campo numérico `orden`. Aquí se documentan los cambios necesarios en la API Laravel.

---

## 1. Migración: campo `orden`

Si la tabla de módulos no tiene el campo `orden`, crear una migración:

**Archivo:** `database/migrations/xxxx_add_orden_to_modulos_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modulos', function (Blueprint $table) {
            $table->integer('orden')->default(99)->after('nombre');
        });
    }

    public function down(): void
    {
        Schema::table('modulos', function (Blueprint $table) {
            $table->dropColumn('orden');
        });
    }
};
```

Si tu tabla se llama `modules` o `menu_modules`, ajusta el nombre. Si el campo va en otra tabla (por ejemplo la relación módulo-vista), adapta la migración a esa tabla.

---

## 2. Controller: ordenar por `orden`

En el controller que devuelve los módulos/vistas permitidos al usuario (por ejemplo al login o en un endpoint de permisos):

**ANTES (orden alfabético):**
```php
return Modulo::orderBy('nombre')->get();
```

**DESPUÉS (orden configurable):**
```php
return Modulo::orderBy('orden')->orderBy('nombre')->get();
```

Si devuelves una estructura anidada (módulos con vistas), ordena los módulos por `orden`:

```php
$modulos = Modulo::with('vistas')
    ->orderBy('orden')
    ->orderBy('nombre')
    ->get();
```

Asegúrate de incluir el campo `orden` en el JSON de respuesta para que el frontend pueda usarlo en el futuro si se desea priorizar el orden del backend sobre el del frontend.

---

## 3. Endpoint de reordenamiento (admin)

Para que un administrador pueda cambiar el orden desde el panel:

**Ruta:** `PATCH /api/admin/modulos/reordenar` (o la que uses para admin).

**Controller:**

```php
// app/Http/Controllers/Api/Admin/ModuloController.php (o similar)

public function reordenar(Request $request)
{
    $request->validate([
        'modulos' => 'required|array',
        'modulos.*.id' => 'required|integer|exists:modulos,id',
        'modulos.*.orden' => 'required|integer|min:0',
    ]);

    foreach ($request->modulos as $item) {
        Modulo::where('id', $item['id'])
              ->update(['orden' => $item['orden']]);
    }

    return response()->json(['success' => true]);
}
```

**Ejemplo de body:**
```json
{
  "modulos": [
    { "id": 1, "orden": 1 },
    { "id": 2, "orden": 2 },
    { "id": 3, "orden": 5 }
  ]
}
```

(Los gaps en `orden` — p. ej. 1, 2, 5 — permiten insertar ítems entre medios más tarde.)

---

## 4. Orden sugerido inicial (seeder)

Para dar un orden inicial coherente con el sidebar del frontend:

**Archivo:** `database/seeders/ModuloOrdenSeeder.php`

```php
<?php

namespace Database\Seeders;

use App\Models\Modulo; // o el modelo que uses
use Illuminate\Database\Seeder;

class ModuloOrdenSeeder extends Seeder
{
    public function run(): void
    {
        $ordenPorNombre = [
            'Inicio'                    => 1,
            'Prospectos y Asesores'     => 2,
            'Prospectos Y Asesores'     => 2,
            'Estudiantes'               => 3,
            'Inscripción'               => 4,
            'Inscripcion'               => 4,
            'Académico'                 => 5,
            'Academico'                 => 5,
            'Finanzas y Pagos'          => 6,
            'Finanzas Y Pagos'          => 6,
            'Administración'            => 7,
            'Administracion'            => 7,
            'Seguridad'                 => 8,
        ];

        foreach ($ordenPorNombre as $nombre => $orden) {
            Modulo::where('nombre', $nombre)->update(['orden' => $orden]);
        }

        // Opcional: los que no estén en la lista quedan en 99
        Modulo::whereNotIn('nombre', array_keys($ordenPorNombre))
              ->update(['orden' => 99]);
    }
}
```

Ajusta los nombres exactos a los que devuelve tu base de datos (con o sin tildes, "Y" vs "y", etc.). Si "Inicio" no es un módulo en tu tabla sino una ruta fija del frontend, quita esa línea del seeder.

---

## 5. Uso en el frontend

- Hoy el frontend ordena los módulos con la config local `SIDEBAR_MODULES_MAP` en `lib/sidebar-modules-config.ts`.
- Cuando el backend envíe el campo `orden` en cada módulo, se puede cambiar el `sortedModuleNames` en `components/layout/sidebar.tsx` para ordenar por `(modulo as any).orden ?? 999` en lugar de (o además de) `SIDEBAR_MODULES_MAP`, dando prioridad al backend.

Ejemplo de adaptación futura en el frontend (cuando la API devuelva `orden`):

```ts
// En sidebar.tsx, si allowedViews incluye orden por módulo o recibes módulos con orden:
const sortedModuleNames = useMemo(() => {
  const names = Object.keys(modules);
  return names.sort((a, b) => {
    const modA = modules[a][0]; // primer view del módulo
    const modB = modules[b][0];
    const ordenA = (modA?.module as any)?.orden ?? SIDEBAR_MODULES_MAP[a]?.order ?? 99;
    const ordenB = (modB?.module as any)?.orden ?? SIDEBAR_MODULES_MAP[b]?.order ?? 99;
    return ordenA - ordenB;
  });
}, [modules]);
```

---

## Resumen

| Cambio | Descripción |
|--------|-------------|
| Migración | Añadir `orden` (integer, default 99) a la tabla de módulos. |
| Controller (listado) | `orderBy('orden')->orderBy('nombre')` al devolver módulos. |
| Endpoint reordenar | `PATCH /api/admin/modulos/reordenar` con `{ modulos: [{ id, orden }] }`. |
| Seeder | Asignar valores iniciales de `orden` según nombres de módulos. |

Con esto el backend controla el orden de los módulos y el sidebar del frontend puede seguir usando su config local o, cuando lo implementes, el campo `orden` del API.
