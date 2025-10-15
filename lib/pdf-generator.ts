import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AccountData } from "@/services/estudiantes"

// === Helpers de estilo ===
type RGB = [number, number, number]
const COLORS = {
  primary: [41, 128, 185] as RGB,
  secondary: [52, 73, 94] as RGB,
  success: [46, 204, 113] as RGB,
  danger: [231, 76, 60] as RGB,
  warning: [243, 156, 18] as RGB,
  lightGray: [236, 240, 241] as RGB,
}

const fmtMoney = (n: number | undefined | null) =>
  `Q ${(Number(n || 0)).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`

const fmtDate = (d?: string | number | Date | null) =>
  d ? new Date(d).toLocaleDateString('es-GT') : '—'

// === Layout fijo ===
const HEADER_HEIGHT = 30
const FOOTER_HEIGHT = 20
const LEFT = 15
const RIGHT = 15
const CONTENT_TOP = HEADER_HEIGHT + 10 // 40
const CONTENT_WIDTH = 210 - LEFT - RIGHT // A4: 210mm

// === Header/Footer globales con didDrawPage ===
function drawHeaderFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('ESTADO DE CUENTA ESTUDIANTIL', 20, 19)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Sistema de Gestión Académica', pageWidth - 80, 16)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-GT')}`, pageWidth - 80, 24)

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFillColor(...COLORS.lightGray)
  doc.rect(0, pageHeight - FOOTER_HEIGHT, pageWidth, FOOTER_HEIGHT, 'F')
  doc.setTextColor(...COLORS.secondary)
  doc.setFontSize(8)
  doc.text('Este documento es generado automáticamente por el sistema.', 20, pageHeight - 12)

  const totalPages = (doc as any).internal.pages?.length ?? 1
  const current = (doc as any).internal.getCurrentPageInfo().pageNumber
  doc.text(`Página ${current} de ${totalPages}`, pageWidth - 50, pageHeight - 12)
}

// Helper: salto de página para bloques NO-tabla
function ensureSpace(doc: jsPDF, cursorY: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  const limit = pageHeight - FOOTER_HEIGHT - 8 // 8px de respiro
  if (cursorY + needed > limit) {
    doc.addPage()
    return CONTENT_TOP
  }
  return cursorY
}

// === Generador principal (refleja el modal) ===
export const generateDetailedAccountStatePDF = async (data: AccountData) => {
  const doc = new jsPDF()

  // Defaults para TODAS las tablas (reserva header/footer)
  ;(doc as any).autoTableSetDefaults({
    margin: { top: CONTENT_TOP, bottom: FOOTER_HEIGHT + 8, left: LEFT, right: RIGHT },
    styles: { font: 'helvetica', fontSize: 10 },
    didDrawPage: () => drawHeaderFooter(doc),
    pageBreak: 'auto',
  })

  // ===== Sección: Información del estudiante =====
  let y = CONTENT_TOP

  // Caja de info (28px alto) con salto seguro si no cabe
  y = ensureSpace(doc, y, 28 + 16) // caja + títulos
  doc.setFillColor(...COLORS.lightGray)
  doc.rect(LEFT, y, CONTENT_WIDTH, 28, 'F')

  doc.setTextColor(...COLORS.secondary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('INFORMACIÓN DEL ESTUDIANTE', LEFT + 5, y + 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  y += 16
  const name = data.student?.name ?? '—'
  const carnet = data.student?.carnet ?? 'No asignado'
  const email =
    (data.student as any)?.email ??
    (data.student as any)?.correo ??
    'No disponible'

  doc.text(`Nombre: ${name}`, LEFT + 5, y)
  doc.text(`Carnet: ${carnet}`, LEFT + 110, y)
  y += 7
  doc.text(`Email: ${email}`, LEFT + 5, y)

  const statusText = data.balance?.isBlocked
    ? 'BLOQUEADO'
    : data.balance?.warningLevel === 2
    ? 'RIESGO DE BLOQUEO'
    : data.balance?.warningLevel === 1
    ? 'ADVERTENCIA'
    : 'AL DÍA'

  const statusColor: RGB = data.balance?.isBlocked
    ? COLORS.danger
    : data.balance?.warningLevel
    ? COLORS.warning
    : COLORS.success

  doc.text(`Estado: ${statusText}`, LEFT + 110, y)

  // Pastilla de estado
  doc.setFillColor(...statusColor)
  doc.rect(LEFT + CONTENT_WIDTH - 40, y - 5, 30, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.text(
    data.balance?.isBlocked ? 'BLOQUEADO' : data.balance?.warningLevel ? 'ALERTA' : 'AL DÍA',
    LEFT + CONTENT_WIDTH - 36,
    y - 0.5
  )

  doc.setTextColor(0, 0, 0)
  y += 18

  // ===== Sección: Resumen financiero =====
  y = ensureSpace(doc, y, 11 + 10)
  doc.setFillColor(...COLORS.primary)
  doc.rect(LEFT, y, CONTENT_WIDTH, 11, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('RESUMEN FINANCIERO', LEFT + 5, y + 8)
  y += 16

  const totalPending = (data.pendingPayments ?? []).reduce(
    (acc, p) => acc + Number(p.amount || 0) + Number(p.lateFee || 0), 0
  )
  const totalPaid = (data.paymentHistory ?? []).reduce(
    (acc, h) => acc + Number(h.amount || 0), 0
  )

  const summaryRows: any[] = [
    ['Total Pagado', fmtMoney(totalPaid), 'Aplicado'],
    ['Saldo Pendiente', fmtMoney(totalPending), totalPending > 0 ? 'Pendiente' : 'Completo'],
    ['Pagos Atrasados', String(data.balance?.latePayments ?? 0),
      (data.balance?.latePayments ?? 0) > 0 ? 'Requiere Atención' : 'Al Día'],
  ]

  if (data.balance?.nextDueDate) {
    const days = typeof data.balance?.daysUntilDue === 'number'
      ? (data.balance!.daysUntilDue >= 0 ? `${data.balance!.daysUntilDue} días`
        : `Vencido ${Math.abs(data.balance!.daysUntilDue)} días`)
      : 'Pendiente'
    summaryRows.push(['Próximo Vencimiento', fmtDate(data.balance.nextDueDate), days])
  }

  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Monto/Fecha', 'Estado']],
    body: summaryRows,
    theme: 'grid',
    margin: { top: CONTENT_TOP, bottom: FOOTER_HEIGHT + 8, left: LEFT, right: RIGHT }, // ✅ refuerzo
    headStyles: {
      fillColor: COLORS.primary as RGB,
      textColor: [255, 255, 255] as RGB,
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [248, 249, 250] as RGB },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 60, halign: 'right' },
      2: { cellWidth: 40, halign: 'center' },
    },
    pageBreak: 'auto',
  })

  let lastY = (doc as any).lastAutoTable.finalY || y
  y = lastY + 16

  // ===== Sección: Pagos pendientes =====
  const pending = data.pendingPayments ?? []
  if (pending.length > 0) {
    y = ensureSpace(doc, y, 8 + 6)
    doc.setTextColor(...COLORS.secondary)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('PAGOS PENDIENTES', LEFT, y)
    y += 8

    const pendingRows = pending.map(p => [
      p.concept,
      fmtDate(p.dueDate),
      fmtMoney((Number(p.amount || 0) + Number(p.lateFee || 0))),
      p.status === 'vencido' ? `Vencido${p.daysLate ? ` (${p.daysLate} días)` : ''}` : 'Pendiente',
    ])

    autoTable(doc, {
      startY: y,
      head: [['Concepto', 'Vencimiento', 'Monto', 'Estado']],
      body: pendingRows,
      theme: 'striped',
      margin: { top: CONTENT_TOP, bottom: FOOTER_HEIGHT + 8, left: LEFT, right: RIGHT }, // ✅ refuerzo
      headStyles: {
        fillColor: COLORS.warning as RGB,
        textColor: [255, 255, 255] as RGB,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 75 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'center' },
      },
      pageBreak: 'auto',
    })

    lastY = (doc as any).lastAutoTable.finalY || y
    y = lastY + 16
  }

  // ===== Sección: Historial de pagos =====
  const history = data.paymentHistory ?? []
  y = ensureSpace(doc, y, 8 + 6)
  doc.setTextColor(...COLORS.secondary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('HISTORIAL DE PAGOS', LEFT, y)
  y += 8

  if (history.length === 0) {
    y = ensureSpace(doc, y, 10)
    doc.setTextColor(80)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Sin pagos registrados', LEFT, y + 4)
  } else {
    const historyRows = history.map(h => [
      fmtDate(h.paymentDate),
      h.concept ?? '—',
      h.method ?? '—',
      h.reference ?? '—',
      fmtMoney(h.amount),
    ])

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Concepto', 'Método', 'Referencia', 'Monto']],
      body: historyRows,
      theme: 'striped',
      margin: { top: CONTENT_TOP, bottom: FOOTER_HEIGHT + 8, left: LEFT, right: RIGHT }, // ✅ refuerzo
      headStyles: {
        fillColor: COLORS.success as RGB,
        textColor: [255, 255, 255] as RGB,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 80 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
      },
      styles: { overflow: 'linebreak' },
      pageBreak: 'auto',
    })
  }

  // === Guardar ===
  const fileName = `estado_cuenta_${data.student?.carnet ?? data.student?.id ?? 'sin_id'}_${new Date()
    .toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
