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

// === Layout con imagen ===
const HEADER_HEIGHT = 50 // Aumentado para la imagen
const FOOTER_HEIGHT = 30 // Aumentado para el footer con logos
const LEFT = 15
const RIGHT = 15
const CONTENT_TOP = HEADER_HEIGHT + 10 // 60
const CONTENT_WIDTH = 210 - LEFT - RIGHT // A4: 210mm

// === Función para cargar imagen ===
async function loadImageAsBase64(imagePath: string): Promise<string> {
  try {
    // Si la imagen ya está en base64, retornarla
    if (imagePath.startsWith('data:')) {
      return imagePath
    }
    
    // Cargar imagen desde la ruta
    const response = await fetch(imagePath)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error cargando imagen:', error)
    return ''
  }
}

// === Header/Footer con imagen ===
function drawHeaderFooter(doc: jsPDF, headerImage?: string, footerImage?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Header con imagen
  if (headerImage) {
    try {
      // Agregar la imagen de header (ajusta las dimensiones según tu imagen)
      doc.addImage(headerImage, 'PNG', 0, 0, pageWidth, HEADER_HEIGHT)
    } catch (error) {
      console.error('Error agregando imagen de header:', error)
      // Fallback: header con color sólido
      doc.setFillColor(30, 41, 59) // Color similar al de tu imagen
      doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F')
    }
  } else {
    // Fallback si no hay imagen
    doc.setFillColor(30, 41, 59)
    doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F')
  }

  // Footer con logos
  doc.setFillColor(30, 41, 59)
  doc.rect(0, pageHeight - FOOTER_HEIGHT, pageWidth, FOOTER_HEIGHT, 'F')
  
  if (footerImage) {
    try {
      // Agregar imagen del footer con los logos
      doc.addImage(footerImage, 'PNG', 0, pageHeight - FOOTER_HEIGHT, pageWidth, FOOTER_HEIGHT)
    } catch (error) {
      console.error('Error agregando imagen de footer:', error)
    }
  }

  // Información adicional en el footer
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Este documento es generado automáticamente por el sistema.', 20, pageHeight - 12)

  const totalPages = (doc as any).internal.pages?.length ?? 1
  const current = (doc as any).internal.getCurrentPageInfo().pageNumber
  doc.text(`Página ${current} de ${totalPages}`, pageWidth - 50, pageHeight - 12)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-GT')}`, pageWidth - 50, pageHeight - 8)
}

// Helper: salto de página para bloques NO-tabla
function ensureSpace(doc: jsPDF, cursorY: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  const limit = pageHeight - FOOTER_HEIGHT - 8
  if (cursorY + needed > limit) {
    doc.addPage()
    return CONTENT_TOP
  }
  return cursorY
}

// === Generador principal con imágenes ===
export const generateDetailedAccountStatePDF = async (
  data: AccountData,
  headerImagePath: string = '/image.png', // Ruta a tu imagen de header
  footerImagePath?: string // Opcional: imagen para footer
) => {
  const doc = new jsPDF()

  // Cargar imágenes
  const headerImage = await loadImageAsBase64(headerImagePath)
  const footerImage = footerImagePath ? await loadImageAsBase64(footerImagePath) : undefined

  // Defaults para TODAS las tablas
  ;(doc as any).autoTableSetDefaults({
    margin: { top: CONTENT_TOP, bottom: FOOTER_HEIGHT + 8, left: LEFT, right: RIGHT },
    styles: { font: 'helvetica', fontSize: 10 },
    didDrawPage: () => drawHeaderFooter(doc, headerImage, footerImage),
    pageBreak: 'auto',
  })

  // ===== Sección: Información del estudiante =====
  let y = CONTENT_TOP

  // Título de la sección
  doc.setFillColor(...COLORS.primary)
  doc.rect(LEFT, y, CONTENT_WIDTH, 11, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('INFORMACIÓN DEL ESTUDIANTE', LEFT + 5, y + 8)
  y += 16

  // Caja de info
  y = ensureSpace(doc, y, 35)
  doc.setFillColor(...COLORS.lightGray)
  doc.rect(LEFT, y, CONTENT_WIDTH, 35, 'F')

  doc.setTextColor(...COLORS.secondary)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  
  const name = data.student?.name ?? '—'
  const carnet = data.student?.carnet ?? 'No asignado'
  const email = (data.student as any)?.email ?? (data.student as any)?.correo ?? 'No disponible'

  y += 8
  doc.text(`Nombre: ${name}`, LEFT + 5, y)
  y += 7
  doc.text(`Carnet: ${carnet}`, LEFT + 5, y)
  doc.text(`Email: ${email}`, LEFT + 110, y)
  
  y += 7
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

  doc.text(`Estado: ${statusText}`, LEFT + 5, y)

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

// ====================================
// REPORTE ACADÉMICO DEL ESTUDIANTE
// (Misma estructura, actualizada)
// ====================================

interface StudentReportData {
  studentInfo: {
    name: string
    carnet: string
    email: string
    program: string
    programCode: string
    status: string
  }
  academicInfo: {
    coursesApproved: number
    coursesFailed: number
    coursesInProgress: number
    totalCourses: number
    credits: { completed: number; total: number }
    gpa: number
    semester: number
  } | null
  financialInfo: {
    enrollmentFee: number
    monthlyFee: number
    pendingPayments: number
    totalDebt: number
    paymentStatus: string
  } | null
  courses: Array<{
    name: string
    code: string
    credits: number
    period: string
    status: string
    grade: number | null
  }>
}

export async function generateStudentReport(
  data: StudentReportData,
  headerImagePath: string = '/image.png',
  footerImagePath?: string
) {
  const doc = new jsPDF()
  
  // Cargar imágenes
  const headerImage = await loadImageAsBase64(headerImagePath)
  const footerImage = footerImagePath ? await loadImageAsBase64(footerImagePath) : undefined
  
  const primaryColor: RGB = [37, 99, 235]
  const secondaryColor: RGB = [139, 92, 246]
  const successColor: RGB = [22, 163, 74]
  const warningColor: RGB = [234, 179, 8]
  const dangerColor: RGB = [220, 38, 38]
  const grayColor: RGB = [107, 114, 128]
  
  let yPosition = CONTENT_TOP

  // HEADER con imagen
  if (headerImage) {
    doc.addImage(headerImage, 'PNG', 0, 0, 210, HEADER_HEIGHT)
  }

  // INFORMACIÓN DEL ESTUDIANTE
  doc.setFillColor(243, 244, 246)
  doc.rect(10, yPosition, 190, 45, 'F')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Información del Estudiante', 15, yPosition + 10)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const studentData = [
    { label: 'Nombre:', value: data.studentInfo.name },
    { label: 'Carnet:', value: data.studentInfo.carnet },
    { label: 'Email:', value: data.studentInfo.email },
    { label: 'Programa:', value: `${data.studentInfo.program} ${data.studentInfo.programCode ? `(${data.studentInfo.programCode})` : ''}` },
    { label: 'Estado:', value: data.studentInfo.status === 'active' ? 'Activo' : 
                                  data.studentInfo.status === 'inactive' ? 'Inactivo' : 
                                  data.studentInfo.status === 'graduated' ? 'Graduado' : data.studentInfo.status }
  ]
  
  let infoY = yPosition + 20
  studentData.forEach(item => {
    doc.setFont('helvetica', 'bold')
    doc.text(item.label, 15, infoY)
    doc.setFont('helvetica', 'normal')
    doc.text(item.value, 50, infoY)
    infoY += 7
  })
  
  yPosition += 55

  // RESUMEN ACADÉMICO
  if (data.academicInfo) {
    doc.setFillColor(...primaryColor)
    doc.rect(10, yPosition, 190, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen Académico', 15, yPosition + 6)
    
    yPosition += 15
    
    const cardWidth = 45
    const cardHeight = 25
    const cardSpacing = 2
    const startX = 10
    
    const stats = [
      { label: 'Promedio', value: data.academicInfo.gpa.toFixed(2), color: primaryColor, subtitle: 'GPA' },
      { label: 'Cursos Aprobados', value: data.academicInfo.coursesApproved.toString(), color: successColor, subtitle: `de ${data.academicInfo.totalCourses}` },
      { label: 'Créditos', value: data.academicInfo.credits.completed.toString(), color: secondaryColor, subtitle: `de ${data.academicInfo.credits.total}` },
      { label: 'Semestre', value: data.academicInfo.semester.toString(), color: warningColor, subtitle: 'actual' }
    ]
    
    stats.forEach((stat, index) => {
      const x = startX + (index * (cardWidth + cardSpacing))
      doc.setFillColor(250, 250, 250)
      doc.roundedRect(x, yPosition, cardWidth, cardHeight, 2, 2, 'F')
      doc.setFillColor(...stat.color)
      doc.roundedRect(x, yPosition, cardWidth, 3, 1, 1, 'F')
      doc.setTextColor(...stat.color)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(stat.value, x + cardWidth / 2, yPosition + 12, { align: 'center' })
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(stat.label, x + cardWidth / 2, yPosition + 18, { align: 'center' })
      doc.setTextColor(...grayColor)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(stat.subtitle, x + cardWidth / 2, yPosition + 22, { align: 'center' })
    })
    
    yPosition += cardHeight + 10
    
    const progressPercent = data.academicInfo.credits.total > 0
      ? (data.academicInfo.credits.completed / data.academicInfo.credits.total) * 100 : 0
    
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Progreso Académico', 15, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(`${Math.round(progressPercent)}% Completado`, 195, yPosition, { align: 'right' })
    yPosition += 5
    doc.setFillColor(229, 231, 235)
    doc.roundedRect(15, yPosition, 180, 4, 2, 2, 'F')
    doc.setFillColor(...primaryColor)
    doc.roundedRect(15, yPosition, (180 * progressPercent) / 100, 4, 2, 2, 'F')
    yPosition += 15
  }

  // TABLA DE CURSOS
  doc.setFillColor(...secondaryColor)
  doc.rect(10, yPosition, 190, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Historial de Cursos', 15, yPosition + 6)
  yPosition += 12

  if (data.courses.length > 0) {
    const coursesTableData = data.courses.map(course => [
      course.name,
      course.period,
      course.credits.toString(),
      course.grade !== null ? course.grade.toFixed(1) : 'N/A',
      course.status === 'approved' ? 'Aprobado' :
      course.status === 'failed' ? 'Reprobado' : 'En Progreso'
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Curso', 'Período', 'Créd.', 'Nota', 'Estado']],
      body: coursesTableData,
      theme: 'grid',
      headStyles: {
        fillColor: secondaryColor,
        textColor: [255, 255, 255] as RGB,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: { fontSize: 8, textColor: [0, 0, 0] as RGB },
      alternateRowStyles: { fillColor: [249, 250, 251] as RGB },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' }
      },
      didParseCell: function(cellData) {
        if (cellData.section === 'body' && cellData.column.index === 4) {
          const status = cellData.cell.raw as string
          if (status === 'Aprobado') {
            cellData.cell.styles.textColor = successColor
            cellData.cell.styles.fontStyle = 'bold'
          } else if (status === 'Reprobado') {
            cellData.cell.styles.textColor = dangerColor
            cellData.cell.styles.fontStyle = 'bold'
          } else {
            cellData.cell.styles.textColor = primaryColor
            cellData.cell.styles.fontStyle = 'bold'
          }
        }
      }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 10
  } else {
    doc.setTextColor(...grayColor)
    doc.setFontSize(10)
    doc.text('No se encontraron cursos registrados', 105, yPosition + 10, { align: 'center' })
    yPosition += 20
  }

  // FOOTER
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    if (footerImage) {
      doc.addImage(footerImage, 'PNG', 0, 297 - FOOTER_HEIGHT, 210, FOOTER_HEIGHT)
    } else {
      doc.setFillColor(...grayColor)
      doc.rect(0, 287, 210, 10, 'F')
    }
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text(
      `Generado: ${new Date().toLocaleDateString('es-GT', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })}`,
      15, 293
    )
    doc.text(`Página ${i} de ${pageCount}`, 195, 293, { align: 'right' })
  }

  const fileName = `Reporte_${data.studentInfo.carnet}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}