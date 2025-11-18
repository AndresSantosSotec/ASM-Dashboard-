# 📅 Guía Rápida: DatePickerPopover

## Uso Básico

### Importación
```tsx
import { DatePickerPopover } from "@/components/ui/date-picker-popover"
```

### Ejemplo Simple
```tsx
const [fecha, setFecha] = useState("")

<DatePickerPopover
  value={fecha}
  onChange={setFecha}
  placeholder="Seleccionar fecha"
/>
```

---

## 📌 Casos de Uso Comunes

### 1. Fecha de Nacimiento (No futuras)
```tsx
<DatePickerPopover
  value={fechaNacimiento}
  onChange={setFechaNacimiento}
  fromYear={1920}
  toYear={new Date().getFullYear()}
  placeholder="Seleccionar fecha de nacimiento"
  captionLayout="dropdown"
/>
```

### 2. Fechas Académicas (Futuras)
```tsx
<DatePickerPopover
  value={fechaInicio}
  onChange={setFechaInicio}
  fromYear={new Date().getFullYear()}
  toYear={new Date().getFullYear() + 5}
  placeholder="Seleccionar fecha de inicio"
  captionLayout="dropdown"
/>
```

### 3. Fecha Genérica (Amplio rango)
```tsx
<DatePickerPopover
  value={fecha}
  onChange={setFecha}
  fromYear={1950}
  toYear={2030}
  placeholder="Seleccionar fecha"
  captionLayout="dropdown"
/>
```

### 4. Campo Deshabilitado
```tsx
<DatePickerPopover
  value={fecha}
  onChange={setFecha}
  disabled={true}
  placeholder="No disponible"
/>
```

---

## 🎨 Props Disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `string` | `undefined` | Fecha en formato ISO (YYYY-MM-DD) |
| `onChange` | `(value: string) => void` | `undefined` | Callback cuando cambia la fecha |
| `fromYear` | `number` | `1950` | Año mínimo seleccionable |
| `toYear` | `number` | `currentYear + 10` | Año máximo seleccionable |
| `captionLayout` | `"label" \| "dropdown" \| "dropdown-months"` | `"dropdown"` | Tipo de navegación |
| `placeholder` | `string` | `"Seleccionar fecha"` | Texto cuando no hay fecha |
| `disabled` | `boolean` | `false` | Deshabilita el selector |
| `className` | `string` | `undefined` | Clases CSS adicionales |

---

## 🔄 Formato de Fechas

### Entrada/Salida (ISO 8601)
```typescript
// Formato que recibe y devuelve
"2025-11-17"  // ✅ Correcto
"YYYY-MM-DD"  // ✅ Formato ISO estándar
```

### Visualización (Usuario)
```typescript
// Formato que ve el usuario
"17/11/2025"   // ✅ Formato español
"DD/MM/YYYY"   // ✅ Locale español (es)
```

---

## 📱 Responsive

El componente es automáticamente responsive:

- **Desktop**: Popover se alinea al inicio (align="start")
- **Mobile**: Calendario se adapta al ancho disponible
- **Touch**: Totalmente funcional con gestos táctiles

---

## ⚡ Optimizaciones

### Auto-cierre
```tsx
const handleSelect = (selected: Date | undefined) => {
  setDate(selected)
  onChange?.(selected ? format(selected, "yyyy-MM-dd") : "")
  setIsOpen(false)  // ✅ Cierra automáticamente
}
```

### Sincronización de Estado
```tsx
React.useEffect(() => {
  setDate(value ? new Date(value) : undefined)
}, [value])  // ✅ Se actualiza cuando cambia value
```

---

## 🎯 Validaciones Recomendadas

### En el Formulario
```tsx
const isFormValid = useMemo(() => {
  return (
    datos.fechaNacimiento !== "" &&  // ✅ Fecha requerida
    // ... otras validaciones
  )
}, [datos])
```

### Rango de Edad Mínima (18 años)
```tsx
const maxYear = new Date().getFullYear() - 18

<DatePickerPopover
  value={fecha}
  onChange={setFecha}
  fromYear={1920}
  toYear={maxYear}  // ✅ Máximo hace 18 años
/>
```

---

## 🐛 Troubleshooting

### Problema: La fecha no se actualiza
**Solución**: Verificar que el formato sea ISO
```tsx
// ❌ Incorrecto
onChange={setFecha}  // Si setFecha espera Date

// ✅ Correcto
onChange={(isoString) => setFecha(isoString)}
```

### Problema: El calendario no se abre
**Solución**: Verificar imports de Popover
```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
```

### Problema: Error de locale español
**Solución**: Verificar import de date-fns
```tsx
import { format } from "date-fns"
import { es } from "date-fns/locale"
```

---

## 🎨 Personalización de Estilos

### Cambiar ancho del botón
```tsx
<DatePickerPopover
  className="w-64"  // ✅ Ancho fijo
  // ...
/>
```

### Cambiar alineación
```tsx
<PopoverContent className="w-auto p-0" align="center">  {/* center, end */}
```

---

## 🔗 Integración con React Hook Form

```tsx
import { Controller } from "react-hook-form"

<Controller
  name="fechaNacimiento"
  control={control}
  rules={{ required: "Fecha requerida" }}
  render={({ field }) => (
    <DatePickerPopover
      value={field.value}
      onChange={field.onChange}
      placeholder="Seleccionar fecha de nacimiento"
    />
  )}
/>
```

---

## 📚 Ejemplos de Implementación

### PersonalTab (Fecha de Nacimiento)
```tsx
<div className="space-y-2">
  <Label>
    Fecha de nacimiento <RequiredAsterisk />
  </Label>
  <DatePickerPopover
    value={datos.fechaNacimiento}
    onChange={(v) => setDatos({ ...datos, fechaNacimiento: v })}
    captionLayout="dropdown"
    fromYear={1920}
    toYear={new Date().getFullYear()}
    placeholder="Seleccionar fecha de nacimiento"
  />
</div>
```

### AcademicoTab (Fecha Académica)
```tsx
<div className="space-y-2">
  <Label>
    Fecha de inicio específica <RequiredAsterisk />
  </Label>
  <DatePickerPopover
    value={datos.fechaInicioEspecifica}
    onChange={v => setDatos({ ...datos, fechaInicioEspecifica: v })}
    captionLayout="dropdown"
    fromYear={new Date().getFullYear()}
    toYear={new Date().getFullYear() + 5}
    placeholder="Seleccionar fecha de inicio"
  />
</div>
```

---

## ✅ Checklist de Implementación

Al usar DatePickerPopover, verificar:

- [ ] Import correcto del componente
- [ ] Props `value` y `onChange` configurados
- [ ] Rango de años apropiado (`fromYear`, `toYear`)
- [ ] Placeholder descriptivo
- [ ] Formato ISO en el estado (YYYY-MM-DD)
- [ ] Validación de campo requerido
- [ ] Label con `<RequiredAsterisk />` si es obligatorio
- [ ] Responsive verificado en móvil

---

## 🚀 Tips de Performance

### Memoización de Callbacks
```tsx
const handleFechaChange = useCallback((value: string) => {
  setDatos(prev => ({ ...prev, fechaNacimiento: value }))
}, [])

<DatePickerPopover onChange={handleFechaChange} />
```

### Lazy Loading (Si se usa en muchos lugares)
```tsx
const DatePickerPopover = lazy(() => 
  import("@/components/ui/date-picker-popover").then(m => ({ 
    default: m.DatePickerPopover 
  }))
)
```

---

## 📞 Soporte

**Archivo del componente**: `components/ui/date-picker-popover.tsx`  
**Documentación completa**: `docs/RF-INS-008_VALIDACION.md`  
**Ejemplos en producción**:
- `components/inscripcion/tabs/PersonalTab.tsx`
- `components/inscripcion/tabs/AcademicoTab.tsx`

---

**Última actualización**: 17 de noviembre, 2025  
**Versión del componente**: 1.0
