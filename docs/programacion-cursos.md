# Programación de Cursos - Dynamic Calendar

## Overview
This module provides a dynamic calendar view for course scheduling, organized by months and days of the week. The data is fetched from Moodle through the backend API.

## Features

### 1. Monthly Course Organization
- Courses are automatically organized by month and year
- Navigation between available months using prev/next buttons
- Shows total count of courses per month

### 2. Day of Week Grouping
- Courses are grouped by day of the week (Lunes, Martes, Miércoles, etc.)
- Each day section shows the count of courses scheduled for that day
- Visual cards display course details including:
  - Course name (cleaned of date metadata)
  - Start date (fecha_inicio)
  - End date (fecha_fin)

### 3. Summary Sections
- **Próximos Inicios**: Shows up to 5 upcoming courses with color-coded cards
- **Resumen por Día de la Semana**: Visual summary showing course distribution across weekdays

### 4. Loading States
- Loading spinner while fetching data
- Error handling with user-friendly messages

## Backend Integration

### Endpoint
```
GET /api/moodle/programacion-cursos
```

### Expected Response Format
```typescript
{
  data: [
    {
      courseid: number,
      coursename: string,
      fecha_inicio: string,  // ISO date format
      fecha_fin: string,     // ISO date format
      dia_semana: string,    // "Lunes" | "Martes" | "Miércoles" | etc.
      mes: string,           // "Enero" | "Febrero" | "Marzo" | etc.
      anio: string           // "2025" | etc.
    },
    ...
  ]
}
```

### Data Extraction
The backend extracts course metadata from Moodle course names using regex patterns:
- **Day of week**: Matches "Lunes", "Martes", "Miércoles", etc.
- **Month**: Matches "Enero", "Febrero", "Marzo", etc.
- **Year**: Extracts 4-digit year (e.g., "2025")

## Usage

### Navigation
1. Use the left/right chevron buttons to navigate between months
2. The current month is displayed in the header
3. Total course count is shown in the top-right

### View Options
- **Mensual**: Shows courses organized by day of week (default)
- **Semanal**: Placeholder for future weekly view implementation

### Course Details
Hover over any course card to see a tooltip with full details:
- Complete course name
- Start date
- End date

## File Structure

```
app/admin/programacion-cursos/
  └── page.tsx              # Main page component

services/
  └── programacionCursos.ts # Service for fetching and organizing course data
```

## Service Functions

### `fetchProgramacionCursos()`
Fetches course programming data from the backend.

**Returns**: `Promise<ProgramacionCurso[]>`

### `getUniqueMonths(courses)`
Extracts and sorts unique month-year combinations from courses.

**Parameters**: 
- `courses`: Array of ProgramacionCurso objects

**Returns**: `string[]` - Sorted array of "Mes YYYY" strings

### `organizeCoursesByMonth(courses)`
Groups courses by month and year.

**Parameters**: 
- `courses`: Array of ProgramacionCurso objects

**Returns**: Object with month-year keys and course arrays as values

## Future Enhancements
- Weekly view implementation
- Filter by program
- Export to PDF/Excel
- Add/edit course scheduling functionality
- Sync status with Moodle
