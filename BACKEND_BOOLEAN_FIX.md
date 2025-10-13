# Backend Fix: PostgreSQL Boolean Comparison Error in Reports

## Issue Summary
The report generation is failing with a PostgreSQL error when comparing boolean columns with integer values.

### Error Details
```
SQLSTATE[42883]: Undefined function: 7 ERROR: el operador no existe: boolean = integer
LINE 1: ...grama" as "programa", CASE WHEN prospectos.activo = 1 THEN '...
^
HINT: Ningún operador coincide en el nombre y tipos de argumentos. 
Puede ser necesario agregar conversión explícita de tipos.
```

### SQL Query with Error
```sql
SELECT 
  "estudiante_programa"."id", 
  "prospectos"."nombre_completo" as "nombre", 
  "estudiante_programa"."created_at" as "fechaMatricula", 
  "tb_programas"."nombre_del_programa" as "programa", 
  CASE WHEN prospectos.activo = 1 THEN 'Activo' ELSE 'Inactivo' END as estado
FROM "estudiante_programa"
INNER JOIN "prospectos" ON "estudiante_programa"."prospecto_id" = "prospectos"."id"
INNER JOIN "tb_programas" ON "estudiante_programa"."programa_id" = "tb_programas"."id"
WHERE "estudiante_programa"."created_at" BETWEEN '2025-10-01' AND '2025-10-31'
  AND "estudiante_programa"."deleted_at" IS NULL
ORDER BY "estudiante_programa"."created_at" DESC
LIMIT 50 OFFSET 0
```

## Root Cause
PostgreSQL has a `boolean` data type that stores `true`/`false` values, not integers like MySQL. The column `prospectos.activo` is defined as `boolean` in PostgreSQL, but the query is trying to compare it with the integer value `1`.

In PostgreSQL:
- Boolean values are: `true`, `false`, `NULL`
- MySQL compatibility: In MySQL, booleans are stored as `TINYINT(1)` with values `0` and `1`

## Solution Options

### Option 1: Cast Boolean to Integer (Recommended)
Change the CASE statement to cast the boolean properly:

```sql
CASE WHEN prospectos.activo::int = 1 THEN 'Activo' ELSE 'Inactivo' END as estado
```

Or use boolean comparison directly:

```sql
CASE WHEN prospectos.activo = true THEN 'Activo' ELSE 'Inactivo' END as estado
```

Or even simpler:

```sql
CASE WHEN prospectos.activo THEN 'Activo' ELSE 'Inactivo' END as estado
```

### Option 2: Update Laravel Model Casting
In your Laravel models, ensure boolean columns are properly cast:

```php
// app/Models/Prospecto.php
class Prospecto extends Model
{
    protected $casts = [
        'activo' => 'boolean',
    ];
}
```

### Option 3: Use Database Abstraction
Let Laravel handle the boolean comparison:

```php
// Instead of raw SQL, use Eloquent:
DB::table('estudiante_programa')
    ->join('prospectos', 'estudiante_programa.prospecto_id', '=', 'prospectos.id')
    ->join('tb_programas', 'estudiante_programa.programa_id', '=', 'tb_programas.id')
    ->selectRaw("
        estudiante_programa.id,
        prospectos.nombre_completo as nombre,
        estudiante_programa.created_at as fechaMatricula,
        tb_programas.nombre_del_programa as programa,
        CASE WHEN prospectos.activo THEN 'Activo' ELSE 'Inactivo' END as estado
    ")
    ->whereBetween('estudiante_programa.created_at', ['2025-10-01', '2025-10-31'])
    ->whereNull('estudiante_programa.deleted_at')
    ->orderBy('estudiante_programa.created_at', 'desc')
    ->limit(50)
    ->offset(0)
    ->get();
```

## Files to Modify in Backend Repository

### 1. Report Controller or Service
Look for the file that generates the enrollment report (likely in `app/Http/Controllers` or `app/Services`):

**Common locations:**
- `app/Http/Controllers/ReportController.php`
- `app/Http/Controllers/EstudianteController.php`
- `app/Services/ReportService.php`

**Fix the CASE statement:**

```php
// Before:
$query = "... CASE WHEN prospectos.activo = 1 THEN 'Activo' ELSE 'Inactivo' END ...";

// After (Option 1 - Direct boolean comparison):
$query = "... CASE WHEN prospectos.activo THEN 'Activo' ELSE 'Inactivo' END ...";

// After (Option 2 - Explicit cast):
$query = "... CASE WHEN prospectos.activo::boolean THEN 'Activo' ELSE 'Inactivo' END ...";
```

### 2. Check All Similar Queries
Search for other instances of this pattern:

```bash
# In your Laravel backend directory:
grep -r "activo = 1" app/
grep -r "activo = 0" app/
```

Replace all occurrences with proper boolean comparisons:
- `activo = 1` → `activo = true` or `activo`
- `activo = 0` → `activo = false` or `NOT activo`

### 3. Database Migration (Optional but Recommended)
If the column is not properly defined as boolean, create a migration:

```php
// database/migrations/YYYY_MM_DD_HHMMSS_fix_prospectos_activo_type.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class FixProspectosActivoType extends Migration
{
    public function up()
    {
        // If activo is currently an integer/tinyint, convert it to boolean
        DB::statement("ALTER TABLE prospectos ALTER COLUMN activo TYPE BOOLEAN USING (activo::boolean)");
        
        // Also check tb_programas if it has an activo column
        if (Schema::hasColumn('tb_programas', 'activo')) {
            DB::statement("ALTER TABLE tb_programas ALTER COLUMN activo TYPE BOOLEAN USING (activo::boolean)");
        }
    }

    public function down()
    {
        DB::statement("ALTER TABLE prospectos ALTER COLUMN activo TYPE INTEGER USING (activo::integer)");
        
        if (Schema::hasColumn('tb_programas', 'activo')) {
            DB::statement("ALTER TABLE tb_programas ALTER COLUMN activo TYPE INTEGER USING (activo::integer)");
        }
    }
}
```

## PostgreSQL vs MySQL Differences

### MySQL
```sql
-- MySQL uses TINYINT(1) for booleans
CREATE TABLE prospectos (
    activo TINYINT(1) DEFAULT 1
);

-- Comparison works with integers
SELECT * FROM prospectos WHERE activo = 1;
```

### PostgreSQL
```sql
-- PostgreSQL has native BOOLEAN type
CREATE TABLE prospectos (
    activo BOOLEAN DEFAULT true
);

-- Comparison should use boolean values
SELECT * FROM prospectos WHERE activo = true;
-- Or simply:
SELECT * FROM prospectos WHERE activo;
```

## Testing After Fix

1. **Test the report generation:**
   ```bash
   # Call the report API endpoint
   curl -X GET "http://your-api/api/reportes/matricula?start=2025-10-01&end=2025-10-31"
   ```

2. **Verify in PostgreSQL:**
   ```sql
   -- Check the column type
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'prospectos' AND column_name = 'activo';
   
   -- Test the fixed query
   SELECT 
       estudiante_programa.id,
       prospectos.nombre_completo as nombre,
       CASE WHEN prospectos.activo THEN 'Activo' ELSE 'Inactivo' END as estado
   FROM estudiante_programa
   INNER JOIN prospectos ON estudiante_programa.prospecto_id = prospectos.id
   LIMIT 5;
   ```

3. **Check Laravel logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

## Expected Result After Fix

The report should load successfully with data like:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "fechaMatricula": "2025-10-15",
      "programa": "Ingeniería en Sistemas",
      "estado": "Activo"
    },
    {
      "id": 2,
      "nombre": "María García",
      "fechaMatricula": "2025-10-20",
      "programa": "Administración",
      "estado": "Inactivo"
    }
  ],
  "total": 45
}
```

## Prevention for Future

### 1. Use Eloquent ORM
Instead of raw SQL, use Eloquent which handles database differences:

```php
EstudiantePrograma::with(['prospecto', 'programa'])
    ->whereBetween('created_at', [$start, $end])
    ->whereNull('deleted_at')
    ->get()
    ->map(function ($ep) {
        return [
            'id' => $ep->id,
            'nombre' => $ep->prospecto->nombre_completo,
            'fechaMatricula' => $ep->created_at,
            'programa' => $ep->programa->nombre_del_programa,
            'estado' => $ep->prospecto->activo ? 'Activo' : 'Inactivo',
        ];
    });
```

### 2. Type Casting in Models
Always define casts in your models:

```php
class Prospecto extends Model
{
    protected $casts = [
        'activo' => 'boolean',
        'fecha_nacimiento' => 'date',
        'created_at' => 'datetime',
    ];
}
```

### 3. Database Abstraction Layer
Use Laravel's Query Builder instead of raw SQL:

```php
DB::table('estudiante_programa')
    ->join('prospectos', 'estudiante_programa.prospecto_id', '=', 'prospectos.id')
    ->select([
        'estudiante_programa.id',
        'prospectos.nombre_completo as nombre',
        DB::raw("CASE WHEN prospectos.activo THEN 'Activo' ELSE 'Inactivo' END as estado")
    ])
    ->get();
```

## Related Issues

This same issue may occur in other queries. Check these areas:

1. **Students listing** - Any query showing student status
2. **Programs listing** - Programs with active/inactive status
3. **User management** - User active status
4. **Modulos (modules)** - Module active status (from permisos-modulos-tab.tsx)
5. **All reports** - Any report that shows active/inactive status

## Additional Resources

- [PostgreSQL Boolean Type Documentation](https://www.postgresql.org/docs/current/datatype-boolean.html)
- [Laravel Type Casting](https://laravel.com/docs/eloquent-mutators#attribute-casting)
- [PostgreSQL vs MySQL Boolean Handling](https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_CHAR.281.29_for_boolean_values)
