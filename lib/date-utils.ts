import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatDate = (date: Date, formatStr: string = 'PPP') => {
  return format(date, formatStr, { locale: es })
}

export const dateLocale = {
  locale: {
    ...es,
    options: { weekStartsOn: 1 }
  }
}