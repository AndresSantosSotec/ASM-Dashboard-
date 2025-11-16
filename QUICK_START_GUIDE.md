# 🎯 Quick Start Guide: Cuotas Dashboard

## Access the Dashboard

Simply navigate to: **`http://localhost:3000/webpanel/finanzas/reportes`**

Then click on the **"Cuotas"** tab.

---

## 📊 What You'll See

### 1. Summary Card (Top Right)
A card showing 4 key metrics:
```
Seguimiento de estudiantes
━━━━━━━━━━━━━━━━━━━━━━━━━━━
2959
Estudiantes Activos

Saldo estimado       Q22,500.00
En mora              0
Planes reestructurados  0
```

### 2. Filter Bar
Search and filter options:
```
[Buscar por estudiante, carnet, programa...]  [Estado de cuota ▼]  [Límite ▼]  [Restablecer] [Aplicar filtros]
```

### 3. Student Table
A comprehensive table with these columns:

| Estudiante | Programa | Saldo Pendiente | Cuotas Pendientes | Cuotas Pagadas | Próxima Cuota |
|-----------|----------|----------------|------------------|----------------|---------------|
| Marta Julia de León Bolaños<br>ASM2020126 · 58794155 | Master of Business Administration | Q4,500.00 | 9 | 3 | Cuota #4<br>15/2/2026<br>Q500.00 |
| ... | ... | ... | ... | ... | ... |

### 4. Pagination (Bottom)
```
Mostrando 1-10 de 2959 registros

Por página: [10 ▼]  [Anterior]  Página 1 de 296  [Siguiente]
```

---

## 🎨 Visual Features

### Color-coded Status Indicators
- 🟢 **Pagado** - Green badge
- 🟡 **Pendiente** - Yellow badge
- 🔴 **Vencido** - Red badge

### Responsive Design
- ✅ Works on desktop
- ✅ Works on tablet (horizontal scroll for table)
- ✅ Works on mobile (stacked filters)

### Interactive Elements
- ✅ Click column headers to view details
- ✅ Search updates results in real-time
- ✅ Filters can be combined
- ✅ Pagination preserves filter state

---

## 🔍 How to Use

### Search for a Student
1. Type in the search box: student name, carnet (e.g., "ASM2020126"), or program name
2. Click "Aplicar filtros"
3. Results update automatically

### Filter by Payment Status
1. Click the "Estado de cuota" dropdown
2. Select: Pendiente, Pagado, Pago parcial, or Vencido
3. Click "Aplicar filtros"

### Change Number of Results
1. Click the "Límite" dropdown
2. Select: 25, 50, 100, 200, or "Todos los registros"
3. Click "Aplicar filtros"

### Navigate Pages
1. Use the page size selector at the bottom: 10, 25, 50, 100, or "Todos"
2. Click "Anterior" or "Siguiente" to move between pages
3. Current page and total pages are shown in the middle

### Reset Filters
Click the "Restablecer" button to clear all filters and return to default view

---

## 📋 Data Displayed

### For Each Student
- **Name and Carnet** - Student identification
- **Phone** (if available) - Contact information
- **Program** - Academic program enrolled in
- **Outstanding Balance** - Total amount pending (in Quetzales)
- **Pending Payments** - Number of installments not yet paid
- **Paid Installments** - Number of installments already paid
- **Next Payment** - Details of the upcoming installment:
  - Installment number (e.g., "Cuota #4")
  - Due date (formatted as DD/MM/YYYY)
  - Amount (formatted as Q#,###.##)

### When No Next Payment
If a student has no upcoming payments, you'll see:
```
Sin próximas cuotas
```

---

## 🔄 Real-time Updates

The dashboard shows:
- **Timestamp** - When the data was last updated (bottom of summary card)
- **Loading State** - "Cargando información..." while fetching data
- **Error Messages** - Red alert if the API is unavailable

---

## 💡 Tips

### Best Practices
1. **Start with filters** - Use search or filters to narrow down results before browsing
2. **Increase page size** - For reports, set to 100 or "Todos" to see more data
3. **Export data** - While not shown in the UI, the data is available for export if needed
4. **Check timestamps** - Verify data freshness by checking the "Actualizado" timestamp

### Common Use Cases
1. **Find a specific student** - Use the search box with their carnet
2. **View overdue payments** - Filter by "Vencido"
3. **Check payment progress** - Compare "Cuotas Pagadas" vs "Cuotas Pendientes"
4. **Plan collections** - Sort by "Próxima Cuota" date (mental sorting, UI doesn't sort yet)

---

## 🚨 Troubleshooting

### "No se encontraron estudiantes"
- **Cause:** Filters are too restrictive or no data matches criteria
- **Solution:** Click "Restablecer" to clear filters

### Red Error Alert
- **Cause:** Backend API is not responding
- **Solution:** Check that the backend server is running at `http://localhost:8000`

### "Cargando información..." Never Completes
- **Cause:** Network timeout or backend is slow
- **Solution:** Refresh the page or check browser console for errors

### Data Looks Wrong
- **Cause:** Backend might need to sync data
- **Solution:** Contact the backend team to verify data integrity

---

## 🔗 Related Pages

- **Seguimiento de Estudiantes** (`/webpanel/finanzas/seguimiento-estudiantes`)
  - More detailed view with ability to create/edit/delete cuotas
  - View full payment history per student
  - Generate multiple installments at once

- **Kardex** (same page, different tab)
  - View all payment movements
  - See bank reconciliation status

- **Conciliaciones** (same page, different tab)
  - View bank records
  - Match payments to student accounts

---

## 📞 Support

For technical issues:
1. Check the browser console (F12) for error messages
2. Verify the backend API is running
3. Contact the development team with:
   - URL you were accessing
   - Error message (if any)
   - Steps to reproduce the issue
   - Screenshot of the problem

---

## 🎓 Technical Details (For Developers)

### Component Structure
```
ReportesFinancieros (reportes-financieros.tsx)
  └── Tabs
      ├── Kardex Tab
      ├── Reconciliaciones Tab
      └── Cuotas Tab ← You are here
          ├── Summary Card (lines 1047-1067)
          ├── Filter Bar (lines 865-966)
          ├── Student Table (lines 1306-1380)
          └── Pagination (line 1375)
```

### API Endpoint
```typescript
GET /api/mantenimientos/cuotas/dashboard
Headers: { Authorization: Bearer {token} }
Query Params:
  - search?: string
  - estado_cuota?: string
  - limit?: number
```

### Response Format
```json
{
  "summary": {
    "estudiantes_activos": number,
    "saldo_estimado": number,
    "en_mora": number,
    "planes_reestructurados": number
  },
  "estudiantes": [
    {
      "prospecto": { "nombre": string, "carnet": string, ... },
      "programa": { "nombre": string },
      "saldo_pendiente": number,
      "cuotas_pendientes": number,
      "cuotas_pagadas": number,
      "proxima_cuota": { "numero_cuota": number, "fecha_vencimiento": string, "monto": number } | null
    }
  ]
}
```

---

*Last updated: 2025-10-23*
*Version: 1.0*
