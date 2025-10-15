export type ContactTemplateType = 'overdue' | 'due_soon' | 'reminder'

type TemplateContext = {
  nombre: string
  programa?: string
  fecha?: string
  monto?: number
}

export function buildEmailTemplate(type: ContactTemplateType, context: TemplateContext) {
  const { nombre, programa, fecha, monto } = context

  switch (type) {
    case 'overdue':
      return {
        subject: `Recordatorio de pago atrasado - ${programa || 'Programa'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Recordatorio de Pago Atrasado</h2>
            <p>Estimado/a ${nombre},</p>
            <p>Le recordamos que tiene un pago pendiente por <strong>Q${monto?.toLocaleString('es-GT', { minimumFractionDigits: 2 }) || '0.00'}</strong> correspondiente a su programa ${programa || 'académico'}.</p>
            <p>Para evitar inconvenientes con su acceso a la plataforma, le solicitamos ponerse al día con sus pagos a la brevedad posible.</p>
            <p>Si ya realizó el pago, por favor ignore este mensaje.</p>
            <br>
            <p>Saludos cordiales,<br>Equipo Financiero ASM</p>
          </div>
        `
      }
    case 'due_soon':
      return {
        subject: `Recordatorio: Pago próximo a vencer - ${programa || 'Programa'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Recordatorio de Pago Próximo a Vencer</h2>
            <p>Estimado/a ${nombre},</p>
            <p>Le recordamos que tiene un pago de <strong>Q${monto?.toLocaleString('es-GT', { minimumFractionDigits: 2 }) || '0.00'}</strong> que vence el ${fecha || 'próximamente'}.</p>
            <p>Programa: ${programa || 'No especificado'}</p>
            <p>Para evitar recargos por mora, le recomendamos realizar el pago antes de la fecha de vencimiento.</p>
            <br>
            <p>Saludos cordiales,<br>Equipo Financiero ASM</p>
          </div>
        `
      }
    case 'reminder':
      return {
        subject: `Recordatorio general de pago - ${programa || 'Programa'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Recordatorio de Pago</h2>
            <p>Estimado/a ${nombre},</p>
            <p>Le recordamos mantener al día sus pagos correspondientes al programa ${programa || 'académico'}.</p>
            ${monto ? `<p>Monto pendiente: <strong>Q${monto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</strong></p>` : ''}
            <p>Si tiene alguna consulta sobre su estado de cuenta, no dude en contactarnos.</p>
            <br>
            <p>Saludos cordiales,<br>Equipo Financiero ASM</p>
          </div>
        `
      }
    default:
      return {
        subject: 'Recordatorio de pago',
        html: `<p>Estimado/a ${nombre}, le recordamos sobre su pago pendiente.</p>`
      }
  }
}

export function buildWhatsAppText(type: ContactTemplateType, context: TemplateContext) {
  const { nombre, programa, fecha, monto } = context

  switch (type) {
    case 'overdue':
      return `Hola ${nombre}, le recordamos que tiene un pago atrasado de Q${monto?.toLocaleString('es-GT', { minimumFractionDigits: 2 }) || '0.00'} del programa ${programa || 'académico'}. Por favor póngase al día para evitar inconvenientes. Si ya pagó, ignore este mensaje. Saludos, ASM.`
    
    case 'due_soon':
      return `Hola ${nombre}, su pago de Q${monto?.toLocaleString('es-GT', { minimumFractionDigits: 2 }) || '0.00'} del programa ${programa || 'académico'} vence el ${fecha || 'próximamente'}. Le recomendamos pagar antes del vencimiento para evitar recargos. Saludos, ASM.`
    
    case 'reminder':
      return `Hola ${nombre}, recordatorio para mantener al día sus pagos del programa ${programa || 'académico'}. ${monto ? `Monto pendiente: Q${monto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}. ` : ''}Para consultas, contáctenos. Saludos, ASM.`
    
    default:
      return `Hola ${nombre}, le recordamos sobre su pago pendiente. Saludos, ASM.`
  }
}