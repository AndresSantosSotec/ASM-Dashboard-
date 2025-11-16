interface StudentExportData {
  id: string
  nombre_completo: string
  carnet: string
  correo_electronico: string
  programa: string
  estado: string
  cursos_aprobados?: number | null
  cursos_reprobados?: number | null
  cursos_en_progreso?: number | null
  total_cursos?: number | null
  promedio?: number | null
  creditos_completados?: number | null
  creditos_totales?: number | null
}

/**
 * Exporta lista de estudiantes a formato CSV
 */
export function exportToCSV(students: StudentExportData[]) {
  // Definir las columnas
  const headers = [
    'ID',
    'Nombre Completo',
    'Carnet',
    'Correo Electrónico',
    'Programa Académico',
    'Estado',
    'Cursos Aprobados',
    'Cursos Reprobados',
    'Cursos En Progreso',
    'Total Cursos',
    'Promedio (GPA)',
    'Créditos Completados',
    'Créditos Totales'
  ]

  // Crear las filas
  const rows = students.map(student => [
    student.id,
    `"${student.nombre_completo}"`, // Comillas para nombres con comas
    student.carnet,
    student.correo_electronico,
    `"${student.programa}"`,
    student.estado,
    student.cursos_aprobados ?? 'N/A',
    student.cursos_reprobados ?? 'N/A',
    student.cursos_en_progreso ?? 'N/A',
    student.total_cursos ?? 'N/A',
    student.promedio ? student.promedio.toFixed(2) : 'N/A',
    student.creditos_completados ?? 'N/A',
    student.creditos_totales ?? 'N/A'
  ])

  // Combinar headers y rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Agregar BOM para Excel con UTF-8
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // Crear link de descarga
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `estudiantes_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Exporta lista de estudiantes a formato Excel (XLSX simulado con HTML table)
 */
export function exportToExcel(students: StudentExportData[]) {
  // Crear una tabla HTML que Excel puede interpretar
  const headers = [
    'ID',
    'Nombre Completo',
    'Carnet',
    'Correo Electrónico',
    'Programa Académico',
    'Estado',
    'Cursos Aprobados',
    'Cursos Reprobados',
    'Cursos En Progreso',
    'Total Cursos',
    'Promedio (GPA)',
    'Créditos Completados',
    'Créditos Totales'
  ]

  let tableHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Estudiantes</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; width: 100%; }
        th { 
          background-color: #2563eb; 
          color: white; 
          font-weight: bold; 
          padding: 10px; 
          border: 1px solid #ddd;
          text-align: left;
        }
        td { 
          padding: 8px; 
          border: 1px solid #ddd;
        }
        tr:nth-child(even) { background-color: #f9fafb; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `

  students.forEach(student => {
    tableHTML += `
      <tr>
        <td>${student.id}</td>
        <td>${student.nombre_completo}</td>
        <td>${student.carnet}</td>
        <td>${student.correo_electronico}</td>
        <td>${student.programa}</td>
        <td>${student.estado}</td>
        <td>${student.cursos_aprobados ?? 'N/A'}</td>
        <td>${student.cursos_reprobados ?? 'N/A'}</td>
        <td>${student.cursos_en_progreso ?? 'N/A'}</td>
        <td>${student.total_cursos ?? 'N/A'}</td>
        <td>${student.promedio ? student.promedio.toFixed(2) : 'N/A'}</td>
        <td>${student.creditos_completados ?? 'N/A'}</td>
        <td>${student.creditos_totales ?? 'N/A'}</td>
      </tr>
    `
  })

  tableHTML += `
        </tbody>
      </table>
    </body>
    </html>
  `

  // Crear blob y descargar
  const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `estudiantes_${new Date().toISOString().split('T')[0]}.xls`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
