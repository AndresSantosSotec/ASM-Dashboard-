# Fix: Invariant Violation Error en React DnD

## Problema
Error intermitente: `Invariant Violation: Expected to find a valid target. targetId=T329`

## Causa Raíz
Este error ocurre en `react-dnd` cuando:
1. Los componentes se desmontan o remontan durante operaciones de arrastre
2. Las referencias (refs) no se manejan correctamente o cambian durante el render
3. Actualizaciones de estado durante el drag causan re-renders que invalidan los targets
4. Componentes se re-renderizan innecesariamente durante drag operations

## Soluciones Implementadas

### 1. Manejo Correcto de Referencias (Refs)
**Antes:**
```tsx
const ref = useRef<HTMLDivElement>(null);
if (status !== "completed" && status !== "static") drag(ref);

<Card ref={status !== "completed" && status !== "static" ? (ref as any) : undefined} />
```

**Después:**
```tsx
const ref = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (canDrag && ref.current) {
    drag(ref);
  }
}, [drag, canDrag]);

<Card ref={ref} />
```

**Beneficios:**
- Ref siempre está asignado (no condicionalmente)
- Se conecta el drag hook dentro de useEffect de forma segura
- Elimina el casting `as any` que ocultaba problemas de tipos

### 2. Dependencias Estables en Hooks
**Antes:**
```tsx
const [{ isDragging }, drag] = useDrag(() => ({
  type: "course",
  item: { course, status },
  canDrag: status !== "completed" && status !== "static",
  collect: (monitor) => ({
    isDragging: monitor.isDragging(),
  }),
}));
```

**Después:**
```tsx
const canDrag = status !== "completed" && status !== "static";

const [{ isDragging }, drag] = useDrag(() => ({
  type: "course",
  item: { course, status },
  canDrag,
  collect: (monitor) => ({
    isDragging: monitor.isDragging(),
  }),
}), [course.id, status, canDrag]);
```

**Beneficios:**
- Array de dependencias explícito previene recreación innecesaria
- Usa `course.id` en vez de todo el objeto `course` para estabilidad

### 3. Defer State Updates Durante Drag
**Antes:**
```tsx
const handleCourseDrop = useCallback(
  (course: Course, to: "assigned" | "available") => {
    if (to === "assigned") {
      setAssigned((prev) => [...prev, course]);
      setAvailable((prev) => prev.filter((c) => c.id !== course.id));
      // ... más state updates
    }
  },
  [],
);
```

**Después:**
```tsx
const handleCourseDrop = useCallback(
  (course: Course, to: "assigned" | "available") => {
    // Defer state updates usando requestAnimationFrame
    requestAnimationFrame(() => {
      if (to === "assigned") {
        setAssigned((prev) => [...prev, course]);
        setAvailable((prev) => prev.filter((c) => c.id !== course.id));
        // ... más state updates
      }
    });
  },
  [],
);
```

**Beneficios:**
- Las actualizaciones de estado se ejecutan DESPUÉS de que termina el drag
- Previene que los componentes se desmonten mientras el drag está activo
- Evita re-renders durante la operación de drag

### 4. Memoización de Componentes
**Antes:**
```tsx
const CourseCard = ({ course, status }: CourseCardProps) => {
  // component body
};
```

**Después:**
```tsx
const CourseCard = memo(({ course, status }: CourseCardProps) => {
  // component body
});

CourseCard.displayName = 'CourseCard';
```

**Beneficios:**
- Previene re-renders innecesarios durante drag operations
- Los componentes solo se re-renderizan cuando sus props realmente cambian
- Mejora el rendimiento general de la aplicación

## Archivos Modificados
- `components/views/student-assignment-view.tsx`

## Testing
Para verificar que el fix funciona:

1. Navegar a la página de asignación de cursos
2. Intentar arrastrar varios cursos entre columnas repetidamente
3. Arrastrar rápidamente múltiples cursos
4. Verificar que no aparezca el error "Invariant Violation"
5. Confirmar que el drag & drop funciona suavemente

## Prevención Futura
- Siempre usar `useEffect` para conectar refs de drag/drop
- Incluir arrays de dependencias en todos los hooks de react-dnd
- Usar `requestAnimationFrame` o `setTimeout` para deferir state updates en drop handlers
- Memoizar componentes drag/drop cuando sea apropiado
- Evitar refs condicionales
