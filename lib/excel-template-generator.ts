/**
 * Generador de plantillas Excel (.xlsx) adaptativas
 * Genera archivos Excel formateados basándose en la configuración de columnas
 * registrada en el sistema (mapeos columna BD → columna Excel).
 */
import ExcelJS from "exceljs"

interface ColumnConfig {
  name: string          // column_name en BD
  excelName: string     // nombre que aparece como encabezado en el Excel
  columnNumber: number  // orden de la columna
}

/** Datos de ejemplo por nombre de columna BD */
const EXAMPLE_DATA: Record<string, string> = {
  nombre_completo: "Juan Pérez López",
  correo_electronico: "juan.perez@ejemplo.com",
  telefono: "50212345678",
  genero: "masculino",
  empresa_donde_labora_actualmente: "Empresa Guatemala S.A.",
  puesto: "Gerente de Operaciones",
  pais: "Guatemala",
  departamento: "Guatemala",
  municipio: "Ciudad de Guatemala",
  interes: "MBA Ejecutivo",
  Origen: "facebook",
  origen: "facebook",
  notas_generales: "Interesado en programa ejecutivo",
  observaciones: "Disponible horario nocturno",
  status: "Nuevo",
  nota_1: "",
  nota_2: "",
  nota_3: "",
  cierre: "",
  fecha_nacimiento: "1990-05-15",
  nit: "1234567-8",
  direccion: "12 Calle 5-20 Zona 10",
  nivel_academico: "Licenciatura",
  universidad: "Universidad San Carlos de Guatemala",
  carrera: "Administración de Empresas",
}

/** Columnas por defecto si no hay configuración registrada */
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { name: "nombre_completo", excelName: "Nombre Completo", columnNumber: 1 },
  { name: "correo_electronico", excelName: "Correo Electrónico", columnNumber: 2 },
  { name: "telefono", excelName: "Teléfono", columnNumber: 3 },
  { name: "genero", excelName: "Género", columnNumber: 4 },
  { name: "empresa_donde_labora_actualmente", excelName: "Empresa", columnNumber: 5 },
  { name: "puesto", excelName: "Puesto", columnNumber: 6 },
  { name: "pais", excelName: "País", columnNumber: 7 },
  { name: "departamento", excelName: "Departamento", columnNumber: 8 },
  { name: "municipio", excelName: "Municipio", columnNumber: 9 },
  { name: "interes", excelName: "Interés", columnNumber: 10 },
  { name: "origen", excelName: "Origen", columnNumber: 11 },
  { name: "notas_generales", excelName: "Notas Generales", columnNumber: 12 },
  { name: "observaciones", excelName: "Observaciones", columnNumber: 13 },
]

/**
 * Genera y descarga una plantilla Excel (.xlsx) adaptativa.
 *
 * @param columns - Lista de columnas configuradas en el sistema.
 *                  Si está vacía, se usan columnas por defecto.
 * @param fileName - Nombre del archivo descargado (sin extensión).
 */
export async function downloadExcelTemplate(
  columns: ColumnConfig[],
  fileName: string = "plantilla_importacion"
): Promise<void> {
  const cols =
    columns.length > 0
      ? [...columns].sort((a, b) => a.columnNumber - b.columnNumber)
      : DEFAULT_COLUMNS

  // ── Crear workbook y worksheet ───────────────────────────────
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Gaia Business School"
  workbook.created = new Date()

  const ws = workbook.addWorksheet("Datos", {
    properties: { defaultColWidth: 22 },
    views: [{ state: "frozen", ySplit: 2 }], // Congelar las 2 primeras filas
  })

  // ── Fila 1: Título informativo ──────────────────────────────
  const titleRow = ws.getRow(1)
  ws.mergeCells(1, 1, 1, cols.length)
  const titleCell = ws.getCell(1, 1)
  titleCell.value = `Plantilla de Importación — Gaia Business School  |  ⚠️ IMPORTANTE: BORRE LA FILA 3 (ejemplo), LA FILA 1 Y LA HOJA "Instrucciones" ANTES DE IMPORTAR  |  Columnas: ${cols.length}  |  ${new Date().toLocaleDateString("es-GT")}`
  titleCell.font = { size: 10, bold: true, italic: true, color: { argb: "FFCC0000" } }
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFF3CD" },
  }
  titleCell.alignment = { horizontal: "center", vertical: "middle" }
  titleRow.height = 24

  // ── Fila 2: Encabezados ─────────────────────────────────────
  const headerRow = ws.getRow(2)
  cols.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = col.excelName
    cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0E2B49" }, // Azul oscuro Gaia
    }
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
    cell.border = {
      top: { style: "thin", color: { argb: "FF0D2137" } },
      bottom: { style: "thin", color: { argb: "FF0D2137" } },
      left: { style: "thin", color: { argb: "FF0D2137" } },
      right: { style: "thin", color: { argb: "FF0D2137" } },
    }
  })
  headerRow.height = 30

  // ── Fila 3: Ejemplo de datos (DEBE BORRARSE) ───────────────
  const exampleRow = ws.getRow(3)
  cols.forEach((col, idx) => {
    const cell = exampleRow.getCell(idx + 1)
    cell.value = EXAMPLE_DATA[col.name] || ""
    cell.font = { size: 10, italic: true, color: { argb: "FF888888" } }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF3CD" }, // Fondo amarillo de advertencia
    }
    cell.alignment = { vertical: "middle" }
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
    }
  })

  // ── Columna extra de advertencia en fila 3 ─────────────────
  const warningCell = exampleRow.getCell(cols.length + 1)
  warningCell.value = "⚠️ BORRE ESTA FILA (fila 3), LA FILA 1 Y LA HOJA \"Instrucciones\" ANTES DE IMPORTAR"
  warningCell.font = { bold: true, size: 11, color: { argb: "FFCC0000" } }
  warningCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFF3CD" },
  }
  ws.getColumn(cols.length + 1).width = 52

  // ── Ajustar ancho de columnas ───────────────────────────────
  cols.forEach((col, idx) => {
    const header = col.excelName
    const example = EXAMPLE_DATA[col.name] || ""
    const maxLen = Math.max(header.length, example.length, 12)
    ws.getColumn(idx + 1).width = Math.min(maxLen + 4, 40)
  })

  // ── Hoja de instrucciones ───────────────────────────────────
  const instrWs = workbook.addWorksheet("Instrucciones")
  instrWs.getColumn(1).width = 6
  instrWs.getColumn(2).width = 70

  const instrucciones = [
    ["", "📋 INSTRUCCIONES DE USO DE LA PLANTILLA"],
    ["", ""],
    ["", "🚨🚨🚨  ADVERTENCIA IMPORTANTE  🚨🚨🚨"],
    ["", ""],
    ["", "ANTES DE IMPORTAR EL ARCHIVO DEBE BORRAR:"],
    ["", "   ❌  FILA 1  →  La fila del título (la que dice \"Plantilla de Importación...\")"],
    ["", "   ❌  FILA 3  →  La fila de ejemplo (datos ficticios en gris/cursiva)"],
    ["", "   ❌  HOJA \"Instrucciones\"  →  Esta hoja que está leyendo (clic derecho → Eliminar)"],
    ["", ""],
    ["", "Si NO borra estas filas, se importarán como si fueran datos reales"],
    ["", "y dañarán la base de datos con información basura."],
    ["", ""],
    ["", "─────────────────────────────────────────────────────────────"],
    ["", ""],
    ["", "PASOS PARA USAR ESTA PLANTILLA:"],
    ["", ""],
    ["1.", "Vaya a la hoja \"Datos\"."],
    ["2.", "BORRE la fila 1 (título amarillo) y la fila 3 (ejemplo en gris)."],
    ["3.", "Los encabezados (fila azul) quedarán en la fila 1. NO los modifique."],
    ["4.", "Ingrese sus datos a partir de la fila 2 (debajo de los encabezados)."],
    ["5.", "NO cambie el nombre de los encabezados, deben coincidir exactamente."],
    ["6.", "Los campos se basan en la configuración registrada en el sistema."],
    ["7.", "Guarde el archivo en formato .xlsx, .xls o .csv antes de importar."],
    ["8.", "Tamaño máximo recomendado: 5,000 filas por archivo."],
    ["", ""],
    ["", "─────────────────────────────────────────────────────────────"],
    ["", ""],
    ["", "COLUMNAS CONFIGURADAS:"],
  ]

  cols.forEach((col, i) => {
    instrucciones.push([`${i + 1}.`, `${col.excelName}  →  campo BD: ${col.name}`])
  })

  instrucciones.push(["", ""])
  instrucciones.push(["", `Generada el ${new Date().toLocaleString("es-GT")}`])

  instrucciones.forEach((row, rowIdx) => {
    const r = instrWs.getRow(rowIdx + 1)
    r.getCell(1).value = row[0]
    r.getCell(2).value = row[1]
    if (rowIdx === 0) {
      r.getCell(2).font = { bold: true, size: 14, color: { argb: "FF1E3A5F" } }
    }
    // Filas de advertencia (índices 3-10: la sección 🚨)
    if (rowIdx >= 2 && rowIdx <= 11) {
      r.getCell(2).font = { bold: true, size: 12, color: { argb: "FFCC0000" } }
      r.getCell(2).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFF3CD" },
      }
    }
    if (row[0] && row[0] !== "") {
      r.getCell(1).font = { bold: true, size: 11 }
    }
  })

  // ── Generar y descargar ─────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${fileName}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
