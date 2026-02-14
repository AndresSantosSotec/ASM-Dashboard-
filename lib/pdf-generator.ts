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
const HEADER_HEIGHT = 30
const FOOTER_HEIGHT = 18
const LEFT = 15
const RIGHT = 15
const CONTENT_TOP = HEADER_HEIGHT + 10 // 60
const CONTENT_WIDTH = 210 - LEFT - RIGHT // A4: 210mm

// === Función para cargar imagen ===
async function loadImageAsBase64(imagePath: string): Promise<string | null> {
  try {
    // Si la imagen ya está en base64, retornarla
    if (imagePath.startsWith('data:')) {
      return imagePath
    }
    
    // Cargar imagen desde la ruta
    const response = await fetch(imagePath)
    if (!response.ok) {
      console.warn(`Imagen no encontrada: ${imagePath}`)
      return null
    }
    
    const blob = await response.blob()
    
    // Verificar que sea una imagen válida
    if (!blob.type.startsWith('image/')) {
      console.warn(`El archivo no es una imagen: ${imagePath}`)
      return null
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        // Verificar que el resultado sea válido
        if (result && result.length > 0) {
          resolve(result)
        } else {
          resolve(null)
        }
      }
      reader.onerror = () => {
        console.warn(`Error leyendo imagen: ${imagePath}`)
        resolve(null)
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.warn('Error cargando imagen:', error)
    return null
  }
}

// === Header/Footer con imagen ===
function drawHeaderFooter(doc: jsPDF, headerImage?: string | null, footerImage?: string | null) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Header: fondo azul institucional + logo superpuesto
  doc.setFillColor(30, 38, 77) // #1e264d - Azul institucional ASM
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F')
  // Línea dorada decorativa
  doc.setFillColor(176, 139, 79) // #b08b4f
  doc.rect(0, HEADER_HEIGHT - 3, pageWidth, 3, 'F')

  if (headerImage && headerImage.length > 0) {
    try {
      if (headerImage.startsWith('data:image/')) {
        // Logo proporcionado dentro del header azul
        const logoHeight = 12
        const logoWidth = logoHeight * 3.2
        const logoY = (HEADER_HEIGHT - 3 - logoHeight) / 2
        doc.addImage(headerImage, 'PNG', 12, logoY, logoWidth, logoHeight)
      }
    } catch (error) {
      // Si falla el logo, mostrar texto
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('AMERICAN SCHOOL OF MANAGEMENT', 15, HEADER_HEIGHT / 2 + 1)
    }
  } else {
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('AMERICAN SCHOOL OF MANAGEMENT', 15, HEADER_HEIGHT / 2 + 1)
  }

  // Footer con logos
  doc.setFillColor(30, 38, 77)
  doc.rect(0, pageHeight - FOOTER_HEIGHT, pageWidth, FOOTER_HEIGHT, 'F')
  // Línea dorada arriba del footer
  doc.setFillColor(176, 139, 79)
  doc.rect(0, pageHeight - FOOTER_HEIGHT, pageWidth, 2, 'F')
  
  if (footerImage && footerImage.length > 0) {
    try {
      if (footerImage.startsWith('data:image/')) {
        // Footer con logos centrados - tamaño proporcional
        const fLogoHeight = 7
        const fLogoWidth = fLogoHeight * 3.5
        const fLogoX = (pageWidth - fLogoWidth) / 2
        const fLogoY = pageHeight - FOOTER_HEIGHT + 3
        doc.addImage(footerImage, 'PNG', fLogoX, fLogoY, fLogoWidth, fLogoHeight)
      }
    } catch (error) {
      // Silenciar error del footer
    }
  }

  // Información adicional en el footer
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('American School of Management - Documento generado automáticamente', 10, pageHeight - 4)

  const totalPages = (doc as any).internal.pages?.length ?? 1
  const current = (doc as any).internal.getCurrentPageInfo().pageNumber
  doc.text(`Página ${current} de ${totalPages}`, pageWidth - 50, pageHeight - 4)
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
  headerImagePath: string = '/recursos/Logos-02.png',
  footerImagePath: string = '/recursos/Logos_Mesa.png'
) => {
  const doc = new jsPDF()

  // Cargar imágenes con rutas por defecto
  const headerImage = await loadImageAsBase64(headerImagePath)
  const footerImage = await loadImageAsBase64(footerImagePath)

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

  // 🔥 MEJORA: Calcular altura dinámica según si hay programas
  const programas = (data as any).programas ?? []
  const boxHeight = programas.length > 0 ? 45 : 35
  
  y = ensureSpace(doc, y, boxHeight)
  doc.setFillColor(...COLORS.lightGray)
  doc.rect(LEFT, y, CONTENT_WIDTH, boxHeight, 'F')

  doc.setTextColor(...COLORS.secondary)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  
  const name = data.student?.name ?? '—'
  const carnet = data.student?.carnet ?? 'No asignado'
  // 🔥 CORRECCIÓN: Buscar email en el campo correcto
  const email = data.student?.email ?? (data.student as any)?.correo ?? ''

  y += 8
  doc.text(`Nombre: ${name}`, LEFT + 5, y)
  y += 7
  doc.text(`Carnet: ${carnet}`, LEFT + 5, y)
  // 🔥 Solo mostrar email si existe
  if (email && email.trim() !== '') {
    doc.text(`Email: ${email}`, LEFT + 90, y)
  }
  
  // 🔥 NUEVO: Mostrar programas si existen
  if (programas.length > 0) {
    y += 7
    const programasStr = programas.map((p: any) => p.abreviatura || p.nombre || '').filter(Boolean).join(', ')
    doc.text(`Programa(s): ${programasStr || 'No asignado'}`, LEFT + 5, y)
  }
  
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

    // 🔥 MEJORA: Agrupar por programa
    const programasUnicos = [...new Set(pending.map(p => (p as any).programa_nombre || 'Sin programa'))].filter(Boolean)
    const tieneMultiplesProgramas = programasUnicos.length > 1

    // 🔥 MEJORA: Crear filas con marcador de pago especial y programa
    const pendingRows = pending.map(p => {
      const esEspecial = (p as any).es_especial === true
      const programaNombre = tieneMultiplesProgramas ? ((p as any).programa_nombre || '') : ''
      // Agregar [*] si es pago especial (inscripción, matrícula, etc.)
      const concepto = esEspecial 
        ? `[*] ${p.concept}` 
        : p.concept
      
      return [
        programaNombre ? `[${programaNombre}] ${concepto}` : concepto,
        fmtDate(p.dueDate),
        fmtMoney(Number(p.amount || 0)), // Solo monto base
        p.status === 'vencido' ? `Vencido${p.daysLate ? ` (${p.daysLate}d)` : ''}` : 'Pendiente',
      ]
    })

    // 🔥 Agregar filas de totales si hay mora
    const totalMora = (data.balance?.totalMora ?? 0)
    const totalPendiente = pending.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const totalConMora = totalPendiente + totalMora

    if (totalMora > 0) {
      pendingRows.push(
        ['', '', '', ''], // Fila vacía
        ['', 'Mora (recargo único):', fmtMoney(totalMora), ''], // Mora única Q50
        ['', 'TOTAL A PAGAR:', fmtMoney(totalConMora), ''] // Total con mora
      )
    } else {
      pendingRows.push(
        ['', '', '', ''], // Fila vacía
        ['', 'TOTAL PENDIENTE:', fmtMoney(totalPendiente), '']
      )
    }

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
        1: { cellWidth: 28 },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 29, halign: 'center' },
      },
      didParseCell: (data: any) => {
        // 🔥 Resaltar las filas de totales
        const rowCount = pendingRows.length
        if (data.row.index >= rowCount - 2) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [240, 240, 240] as RGB
        }
        // 🔥 Resaltar pagos especiales con color amarillo claro
        if (data.row.index < pending.length && (pending[data.row.index] as any)?.es_especial) {
          data.cell.styles.fillColor = [255, 253, 231] as RGB // Amarillo claro
        }
      },
      pageBreak: 'auto',
    })

    // 🔥 NUEVO: Agregar leyenda si hay pagos especiales
    const tieneEspeciales = pending.some(p => (p as any).es_especial)
    if (tieneEspeciales) {
      lastY = (doc as any).lastAutoTable.finalY || y
      y = lastY + 3
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('[*] = Pago especial (inscripcion, matricula, u otro cargo extraordinario)', LEFT, y)
      y += 5
    }

    lastY = (doc as any).lastAutoTable.finalY || y
    y = lastY + 12
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
    // 🔥 MEJORA: Agrupar por programa
    const programasUnicos = [...new Set(history.map(h => (h as any).programa_nombre || 'Sin programa'))].filter(Boolean)
    const tieneMultiplesProgramas = programasUnicos.length > 1

    // Total general de todos los programas
    const totalPagadoGeneral = history.reduce((sum, h) => sum + Number(h.amount || 0), 0)

    if (tieneMultiplesProgramas) {
      // 🔥 AGRUPADO POR PROGRAMA
      for (const programa of programasUnicos) {
        // Filtrar historial de este programa
        const historialProgramaRaw = history.filter(h => ((h as any).programa_nombre || 'Sin programa') === programa)
        
        if (historialProgramaRaw.length === 0) continue

        // 🔥 ORDENAR: Pagos especiales primero, luego por fecha descendente
        const historialPrograma = [...historialProgramaRaw].sort((a, b) => {
          const aEspecial = (a as any).es_especial === true ? 1 : 0
          const bEspecial = (b as any).es_especial === true ? 1 : 0
          // Especiales primero (1 antes que 0)
          if (bEspecial !== aEspecial) return bEspecial - aEspecial
          // Luego por fecha más reciente
          const fechaA = new Date(a.paymentDate || 0).getTime()
          const fechaB = new Date(b.paymentDate || 0).getTime()
          return fechaB - fechaA
        })

        // Subtítulo del programa
        y = ensureSpace(doc, y, 20)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(80, 80, 80)
        doc.text(`>> ${programa}`, LEFT, y)
        y += 6

        // Crear filas de este programa
        const historyRows = historialPrograma.map(h => {
          const esEspecial = (h as any).es_especial === true
          let concepto = h.concept ?? '—'
          if (esEspecial) {
            concepto = `[*] ${concepto}`
          }
          return [
            fmtDate(h.paymentDate),
            concepto,
            h.method ?? '—',
            h.reference ?? '—',
            fmtMoney(h.amount),
          ]
        })

        // Subtotal del programa
        const subtotalPrograma = historialPrograma.reduce((sum, h) => sum + Number(h.amount || 0), 0)
        historyRows.push(
          ['', '', '', 'Subtotal:', fmtMoney(subtotalPrograma)]
        )

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
            1: { cellWidth: 65 },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 30, halign: 'center' },
            4: { cellWidth: 25, halign: 'right' },
          },
          styles: { overflow: 'linebreak' },
          didParseCell: (data: any) => {
            // Resaltar fila de subtotal
            if (data.row.index === historyRows.length - 1) {
              data.cell.styles.fontStyle = 'bold'
              data.cell.styles.fillColor = [230, 255, 230] as RGB
            }
            // Resaltar pagos especiales
            if (data.row.index < historialPrograma.length && (historialPrograma[data.row.index] as any)?.es_especial) {
              data.cell.styles.fillColor = [255, 253, 231] as RGB
            }
          },
          pageBreak: 'auto',
        })

        y = (doc as any).lastAutoTable.finalY + 8
      }

      // 🔥 Total general al final
      y = ensureSpace(doc, y, 15)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(0, 100, 0)
      doc.text(`TOTAL PAGADO (todos los programas): ${fmtMoney(totalPagadoGeneral)}`, LEFT, y)
      y += 8

    } else {
      // 🔥 UN SOLO PROGRAMA - Sin agrupación pero ordenado
      // Ordenar: Pagos especiales primero, luego por fecha descendente
      const historyOrdenado = [...history].sort((a, b) => {
        const aEspecial = (a as any).es_especial === true ? 1 : 0
        const bEspecial = (b as any).es_especial === true ? 1 : 0
        // Especiales primero (1 antes que 0)
        if (bEspecial !== aEspecial) return bEspecial - aEspecial
        // Luego por fecha más reciente
        const fechaA = new Date(a.paymentDate || 0).getTime()
        const fechaB = new Date(b.paymentDate || 0).getTime()
        return fechaB - fechaA
      })

      const historyRows = historyOrdenado.map(h => {
        const esEspecial = (h as any).es_especial === true
        let concepto = h.concept ?? '—'
        if (esEspecial) {
          concepto = `[*] ${concepto}`
        }
        return [
          fmtDate(h.paymentDate),
          concepto,
          h.method ?? '—',
          h.reference ?? '—',
          fmtMoney(h.amount),
        ]
      })

      // Total pagado
      historyRows.push(
        ['', '', '', '', ''],
        ['', '', '', 'TOTAL PAGADO:', fmtMoney(totalPagadoGeneral)]
      )

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
          1: { cellWidth: 65 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' },
          4: { cellWidth: 25, halign: 'right' },
        },
        styles: { overflow: 'linebreak' },
        didParseCell: (data: any) => {
          // Resaltar fila de total
          const rowCount = historyRows.length
          if (data.row.index >= rowCount - 2) {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = [230, 255, 230] as RGB
          }
          // Resaltar pagos especiales (usar historyOrdenado, no history)
          if (data.row.index < historyOrdenado.length && (historyOrdenado[data.row.index] as any)?.es_especial) {
            data.cell.styles.fillColor = [255, 253, 231] as RGB
          }
        },
        pageBreak: 'auto',
      })
    }

    // 🔥 Leyenda si hay pagos especiales
    const tieneEspeciales = history.some(h => (h as any).es_especial)
    if (tieneEspeciales) {
      y = (doc as any).lastAutoTable?.finalY || y
      y += 3
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('[*] = Pago especial (inscripcion, matricula, u otro cargo extraordinario)', LEFT, y)
    }
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
  headerImagePath: string = '/recursos/Logos-02.png',
  footerImagePath: string = '/recursos/Logos_Mesa.png'
) {
  const doc = new jsPDF()
  
  // Cargar imágenes con logos institucionales
  const headerImage = await loadImageAsBase64(headerImagePath)
  const footerImage = await loadImageAsBase64(footerImagePath)
  
  const primaryColor: RGB = [37, 99, 235]
  const secondaryColor: RGB = [139, 92, 246]
  const successColor: RGB = [22, 163, 74]
  const warningColor: RGB = [234, 179, 8]
  const dangerColor: RGB = [220, 38, 38]
  const grayColor: RGB = [107, 114, 128]
  
  let yPosition = CONTENT_TOP

  // HEADER: fondo azul institucional + logo
  doc.setFillColor(30, 38, 77)
  doc.rect(0, 0, 210, HEADER_HEIGHT, 'F')
  doc.setFillColor(176, 139, 79)
  doc.rect(0, HEADER_HEIGHT - 3, 210, 3, 'F')
  if (headerImage) {
    try {
      const logoHeight = 12
      const logoWidth = logoHeight * 3.2
      const logoY = (HEADER_HEIGHT - 3 - logoHeight) / 2
      doc.addImage(headerImage, 'PNG', 12, logoY, logoWidth, logoHeight)
    } catch (e) {
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('AMERICAN SCHOOL OF MANAGEMENT', 15, HEADER_HEIGHT / 2 + 1)
    }
  } else {
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('AMERICAN SCHOOL OF MANAGEMENT', 15, HEADER_HEIGHT / 2 + 1)
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
      margin: { top: CONTENT_TOP, bottom: FOOTER_HEIGHT + 10, left: 10, right: 10 },
      pageBreak: 'auto',
      didDrawPage: function(hookData) {
        // Redibujar header en páginas nuevas
        if (hookData.pageNumber > 1) {
          doc.setFillColor(30, 38, 77)
          doc.rect(0, 0, 210, HEADER_HEIGHT, 'F')
          doc.setFillColor(176, 139, 79)
          doc.rect(0, HEADER_HEIGHT - 3, 210, 3, 'F')
          if (headerImage) {
            try {
              const lh = 12, lw = lh * 3.2
              doc.addImage(headerImage, 'PNG', 12, (HEADER_HEIGHT - 3 - lh) / 2, lw, lh)
            } catch(e) {}
          }
        }
      },
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

  // FOOTER con logos institucionales
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    // Fondo azul del footer
    doc.setFillColor(30, 38, 77)
    doc.rect(0, 297 - FOOTER_HEIGHT, 210, FOOTER_HEIGHT, 'F')
    // Línea dorada
    doc.setFillColor(176, 139, 79)
    doc.rect(0, 297 - FOOTER_HEIGHT, 210, 2, 'F')
    
    if (footerImage) {
      try {
        const fLogoHeight = 7
        const fLogoWidth = fLogoHeight * 3.5
        const fLogoX = (210 - fLogoWidth) / 2
        const fLogoY = 297 - FOOTER_HEIGHT + 3
        doc.addImage(footerImage, 'PNG', fLogoX, fLogoY, fLogoWidth, fLogoHeight)
      } catch (e) {
        // Silenciar
      }
    }
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.text(
      `American School of Management - Generado: ${new Date().toLocaleDateString('es-GT', { 
        year: 'numeric', month: 'long', day: 'numeric'
      })}`,
      10, 297 - 4
    )
    doc.text(`Página ${i} de ${pageCount}`, 200, 297 - 4, { align: 'right' })
  }

  const fileName = `Reporte_${data.studentInfo.carnet}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}