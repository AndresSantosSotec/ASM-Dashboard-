# 📸 Visual UI Description - Seguimiento de Estudiantes

## Page Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Reportes Financieros                                  │
│                                                                               │
│  [Seguimiento Estudiantes] [Estados de Cuenta] [Libros Contables] [...]    │
│  ═══════════════════════                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1. Summary Cards Section

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────┐│
│  │ Estudiantes     │  │ Saldo Pendiente │  │ Cuotas en Mora  │  │ Planes ││
│  │ Activos         │  │ Total           │  │                 │  │ Reest. ││
│  │                 │  │                 │  │                 │  │        ││
│  │     2,959       │  │  Q22,500.00     │  │       0         │  │    0   ││
│  │                 │  │                 │  │                 │  │        ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └────────┘│
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 2. Search and Filters Section

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Seguimiento de Estudiantes                                                  │
│  Lista de estudiantes activos con información de sus cuotas y pagos          │
│                                                                               │
│  ┌────────────────────────────────────────────────────┐  ┌──────────────┐  │
│  │ 🔍  Buscar por carnet o nombre...                  │  │ [Actualizar] │  │
│  └────────────────────────────────────────────────────┘  └──────────────┘  │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 3. Student Table

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Carnet      │ Nombre                      │ Programa │ Pagadas │ Pend. │ Saldo    │ Próxima    │
├─────────────┼─────────────────────────────┼──────────┼─────────┼───────┼──────────┼────────────┤
│ ASM2020126  │ Marta Julia de León Bolaños │ MBA      │    3    │   9   │ Q4,500.00│ Cuota #4   │
│             │                              │          │         │       │          │ 15/02/2026 │
│             │                              │          │         │       │          │ Q500.00    │
│             │                              │          │         │       │          │ [👁 Ver]   │
├─────────────┼─────────────────────────────┼──────────┼─────────┼───────┼──────────┼────────────┤
│ ASM2020127  │ Juan Carlos López Mendez    │ MBA      │    5    │   7   │ Q3,500.00│ Cuota #6   │
│             │                              │          │         │       │          │ 20/03/2026 │
│             │                              │          │         │       │          │ Q500.00    │
│             │                              │          │         │       │          │ [👁 Ver]   │
├─────────────┼─────────────────────────────┼──────────┼─────────┼───────┼──────────┼────────────┤
│ ASM2020128  │ María Fernanda García       │ Marketing│   12    │   0   │    Q0.00 │ Sin cuotas │
│             │                              │          │         │       │          │ pendientes │
│             │                              │          │         │       │          │ [👁 Ver]   │
└─────────────┴─────────────────────────────┴──────────┴─────────┴───────┴──────────┴────────────┘
```

## 4. Detail Modal

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  Detalle de Cuotas - Marta Julia de León Bolaños                         [X]  │
│  ASM2020126 - Master of Business Administration                               │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │ Información del Estudiante           │  │ Resumen Financiero           │  │
│  │                                      │  │                              │  │
│  │ Nombre: Marta Julia de León Bolaños │  │ Programa: MBA                │  │
│  │ Carnet: ASM2020126                   │  │ Saldo Pendiente: Q4,500.00   │  │
│  │ Correo: 20mjdel1@gmail.com          │  │ Cuotas Pagadas: 3            │  │
│  │ Teléfono: 58794155                   │  │ Cuotas Pendientes: 9         │  │
│  └──────────────────────────────────────┘  └──────────────────────────────┘  │
│                                                                                │
│  Historial de Cuotas                                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │ Cuota │ Vencimiento        │ Monto    │ Estado     │ Fecha de Pago    │   │
│  ├───────┼────────────────────┼──────────┼────────────┼──────────────────┤   │
│  │   1   │ 15 de noviembre... │ Q500.00  │ [Pagado]   │ 23/11/2024       │   │
│  │   2   │ 15 de diciembre... │ Q500.00  │ [Pagado]   │ 23/12/2024       │   │
│  │   3   │ 15 de enero...     │ Q500.00  │ [Pagado]   │ 23/01/2025       │   │
│  │   4   │ 15 de febrero...   │ Q500.00  │ Pendiente  │ -                │   │
│  │   5   │ 15 de marzo...     │ Q500.00  │ Pendiente  │ -                │   │
│  │  ...  │                    │          │            │                  │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ ℹ️  Próxima Cuota                                                       │  │
│  │ Cuota #4 - Vence el 15 de febrero de 2026 - Monto: Q500.00            │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│                                                       [Cerrar]                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Summary Cards
- Background: White with subtle shadow
- Text: Gray-800 for labels, Primary color for numbers
- Border: Light gray

### Status Badges
```
[Pagado]     = Green background (#10B981)    - Solid fill
[Vencido]    = Red background (#EF4444)      - Solid fill
[Pendiente]  = Gray outline (#6B7280)        - Outline only
```

### Table
- Header: Light blue gradient (from-blue-50 to-indigo-50)
- Rows: Alternating white and very light gray
- Hover: Light blue highlight
- Borders: Light gray (#E5E7EB)

### Typography
- Headings: Bold, 2xl-3xl size
- Subheadings: Medium, lg-xl size
- Body text: Regular, base size
- Small text: text-sm
- Muted text: text-muted-foreground (gray-500)

### Buttons
- Primary: Blue background, white text
- Ghost: Transparent background, hover light gray
- Icon size: h-4 w-4 (16px)

## Responsive Behavior

### Desktop (lg+)
- 4 columns for summary cards
- Full table with all columns
- Modal at max-w-4xl (896px)

### Tablet (md)
- 2 columns for summary cards
- Scrollable table if needed
- Modal at max-w-2xl

### Mobile (sm)
- 1 column for summary cards
- Stacked card layout for students
- Full-screen modal

## Icons Used

- 🔍 Search icon (Lucide: Search)
- 👁️ Eye icon for "Ver Detalle" (Lucide: Eye)
- ⏳ Loading spinner (Lucide: Loader2)
- ⚠️ Alert icon (Lucide: AlertCircle)
- ℹ️ Info icon for alerts

## Interactive Elements

### Hover States
- Table rows: Light blue background
- Buttons: Slightly darker background
- Cards: Subtle shadow increase

### Click Actions
1. Search input - Focus ring appears
2. Ver Detalle button - Opens modal with animation
3. Actualizar button - Shows loading state
4. Modal close - Smooth fade out

### Loading State
- Shows spinner with "Cargando datos..." text
- Center-aligned in content area
- Primary color animation

### Error State
- Red alert banner
- AlertCircle icon
- Error message from API
- Option to retry

### Empty State
- Gray text: "No se encontraron estudiantes"
- Center-aligned in table
- Suggests adjusting filters

## Animations

- Modal: Fade in/out with scale
- Status badges: No animation (solid)
- Table rows: Smooth hover transition
- Loading spinner: Continuous rotation
- Data refresh: Brief opacity transition

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy (h1, h2, h3, h4)
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators visible
- Color contrast meets WCAG AA standards

## Data Examples

### Currency Format
- Q500.00 (with 2 decimal places)
- Q1,234.56 (with thousands separator)
- Q22,500.00 (summary totals)

### Date Format
- Short: 15/02/2026
- Long: 15 de febrero de 2026
- Timestamp: 2024-11-23 18:30:45

### Student Data
- Carnet: ASM + Year + Number (ASM2020126)
- Name: Full name with proper capitalization
- Program: Official program name
- Email: Valid email format
- Phone: 8-digit phone number

## UI States Summary

1. **Initial Load**: Spinner visible
2. **Data Loaded**: Table with students visible
3. **Searching**: Debounced, shows filtered results
4. **No Results**: "No se encontraron" message
5. **Error**: Red alert with error message
6. **Modal Open**: Overlay with detail view
7. **Refreshing**: Button disabled, brief reload

---

This visual description matches the implemented component exactly as coded in `components/finanzas/seguimiento-estudiantes.tsx`.
