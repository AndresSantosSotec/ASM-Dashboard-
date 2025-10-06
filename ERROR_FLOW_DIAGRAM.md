# Flujo de Manejo de Errores en Pagos

## Diagrama de Flujo Principal

```
┌─────────────────────────────────────────────────────────────────┐
│                    INICIO: Procesar Pagos                       │
│            (Puede ser 1 pago o múltiples pagos)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │  Iterar sobre cada pago  │
              └─────────────┬────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │   Procesar Pago #N       │
              └─────────────┬────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │    ¿Ocurrió error?       │
              └─────────────┬────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
               SÍ                      NO
                │                       │
                ▼                       ▼
    ┌────────────────────┐   ┌──────────────────┐
    │  Categorizar Error │   │  Marcar como     │
    └─────────┬──────────┘   │  EXITOSO         │
              │              └────────┬─────────┘
              │                       │
              ▼                       │
    ┌────────────────────┐           │
    │  ¿Es Recuperable?  │           │
    └─────────┬──────────┘           │
              │                       │
    ┌─────────┴────────┐             │
    │                  │             │
   SÍ                 NO             │
    │                  │             │
    ▼                  ▼             │
┌────────────┐   ┌──────────┐      │
│  Omitir    │   │ Detener  │      │
│  registro  │   │ proceso  │      │
│            │   │          │      │
│ • Log error│   │ • Rollback│     │
│ • Continue │   │ • Notify  │     │
└──────┬─────┘   └────┬─────┘      │
       │              │             │
       └──────┬───────┘             │
              │                     │
              └──────────┬──────────┘
                         │
                         ▼
              ┌────────────────────┐
              │ ¿Hay más pagos?    │
              └─────────┬──────────┘
                        │
              ┌─────────┴────────┐
              │                  │
             SÍ                 NO
              │                  │
              │                  ▼
              │    ┌──────────────────────────┐
              │    │   Generar Resumen        │
              │    │                          │
              │    │ • Total procesados       │
              │    │ • Exitosos (insertados)  │
              │    │ • Errores (omitidos)     │
              │    │ • Detalle de errores     │
              │    └────────────┬─────────────┘
              │                 │
              └─────────────────┤
                                │
                                ▼
              ┌──────────────────────────────┐
              │   Mostrar Resultado          │
              │                              │
              │ CASO 1: Todo exitoso         │
              │ ✅ "Importación exitosa"     │
              │                              │
              │ CASO 2: Parcial              │
              │ ⚠️ "Importación parcial"     │
              │ ✅ "X exitosos (insertados)" │
              │ ⚠️ "Y con errores (omitidos)"│
              │                              │
              │ CASO 3: Todo falló           │
              │ ❌ "Importación fallida"     │
              │ ℹ️ "Revise los errores"      │
              └──────────────────────────────┘
```

## Categorización de Errores

### Errores Recuperables (Continue Processing)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERRORES RECUPERABLES                          │
├──────────────────────────┬──────────────────────────────────────┤
│ Código                   │ Acción                               │
├──────────────────────────┼──────────────────────────────────────┤
│ CUOTA_NOT_FOUND         │ Omitir → Continuar                   │
│ CUOTA_ALREADY_PAID      │ Omitir → Continuar                   │
│ DUPLICATE_RECEIPT       │ Omitir → Continuar                   │
│ DUPLICATE_FILE          │ Omitir → Continuar                   │
│ INVALID_AMOUNT          │ Omitir → Continuar                   │
│ STUDENT_NOT_FOUND       │ Omitir → Continuar                   │
└──────────────────────────┴──────────────────────────────────────┘
```

### Errores Críticos (Stop Processing)

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERRORES CRÍTICOS                            │
├──────────────────────────┬──────────────────────────────────────┤
│ Tipo                     │ Acción                               │
├──────────────────────────┼──────────────────────────────────────┤
│ DB_CONNECTION_ERROR     │ Detener → Rollback → Notificar       │
│ AUTH_ERROR              │ Detener → Rollback → Notificar       │
│ SYSTEM_VALIDATION       │ Detener → Rollback → Notificar       │
│ UNKNOWN_ERROR           │ Detener → Rollback → Notificar       │
└──────────────────────────┴──────────────────────────────────────┘
```

## Ejemplo de Ejecución

### Escenario: Importar 5 pagos

```
Pago 1: ✅ Válido → Procesado → Insertado
Pago 2: ❌ CUOTA_NOT_FOUND → Omitido → Continuar
Pago 3: ✅ Válido → Procesado → Insertado
Pago 4: ❌ STUDENT_NOT_FOUND → Omitido → Continuar
Pago 5: ✅ Válido → Procesado → Insertado

RESULTADO:
┌────────────────────────────────────────┐
│  Importación Parcial                   │
├────────────────────────────────────────┤
│  ✅ 3 registros exitosos (insertados) │
│  ⚠️ 2 con errores (omitidos)           │
│                                        │
│  Registros insertados:                 │
│  • Pago 1                              │
│  • Pago 3                              │
│  • Pago 5                              │
│                                        │
│  Registros omitidos:                   │
│  • Pago 2: Cuota no encontrada        │
│  • Pago 4: Estudiante no encontrado   │
└────────────────────────────────────────┘
```

## Beneficios del Nuevo Flujo

### ✅ Antes vs Ahora

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Un error en batch** | ❌ Falla todo | ✅ Omite y continúa |
| **Mensajes** | ❌ Genéricos | ✅ Específicos |
| **Feedback** | ❌ Éxito/Error | ✅ Éxito/Parcial/Error |
| **Datos válidos** | ❌ Se pierden | ✅ Se insertan |
| **Logs** | ❌ Excesivos | ✅ Limpios |
| **Debug** | ❌ Difícil | ✅ Claro |

### 🎯 Casos de Uso Cubiertos

1. **Importación masiva con errores parciales** ✅
2. **Pago individual con problema específico** ✅
3. **Conciliación de múltiples recibos** ✅
4. **Errores críticos del sistema** ✅
5. **Duplicados y validaciones** ✅

## Integración con Backend

El frontend espera esta estructura de respuesta:

```typescript
{
  success: boolean,          // true si todo OK, false si hay errores
  message: string,           // Mensaje principal
  data: {
    total: number,          // Total de registros
    exitosos: number,       // Registros exitosos (insertados)
    errores: number,        // Registros con error (omitidos)
    monto_total: number,    // Suma de montos procesados
    kardex_creados: number,
    cuotas_actualizadas: number,
    conciliaciones: number
  },
  errores_detalle: [        // Detalles de errores
    {
      tipo: string,         // Tipo de error
      cantidad: number,     // Cantidad de este tipo
      ejemplos: string[]    // Ejemplos específicos
    }
  ],
  advertencias: [           // Advertencias no críticas
    {
      tipo: string,
      mensaje: string
    }
  ]
}
```

## Conclusión

Este nuevo flujo garantiza que:
- ✅ Los datos válidos nunca se pierden
- ✅ Los usuarios tienen claridad sobre qué pasó
- ✅ El sistema es más resiliente ante errores
- ✅ El código es más limpio y mantenible
