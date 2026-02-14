import { createTheme } from 'react-data-table-component'

// Registrar tema oscuro para react-data-table-component
// Solo se ejecuta una vez al importar este módulo
let themesRegistered = false

export function registerDataTableThemes() {
  if (themesRegistered) return
  
  createTheme('asmDark', {
    text: {
      primary: '#e1e6ed',      // soft white-blue
      secondary: '#a8b3c0',    // muted text
    },
    background: {
      default: '#1a2744',      // dark blue comfortable
    },
    context: {
      background: '#253552',   // medium dark blue
      text: '#e1e6ed',
    },
    divider: {
      default: 'rgba(58, 74, 102, 0.5)',  // subtle border
    },
    button: {
      default: '#c9a94d',      // warm gold
      hover: 'rgba(201, 169, 77, 0.2)',
      focus: 'rgba(201, 169, 77, 0.3)',
      disabled: 'rgba(225, 230, 237, 0.4)',
    },
    sortFocus: {
      default: '#c9a94d',      // warm gold
    },
    highlightOnHover: {
      default: 'rgba(37, 53, 82, 0.7)',   // medium dark blue hover
      text: '#e1e6ed',
    },
  }, 'dark')
  
  themesRegistered = true
}

// Llamar automáticamente al importar
registerDataTableThemes()

/**
 * Obtiene el nombre del tema de DataTable basado en el tema del sistema
 * @param resolvedTheme - El tema resuelto de next-themes ('light' | 'dark')
 * @returns El nombre del tema para DataTable
 */
export function getDataTableTheme(resolvedTheme: string | undefined): string {
  return resolvedTheme === 'dark' ? 'asmDark' : 'default'
}

/**
 * Estilos personalizados para DataTable que respetan el tema
 */
export const dataTableCustomStyles = {
  light: {
    headCells: {
      style: {
        backgroundColor: '#f8fafc',
        fontWeight: '600',
        color: '#213362',
      },
    },
    cells: {
      style: {
        color: '#213362',
      },
    },
  },
  dark: {
    headCells: {
      style: {
        backgroundColor: '#253552',  // medium dark blue
        fontWeight: '600',
        color: '#e1e6ed',            // soft white-blue
      },
    },
    cells: {
      style: {
        color: '#e1e6ed',            // soft white-blue
      },
    },
  },
}

export function getDataTableStyles(resolvedTheme: string | undefined) {
  return resolvedTheme === 'dark' ? dataTableCustomStyles.dark : dataTableCustomStyles.light
}
