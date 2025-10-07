# Programación de Cursos - Implementation Summary

## What Was Implemented

This implementation creates a dynamic, month-organized calendar for viewing course schedules from Moodle. The key improvement over the previous static implementation is that it now fetches real data from the backend and intelligently organizes it.

## Visual Layout

### Header Section
```
┌─────────────────────────────────────────────────────────┐
│ Programación de Cursos            [Mensual] [Semanal]   │
└─────────────────────────────────────────────────────────┘
```

### Calendar Navigation
```
┌─────────────────────────────────────────────────────────┐
│  [◄]  Marzo 2025  [►]             Total: 15 cursos     │
└─────────────────────────────────────────────────────────┘
```

### Course Display by Day of Week
```
┌─────────────────────────────────────────────────────────┐
│ 📅 Lunes (3 cursos)                                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ Programación │ │ Matemáticas  │ │ Base de      │   │
│  │ Básica       │ │ I            │ │ Datos        │   │
│  │              │ │              │ │              │   │
│  │ Inicio: 1/3  │ │ Inicio: 8/3  │ │ Inicio: 15/3 │   │
│  │ Fin: 30/3    │ │ Fin: 30/3    │ │ Fin: 30/3    │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📅 Martes (2 cursos)                                     │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐                     │
│  │ Diseño Web   │ │ Inglés I     │                     │
│  │ ...          │ │ ...          │                     │
│  └──────────────┘ └──────────────┘                     │
└─────────────────────────────────────────────────────────┘

... (continues for each day with courses)
```

### Summary Sections
```
┌─────────────────────┐  ┌──────────────────────────────┐
│ Próximos Inicios    │  │ Resumen por Día de la Semana │
├─────────────────────┤  ├──────────────────────────────┤
│ 🔵 Programación     │  │ [Lun: 3] [Mar: 2] [Mié: 4]  │
│    Básica           │  │ [Jue: 3] [Vie: 2] [Sáb: 1]  │
│    Inicia: 1 mar    │  │ [Dom: 0]                     │
│                     │  │                              │
│ 🟢 Matemáticas I    │  │  Visual bars showing         │
│    Inicia: 8 mar    │  │  distribution                │
│                     │  │                              │
│ 🟣 Base de Datos    │  └──────────────────────────────┘
│    Inicia: 15 mar   │
└─────────────────────┘
```

## Key Features Explained

### 1. Dynamic Data Fetching
- On page load, calls `/api/moodle/programacion-cursos`
- Displays loading spinner while fetching
- Shows error message if fetch fails

### 2. Smart Course Organization
The backend SQL query extracts metadata from course names:
- **Month**: Extracted using regex (Enero, Febrero, etc.)
- **Day**: Extracted using regex (Lunes, Martes, etc.)
- **Year**: Extracted using regex (4-digit year)
- **Course Name**: Cleaned by removing date metadata

### 3. Month Navigation
- Automatically identifies all available months from the data
- Allows navigation between months
- Disables prev/next buttons at boundaries
- Updates display when month changes

### 4. Visual Feedback
- Color-coded course cards
- Hover effects on course cards
- Empty state when no courses exist
- Course count indicators

## Data Flow

```
Moodle Database
    ↓
Laravel Backend (MoodleQueryService::programacionCursos)
    ↓
    Extracts: dia_semana, mes, anio from course names
    Cleans: coursename (removes date metadata)
    ↓
API Endpoint: /api/moodle/programacion-cursos
    ↓
Frontend Service (services/programacionCursos.ts)
    ↓
    fetchProgramacionCursos()
    getUniqueMonths()
    ↓
React Component (app/admin/programacion-cursos/page.tsx)
    ↓
    useState: courses, currentMonth, loading, error
    useEffect: Load data on mount
    Filter: currentMonthCourses
    Group: By dia_semana
    ↓
UI Display: Calendar View by Day of Week
```

## Example Course Name Processing

**Original Moodle Course Name:**
```
"Marzo Lunes 2025 PROG Introducción a la Programación"
```

**Backend Extraction:**
- mes: "Marzo"
- dia_semana: "Lunes"
- anio: "2025"

**Cleaned Course Name:**
```
"Introducción a la Programación"
```

## Benefits Over Previous Implementation

### Before
- Static hardcoded data
- No real backend integration
- Calendar grid view (by day numbers 1-31)
- No organization by day of week

### After
- ✅ Dynamic data from Moodle via backend
- ✅ Real-time loading states
- ✅ Error handling
- ✅ Organized by day of week (more intuitive for class schedules)
- ✅ Month navigation based on actual data
- ✅ Summary statistics
- ✅ Cleaner, more maintainable code
- ✅ Smaller bundle size (5.02 kB vs 8.79 kB)

## Testing Checklist

When the backend is available, verify:
- [ ] Page loads without errors
- [ ] Loading spinner appears while fetching
- [ ] Courses display correctly organized by month
- [ ] Courses are grouped by day of week
- [ ] Month navigation works (prev/next buttons)
- [ ] Course names are cleaned (no date metadata)
- [ ] Start/end dates display correctly
- [ ] "Próximos Inicios" shows up to 5 courses
- [ ] "Resumen por Día" shows correct counts
- [ ] Empty state shows when no courses exist
- [ ] Error message displays on API failure

## Maintenance Notes

### Adding New Features
1. **Weekly View**: Implement in the `currentView === "week"` condition
2. **Filters**: Add filter state and modify `currentMonthCourses` filter
3. **Search**: Add search input and filter by coursename
4. **Export**: Use the existing `currentMonthCourses` data for export

### Backend Dependencies
- Requires Laravel backend with Moodle connection
- Requires `MoodleQueryService::programacionCursos()` method
- Requires route `/api/moodle/programacion-cursos`
- Expects authentication token in localStorage

### Configuration
- API URL configured in `utils/apiConfig.ts`
- Uses environment variable `NEXT_PUBLIC_API_URL`
- Default: `http://127.0.0.1:8080`
