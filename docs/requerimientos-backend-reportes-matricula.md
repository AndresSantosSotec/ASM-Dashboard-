# Requerimiento de backend: Reportes de Matrícula y Alumnos Nuevos

Este documento resume los insumos que el módulo `/admin/reportes-matricula` del panel web necesita que exponga el backend para operar con datos reales. Actualmente la interfaz utiliza datos mock y cálculos locales; la API debe entregar la información ya consolidada para habilitar los filtros, las vistas de comparación y las opciones de exportación.

## 1. Endpoint principal de consulta

- **Ruta sugerida:** `GET /admin/reportes-matricula`
- **Parámetros de consulta:**
  - `rango` (`month` | `quarter` | `semester` | `year` | `custom`)
  - `fechaInicio` y `fechaFin` (obligatorios cuando `rango = custom`)
  - `programaId` (`all` para sin filtro)
  - `tipoAlumno` (`all`, `Nuevo`, `Recurrente`)
- **Respuesta esperada (ejemplo):**

```json
{
  "filtros": {
    "rangosDisponibles": ["month", "quarter", "semester", "year", "custom"],
    "programas": [
      { "id": "Desarrollo Web", "nombre": "Desarrollo Web" },
      { "id": "Marketing Digital", "nombre": "Marketing Digital" }
    ],
    "tiposAlumno": ["Nuevo", "Recurrente"]
  },
  "periodoActual": {
    "rango": {
      "fechaInicio": "2025-03-01",
      "fechaFin": "2025-03-31",
      "descripcion": "Marzo 2025"
    },
    "totales": {
      "matriculados": 124,
      "alumnosNuevos": 74,
      "alumnosRecurrentes": 50
    },
    "distribucionProgramas": [
      { "programa": "Desarrollo Web", "total": 40 },
      { "programa": "Marketing Digital", "total": 32 }
    ],
    "evolucionMensual": [
      { "mes": "2025-01", "total": 98 },
      { "mes": "2025-02", "total": 110 },
      { "mes": "2025-03", "total": 124 }
    ],
    "distribucionTipo": [
      { "tipo": "Nuevo", "total": 74 },
      { "tipo": "Recurrente", "total": 50 }
    ]
  },
  "periodoAnterior": {
    "totales": {
      "matriculados": 102,
      "alumnosNuevos": 60,
      "alumnosRecurrentes": 42
    },
    "rangoComparado": {
      "fechaInicio": "2025-02-01",
      "fechaFin": "2025-02-28",
      "descripcion": "Febrero 2025"
    }
  },
  "tendencias": {
    "ultimosDoceMeses": [
      { "mes": "2024-04", "total": 85 },
      { "mes": "2024-05", "total": 90 }
    ],
    "crecimientoPorPrograma": [
      { "programa": "Desarrollo Web", "variacion": 12.5 },
      { "programa": "Marketing Digital", "variacion": 8.3 }
    ],
    "proyeccion": [
      { "periodo": "2025-04", "totalEsperado": 130 }
    ]
  },
  "listado": {
    "alumnos": [
      {
        "id": 1,
        "nombre": "Ana García",
        "fechaMatricula": "2025-03-05",
        "tipo": "Nuevo",
        "programa": "Desarrollo Web",
        "estado": "Activo"
      }
    ],
    "paginacion": { "pagina": 1, "porPagina": 50, "total": 124 }
  }
}
```

### Consideraciones
- Incluir etiquetas descriptivas (`descripcion`) para los rangos de fecha porque la UI las muestra directamente en el encabezado de comparación.
- La lista de alumnos debe poder paginarse y ordenarse por fecha o nombre para evitar que la respuesta crezca indefinidamente.
- Las agregaciones por programa, tipo y evolución mensual deben respetar los filtros seleccionados en el request.

## 2. Cálculo de métricas de comparación

El frontend muestra variaciones porcentuales entre el período actual y el anterior (`totalGrowth`, `newGrowth`, `recurringGrowth`). Para evitar cálculos inconsistentes se sugiere que la API entregue estos valores ya calculados:

```json
"comparativa": {
  "totales": {
    "actual": 124,
    "anterior": 102,
    "variacion": 21.57
  },
  "nuevos": {
    "actual": 74,
    "anterior": 60,
    "variacion": 23.33
  },
  "recurrentes": {
    "actual": 50,
    "anterior": 42,
    "variacion": 19.05
  }
}
```

Si alguno de los denominadores es cero, el backend debe definir una convención (por ejemplo, variación `null` o `100`) para que el frontend pueda manejar el caso sin errores.

## 3. Datos para las gráficas

Aunque actualmente se muestran placeholders, la API debe exponer colecciones estructuradas para alimentar componentes de gráficas:

- **Matrícula por mes:** array ordenado cronológicamente con `mes` (ISO `YYYY-MM`) y `total`.
- **Distribución por programa:** array con `programa`, `total`, y opcionalmente `porcentaje`.
- **Distribución por tipo:** array con `tipo`, `total` y `porcentaje`.
- **Tendencias 12 meses:** serie temporal extendida para la pestaña "Tendencias".
- **Crecimiento por programa:** variación porcentual por programa respecto al período anterior.
- **Proyección:** valores pronosticados con `periodo` y `totalEsperado` o `intervaloConfianza` si existe.

## 4. Endpoint de exportación

- **Ruta sugerida:** `POST /admin/reportes-matricula/exportar`
- **Parámetros del cuerpo:**
  - `formato`: `pdf` | `excel` | `csv`
  - `detalle`: `complete` | `summary` | `data`
  - filtros (`rango`, `fechaInicio`, `fechaFin`, `programaId`, `tipoAlumno`) para replicar la consulta activa
  - `incluirGraficas`: boolean
- **Respuesta:** archivo binario (`application/pdf`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/csv`) con `Content-Disposition` que incluya el nombre sugerido.
- Para formatos tabulares (`excel`, `csv`) se requiere que el backend convierta la tabla de alumnos y las agregaciones en hojas o secciones separadas.

## 5. Seguridad y control de acceso

- Validar que el usuario autenticado tenga rol de administrador académico antes de entregar los datos.
- Registrar auditoría de exportaciones (usuario, filtros usados, fecha) para trazabilidad.

## 6. Performance y paginación

- Limitar el tamaño de respuesta por defecto (ej. 50 registros) y permitir ajustar el tamaño máximo.
- Incluir campos `hasMore` o `totalPaginas` para facilitar la navegación desde el frontend si se agrega paginación.
- Optimizar agregaciones con índices en tablas de matrículas (por fecha, programa y tipo de alumno).

## 7. Errores y estados vacíos

- Responder con códigos y mensajes claros (`422` para filtros inválidos, `404` si el rango no tiene datos).
- Entregar estructuras vacías (arrays vacíos y totales en cero) en lugar de omitir claves para simplificar el manejo en el cliente.

## 8. Roadmap opcional

- Endpoint adicional `GET /admin/reportes-matricula/programas` si se requiere poblar el selector de programas de manera dinámica.
- Webhooks o tareas programadas para precalcular métricas diarias y acelerar la carga inicial.

Con estos contratos la interfaz podrá sustituir los datos mock por información real y habilitar la exportación y análisis comparativo solicitados por el módulo.
