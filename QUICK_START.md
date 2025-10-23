# 🚀 Quick Start Guide - Seguimiento de Estudiantes

## For Developers

### Access the Feature
```
URL: http://localhost:3000/webpanel/finanzas/reportes
Tab: "Seguimiento Estudiantes" (first tab)
```

### File Locations
```
types/cuotas.ts                              # Type definitions
services/mantenimientos.ts                   # API service
components/finanzas/seguimiento-estudiantes.tsx   # Main component
```

### Basic Usage
```typescript
import { getCuotasDashboard } from '@/services/mantenimientos';

// Fetch all students
const data = await getCuotasDashboard({ limit: 200 });

// Search by name/carnet
const filtered = await getCuotasDashboard({ 
  search: 'ASM2020',
  limit: 100 
});

// Filter by program
const byProgram = await getCuotasDashboard({ 
  programa_id: 18 
});
```

### API Endpoint
```
GET http://localhost:8000/api/mantenimientos/cuotas/dashboard?limit=200&search=ASM2020
Headers: {
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

### Key Components
```typescript
// Summary metrics
summary: {
  estudiantes_activos: number
  saldo_estimado: number
  en_mora: number
  planes_reestructurados: number
}

// Student data
estudiantes[]: {
  prospecto: { id, nombre, carnet, correo, telefono }
  programa: { id, nombre }
  saldo_pendiente: number
  cuotas_pendientes: number
  cuotas_pagadas: number
  proxima_cuota: {...} | null
  cuotas: [{...}]
}
```

### Formatting Utilities
```typescript
// Currency
formatCurrency(4500) // "Q4,500.00"

// Date
formatDate("2026-02-15") // "15 de febrero de 2026"

// Status Badge
getStatusBadge("pagado")    // Green badge
getStatusBadge("vencido")   // Red badge
getStatusBadge("pendiente") // Gray outline
```

### Testing Locally
```bash
# Backend (Laravel)
cd backend && php artisan serve

# Frontend (Next.js)
cd frontend && npm run dev

# Open browser
http://localhost:3000/webpanel/finanzas/reportes
```

### Common Issues

**Error: "No se encontraron estudiantes"**
- Check backend is running
- Verify token is valid
- Check database has active students

**Error: Network/API Error**
- Verify NEXT_PUBLIC_API_URL is set
- Check CORS settings on backend
- Ensure token is not expired

**Build Error**
- Run `npm install` to ensure dependencies
- Ignore pre-existing errors in programacion-cursos

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## For Users

### How to Use
1. Navigate to Finanzas > Reportes
2. Click "Seguimiento Estudiantes" tab
3. View summary cards at top
4. Search for specific student
5. Click "Ver Detalle" to see full history
6. Review payment status with color badges
7. Click "Actualizar" to refresh data

### Understanding the Data

**Summary Cards:**
- Estudiantes Activos = Total active students
- Saldo Pendiente = Total money owed by all
- Cuotas en Mora = Overdue payments
- Planes Reestructurados = Restructured plans

**Status Badges:**
- 🟢 Pagado = Paid
- 🔴 Vencido = Overdue
- ⚪ Pendiente = Pending

**Search:**
Type student name or carnet (e.g., "ASM2020")
Wait 0.5 seconds for results

---

## Quick Reference

| Feature | Status |
|---------|--------|
| Summary Dashboard | ✅ Working |
| Student Table | ✅ Working |
| Search Function | ✅ Working |
| Detail Modal | ✅ Working |
| Currency Format | ✅ Q1,234.56 |
| Date Format | ✅ Spanish |
| Status Badges | ✅ Color-coded |
| Loading State | ✅ Spinner |
| Error Handling | ✅ Alerts |
| Responsive | ✅ Mobile/Desktop |

---

## Documentation

📚 **Full Docs:**
- Technical: `docs/seguimiento-estudiantes-integration.md`
- Implementation: `IMPLEMENTATION_DETAILS.md`
- UI Design: `docs/UI_VISUAL_DESCRIPTION.md`

---

**Need Help?** Check the documentation files above for detailed information.
