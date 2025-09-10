import api from './api'
import type {
  DatosPersonales,
  DatosLaborales,
  DatosAcademicos,
  DatosFinancieros,
  Documento,
} from '@/components/inscripcion/types'

export interface FichaDetalle {
  personales: Partial<DatosPersonales>
  laborales: Partial<DatosLaborales>
  academicos: Partial<DatosAcademicos>
  financieros: Partial<DatosFinancieros>
  programas: any[]
  documentos: Documento[]
}

async function buildFromProspecto(
  prospecto: any,
  fallbackId?: number,
): Promise<FichaDetalle> {
  // Algunas respuestas de la API envuelven el objeto en `data`
  prospecto = prospecto?.data ?? prospecto

  let convenioNombre: string | undefined
  if (prospecto.convenio?.nombre) {
    convenioNombre = prospecto.convenio.nombre
  } else if (prospecto.convenio_pago_id) {
    try {
      const { data } = await api.get(`/convenios/${prospecto.convenio_pago_id}`)
      convenioNombre = data?.nombre
    } catch {
      // ignore
    }
  }

  // Documentos
  const documentos: Documento[] = []
  const prospectoId = prospecto.id ?? fallbackId
  if (prospectoId) {
    try {
      const { data } = await api.get(`/documentos/prospecto/${prospectoId}`)
      if (Array.isArray(data)) {
        documentos.push(
          ...data.map((d: any) => ({
            ...d,
            estado: d.url ? 'cargado' : 'pendiente',
          })),
        )
      }
    } catch {
      // ignore
    }
  }

  // Departamento nombre
  let departamentoNombre = prospecto.departamento_nombre
  const depId = Number(prospecto.departamento)
  if (!departamentoNombre && !isNaN(depId)) {
    try {
      const pais =
        prospecto.pais_residencia_id ||
        prospecto.pais_id ||
        prospecto.pais_residencia ||
        ''
      const { data } = await api.get(`/ubicacion/${pais}`)
      const dep = data?.departamentos?.find((d: any) => d.id === depId)
      departamentoNombre = dep?.nombre
    } catch {
      // ignore
    }
  }

  const programa0 = prospecto.programas?.[0]
  const inscripcion =
    programa0?.inscripcion ??
    (prospecto.monto_inscripcion > 0 ? prospecto.monto_inscripcion : undefined)
  const cuotaMensual = programa0?.cuota_mensual
  const inversionTotal = programa0?.inversion_total

  return {
    personales: {
      nombre: prospecto.nombre_completo,
      paisOrigen: prospecto.pais_origen,
      paisResidencia: prospecto.pais_residencia,
      telefono: prospecto.telefono,
      dpi: prospecto.numero_identificacion,
      emailPersonal: prospecto.correo_electronico,
      emailCorporativo: prospecto.correo_corporativo,
      fechaNacimiento: prospecto.fecha_nacimiento,
      direccion: prospecto.direccion_residencia,
    },
    laborales: {
      empresa: prospecto.empresa_donde_labora_actualmente,
      puesto: prospecto.puesto,
      telefonoCorporativo: prospecto.telefono_corporativo,
      departamento: departamentoNombre,
      direccionEmpresa: prospecto.direccion_empresa,
      sectorEmpresa: prospecto.sector_empresa,
    },
    academicos: {
      modalidad: prospecto.modalidad,
      fechaInicioEspecifica: prospecto.fecha_inicio_especifica,
      fechaTallerInduccion: prospecto.fecha_taller_reduccion,
      fechaTallerIntegracion: prospecto.fecha_taller_integracion,
      institucionAnterior: prospecto.institucion_titulo,
      añoGraduacion: prospecto.anio_graduacion,
      medioConocio: prospecto.medio_conocimiento_institucion,
      cursosAprobados: prospecto.cantidad_cursos_aprobados,
      diaEstudio: prospecto.dia_estudio
        ? String(prospecto.dia_estudio).toLowerCase()
        : undefined,
    },
    financieros: {
      formaPago: prospecto.metodo_pago,
      convenioId: prospecto.convenio_pago_id,
      convenioNombre,
      inscripcion,
      cuotaMensual,
      inversionTotal,
    },
    programas: prospecto.programas || [],
    documentos,
  }
}

export async function fetchFicha(id: number): Promise<FichaDetalle> {
  try {
    const { data } = await api.get(`/fichas/${id}`)

    let documentos: Documento[] = []
    if (Array.isArray(data.documentos)) {
      documentos = data.documentos.map((d: any) => ({
        ...d,
        estado: d.url ? 'cargado' : 'pendiente',
      }))
    } else {
      try {
        const { data: docs } = await api.get(`/documentos/prospecto/${id}`)
        if (Array.isArray(docs)) {
          documentos = docs.map((d: any) => ({
            ...d,
            estado: d.url ? 'cargado' : 'pendiente',
          }))
        }
      } catch {
        // ignore
      }
    }

    const academicos = { ...data.academicos }
    const laborales = {
      ...data.laborales,
      departamento:
        data.laborales?.departamentoNombre || data.laborales?.departamento,
    }
    const financieros = {
      ...data.financieros,
      convenioNombre:
        data.financieros?.convenioNombre || data.financieros?.convenio?.nombre,
    }

    return {
      personales: data.personales || {},
      laborales,
      academicos,
      financieros,
      programas: data.programas || [],
      documentos,
    }
  } catch {
    const res = await api.get(`/prospectos/${id}`)
    const prospecto = res.data?.data ?? res.data
    return buildFromProspecto(prospecto, id)
  }
}

export default fetchFicha

